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

import { StateEvent } from '@matrix-widget-toolkit/api';
import { createEntityAdapter, EntityState } from '@reduxjs/toolkit';
import { isEqual, isError, last } from 'lodash';
import { bufferTime, filter } from 'rxjs';
import {
  GroupContent,
  isValidGroupEvent,
  migratePollGroupSchema,
  STATE_EVENT_POLL_GROUP,
} from '../../model';
import { ThunkExtraArgument } from '../store';
import { baseApi } from './baseApi';

const pollGroupEventEntityAdapter = createEntityAdapter<
  StateEvent<GroupContent>
>({
  selectId: (event) => event.state_key,
});

/**
 * Endpoints to manipulate poll groups.
 *
 * @remarks this api extends the {@link baseApi} so it should
 *          not be registered at the store.
 */
export const pollGroupApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Return the poll group events from the current room.
     */
    getPollGroups: builder.query<EntityState<StateEvent<GroupContent>>, void>({
      queryFn: async (_, { extra }) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const initialState = pollGroupEventEntityAdapter.getInitialState();

          const events = await widgetApi.receiveStateEvents(
            STATE_EVENT_POLL_GROUP,
          );

          return {
            data: pollGroupEventEntityAdapter.addMany(
              initialState,
              events.filter(isValidGroupEvent).map(migratePollGroupSchema),
            ),
          };
        } catch (e) {
          return {
            error: {
              name: 'LoadFailed',
              message: `Could not load poll groups: ${
                isError(e) ? e.message : e
              }`,
            },
          };
        }
      },

      async onCacheEntryAdded(
        _,
        { cacheDataLoaded, cacheEntryRemoved, extra, updateCachedData },
      ) {
        const { widgetApi } = extra as ThunkExtraArgument;

        // wait until first data is cached
        await cacheDataLoaded;

        const subscription = widgetApi
          .observeStateEvents(STATE_EVENT_POLL_GROUP)
          .pipe(
            bufferTime(0),
            filter((list) => list.length > 0),
          )
          .subscribe(async (events) => {
            const eventsToUpdate = events
              .filter(isValidGroupEvent)
              .map(migratePollGroupSchema);
            const eventIdsToDelete = events
              .filter(
                (e) =>
                  e.type === STATE_EVENT_POLL_GROUP && isEqual(e.content, {}),
              )
              .map((e) => e.state_key);

            updateCachedData((state) => {
              pollGroupEventEntityAdapter.upsertMany(state, eventsToUpdate);
              pollGroupEventEntityAdapter.removeMany(state, eventIdsToDelete);
            });
          });

        // wait until subscription is cancelled
        await cacheEntryRemoved;

        subscription.unsubscribe();
      },
    }),

    /**
     * Update the poll group event in the current room.
     */
    updatePollGroup: builder.mutation<
      { event: StateEvent<GroupContent> },
      { groupId: string; content: GroupContent }
    >({
      async queryFn({ groupId, content }, { extra }) {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const pollGroupEvents = await widgetApi.receiveStateEvents(
            STATE_EVENT_POLL_GROUP,
            { stateKey: groupId },
          );
          const pollGroupEvent = last(
            pollGroupEvents
              .filter(isValidGroupEvent)
              .map(migratePollGroupSchema),
          );

          // No recursive merge!
          const pollGroup = { ...(pollGroupEvent?.content ?? {}), ...content };

          if (pollGroupEvent && isEqual(pollGroupEvent.content, pollGroup)) {
            // No change necessary
            return { data: { event: pollGroupEvent } };
          }

          const event = await widgetApi.sendStateEvent(
            STATE_EVENT_POLL_GROUP,
            pollGroup,
            { stateKey: groupId },
          );

          return { data: { event } };
        } catch (e) {
          return {
            error: {
              name: 'UpdateFailed',
              message: `Could not update poll group: ${
                isError(e) ? e.message : e
              }`,
            },
          };
        }
      },
    }),

    /**
     * Delete the poll group event in the current room.
     */
    deletePollGroup: builder.mutation<{}, { groupId: string }>({
      async queryFn({ groupId }, { extra }) {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const pollGroupEvents = await widgetApi.receiveStateEvents(
            STATE_EVENT_POLL_GROUP,
            { stateKey: groupId },
          );
          const pollGroupEvent = last(
            pollGroupEvents
              .filter(isValidGroupEvent)
              .map(migratePollGroupSchema),
          );

          if (!pollGroupEvent) {
            // No change necessary
            return { data: {} };
          }

          await widgetApi.sendStateEvent(
            STATE_EVENT_POLL_GROUP,
            {},
            { stateKey: groupId },
          );

          return { data: {} };
        } catch (e) {
          return {
            error: {
              name: 'UpdateFailed',
              message: `Could not delete poll group: ${
                isError(e) ? e.message : e
              }`,
            },
          };
        }
      },
    }),
  }),
});

export const { selectAll: selectPollGroups, selectById: selectPollGroup } =
  pollGroupEventEntityAdapter.getSelectors();

export const {
  useGetPollGroupsQuery,
  useUpdatePollGroupMutation,
  useDeletePollGroupMutation,
} = pollGroupApi;
