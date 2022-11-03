/*
 * Copyright 2022 Nordeck IT + Consulting GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { compareOriginServerTS, StateEvent } from '@matrix-widget-toolkit/api';
import { createEntityAdapter, EntityState } from '@reduxjs/toolkit';
import { isEqual, isError, last } from 'lodash';
import { DateTime } from 'luxon';
import { bufferTime, filter } from 'rxjs';
import {
  IPoll,
  isValidPollEvent,
  migratePollSchema,
  PollStartEvent,
  ROOM_EVENT_POLL_START,
  STATE_EVENT_POLL,
} from '../../model';
import { ThunkExtraArgument } from '../store';
import { baseApi } from './baseApi';

// Use an entity adapter to efficiently interact with a collection of events.
// The adapter provides selectors and reducers to read and manipulate a state.
const pollsEntityAdapter = createEntityAdapter<StateEvent<IPoll>>({
  selectId: (event) => event.state_key,
  sortComparer: (a, b) => {
    if (a.content.startTime && b.content.startTime) {
      const delta =
        new Date(b.content.startTime).getTime() -
        new Date(a.content.startTime).getTime();

      if (delta < 0 || delta > 0) {
        return delta;
      }
    }

    if (a.content.startTime && !b.content.startTime) {
      return -1;
    }

    if (!a.content.startTime && b.content.startTime) {
      return 1;
    }

    return compareOriginServerTS(a, b);
  },
});

export const pollApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Return the poll events of a room.
     */
    getPolls: builder.query<EntityState<StateEvent<IPoll>>, void>({
      queryFn: async (_, { extra }) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const initialState = pollsEntityAdapter.getInitialState();

          const events = await widgetApi.receiveStateEvents(STATE_EVENT_POLL);

          return {
            data: pollsEntityAdapter.addMany(
              initialState,
              events.filter(isValidPollEvent).map(migratePollSchema)
            ),
          };
        } catch (e) {
          return {
            error: {
              name: 'LoadFailed',
              message: `Could not load polls: ${isError(e) ? e.message : e}`,
            },
          };
        }
      },

      async onCacheEntryAdded(
        _,
        { cacheDataLoaded, cacheEntryRemoved, extra, updateCachedData }
      ) {
        const { widgetApi } = extra as ThunkExtraArgument;

        // wait until first data is cached
        await cacheDataLoaded;

        const subscription = widgetApi
          .observeStateEvents(STATE_EVENT_POLL)
          .pipe(
            bufferTime(0),
            filter((list) => list.length > 0)
          )
          .subscribe((events) => {
            // update the cached data if the event changes in the room
            const eventsToUpdate = events
              .filter(isValidPollEvent)
              .map(migratePollSchema);
            const eventIdsToDelete = events
              .filter(
                (e) => e.type === STATE_EVENT_POLL && isEqual(e.content, {})
              )
              .map((e) => e.state_key);

            updateCachedData((state) => {
              pollsEntityAdapter.upsertMany(state, eventsToUpdate);
              pollsEntityAdapter.removeMany(state, eventIdsToDelete);
            });
          });

        // wait until subscription is cancelled
        await cacheEntryRemoved;

        subscription.unsubscribe();
      },
    }),

    /**
     * Update the poll event in the current room.
     */
    updatePoll: builder.mutation<
      { event: StateEvent<IPoll> },
      { pollId: string; content: IPoll }
    >({
      async queryFn({ pollId, content }, { extra }) {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const pollEvents = await widgetApi.receiveStateEvents(
            STATE_EVENT_POLL,
            { stateKey: pollId }
          );
          const pollEvent = last(pollEvents.filter(isValidPollEvent));

          // No recursive merge!
          const poll = { ...(pollEvent?.content ?? {}), ...content };

          if (pollEvent && isEqual(pollEvent.content, poll)) {
            // No change necessary
            return { data: { event: pollEvent } };
          }

          const event = await widgetApi.sendStateEvent(STATE_EVENT_POLL, poll, {
            stateKey: pollId,
          });

          return { data: { event } };
        } catch (e) {
          return {
            error: {
              name: 'UpdateFailed',
              message: `Could not update poll: ${isError(e) ? e.message : e}`,
            },
          };
        }
      },
    }),

    /**
     * Start the poll in the current room.
     */
    startPoll: builder.mutation<{}, { pollId: string }>({
      async queryFn({ pollId }, { extra }) {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const pollEvents = await widgetApi.receiveStateEvents(
            STATE_EVENT_POLL,
            { stateKey: pollId }
          );
          const pollEvent = last(pollEvents.filter(isValidPollEvent));

          if (
            !pollEvent ||
            typeof pollEvent.content.startTime === 'string' ||
            typeof pollEvent.content.endTime === 'string' ||
            typeof pollEvent.content.startEventId === 'string'
          ) {
            return { data: {} };
          }

          const startEvent = await widgetApi.sendRoomEvent<PollStartEvent>(
            ROOM_EVENT_POLL_START,
            {}
          );

          const startTime = DateTime.now();
          const duration = pollEvent.content.duration;
          const endTime = startTime.plus({ minutes: duration });

          const content: IPoll = {
            ...pollEvent.content,
            startEventId: startEvent.event_id,
            startTime: startTime.toISO(),
            endTime: endTime.toISO(),
          };

          await widgetApi.sendStateEvent(STATE_EVENT_POLL, content, {
            stateKey: pollId,
          });

          return { data: {} };
        } catch (e) {
          return {
            error: {
              name: 'UpdateFailed',
              message: `Could not start poll: ${isError(e) ? e.message : e}`,
            },
          };
        }
      },
    }),

    /**
     * Stop the poll event in the current room.
     */
    stopPoll: builder.mutation<
      { event?: StateEvent<IPoll> },
      { pollId: string }
    >({
      async queryFn({ pollId }, { extra }) {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const pollEvents = await widgetApi.receiveStateEvents(
            STATE_EVENT_POLL,
            { stateKey: pollId }
          );
          const pollEvent = last(pollEvents.filter(isValidPollEvent));

          if (
            !pollEvent ||
            pollEvent.content.startTime === undefined ||
            pollEvent.content.endTime === undefined ||
            pollEvent.content.startEventId === undefined
          ) {
            return { data: {} };
          }

          const now = DateTime.now();
          const poll = {
            ...pollEvent?.content,
            endTime: now.toString(),
          };

          if (pollEvent && isEqual(pollEvent.content, poll)) {
            // No change necessary
            return { data: { event: pollEvent } };
          }

          const event = await widgetApi.sendStateEvent(STATE_EVENT_POLL, poll, {
            stateKey: pollId,
          });

          return { data: { event } };
        } catch (e) {
          return {
            error: {
              name: 'UpdateFailed',
              message: `Could not stop poll: ${isError(e) ? e.message : e}`,
            },
          };
        }
      },
    }),

    /**
     * Delete the poll event in the current room.
     */
    deletePoll: builder.mutation<{}, { pollId: string }>({
      async queryFn({ pollId }, { extra }) {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const pollGroupEvents = await widgetApi.receiveStateEvents(
            STATE_EVENT_POLL,
            { stateKey: pollId }
          );
          const pollGroupEvent = last(pollGroupEvents.filter(isValidPollEvent));

          if (!pollGroupEvent) {
            // No change necessary
            return { data: {} };
          }

          await widgetApi.sendStateEvent(
            STATE_EVENT_POLL,
            {},
            { stateKey: pollId }
          );

          return { data: {} };
        } catch (e) {
          return {
            error: {
              name: 'UpdateFailed',
              message: `Could not delete poll: ${isError(e) ? e.message : e}`,
            },
          };
        }
      },
    }),
  }),
});

export const { selectAll: selectAllPolls, selectById: selectPollById } =
  pollsEntityAdapter.getSelectors();

export const {
  useGetPollsQuery,
  useUpdatePollMutation,
  useStartPollMutation,
  useStopPollMutation,
  useDeletePollMutation,
} = pollApi;
