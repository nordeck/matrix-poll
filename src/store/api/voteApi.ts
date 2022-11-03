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

import { compareOriginServerTS, RoomEvent } from '@matrix-widget-toolkit/api';
import { isError } from 'lodash';
import { bufferTime, filter } from 'rxjs';
import { isValidVoteEvent, IVote, ROOM_EVENT_VOTE } from '../../model';
import { ThunkExtraArgument } from '../store';
import { baseApi } from './baseApi';

export const voteApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Return the vote events for a poll in the current room.
     */
    getVotes: builder.query<
      RoomEvent<IVote>[],
      { pollId: string; pollStartEventId: string | undefined }
    >({
      queryFn: async ({ pollId, pollStartEventId }, { extra }) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          // read the vote events for the old events that were created prior to ADR005
          if (!pollStartEventId) {
            const events = await widgetApi.receiveRoomEvents(ROOM_EVENT_VOTE);

            return {
              data: events
                .filter(isValidVoteEvent)
                .filter((v) => v.content.pollId === pollId)
                .sort(compareOriginServerTS),
            };
          }

          let from: string | undefined = undefined;
          const votes: RoomEvent<IVote>[] = [];
          do {
            const result = await widgetApi.readEventRelations(
              pollStartEventId,
              {
                limit: 50,
                from,
                relationType: 'm.reference',
                eventType: ROOM_EVENT_VOTE,
              }
            );

            votes.push(
              ...result.chunk
                .filter(isValidVoteEvent)
                .filter((v) => v.content.pollId === pollId)
            );

            // typescript doesn't like circular types
            from = result.nextToken as string | undefined;
          } while (from !== undefined);

          votes.sort(compareOriginServerTS);

          return { data: votes };
        } catch (e) {
          return {
            error: {
              name: 'LoadFailed',
              message: `Could not load votes: ${isError(e) ? e.message : e}`,
            },
          };
        }
      },

      async onCacheEntryAdded(
        { pollId, pollStartEventId },
        { cacheDataLoaded, cacheEntryRemoved, extra, updateCachedData }
      ) {
        const { widgetApi } = extra as ThunkExtraArgument;

        // wait until first data is cached
        await cacheDataLoaded;

        const subscription = widgetApi
          .observeRoomEvents(ROOM_EVENT_VOTE)
          .pipe(
            filter(isValidVoteEvent),
            filter((v) => v.content.pollId === pollId),
            bufferTime(0),
            filter((list) => list.length > 0)
          )
          .subscribe((rawEvents) => {
            let events = rawEvents;

            // only consider related votes if a start event is presented
            if (pollStartEventId) {
              events = rawEvents.filter(
                (r) =>
                  r.content['m.relates_to']?.rel_type === 'm.reference' &&
                  r.content['m.relates_to'].event_id === pollStartEventId
              );
            }

            // update the cached data if the event changes in the room
            updateCachedData((state) => {
              for (const event of events) {
                if (!state.find((v) => v.event_id === event.event_id)) {
                  state.push(event);
                }
              }

              state.sort(compareOriginServerTS);
            });
          });

        // wait until subscription is cancelled
        await cacheEntryRemoved;

        subscription.unsubscribe();
      },
    }),

    /**
     * Vote for a poll in the current room.
     */
    vote: builder.mutation<
      { event: RoomEvent<IVote> },
      {
        pollId: string;
        answerId: string;
        pollStartEventId: string | undefined;
      }
    >({
      async queryFn({ pollId, answerId, pollStartEventId }, { extra }) {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const event = await widgetApi.sendRoomEvent<IVote>(ROOM_EVENT_VOTE, {
            pollId,
            answerId,
            ...(pollStartEventId && {
              'm.relates_to': {
                rel_type: 'm.reference',
                event_id: pollStartEventId,
              },
            }),
          });

          return { data: { event } };
        } catch (e) {
          return {
            error: {
              name: 'UpdateFailed',
              message: `Could not vote: ${isError(e) ? e.message : e}`,
            },
          };
        }
      },
    }),
  }),
});

export const { useGetVotesQuery, useVoteMutation } = voteApi;
