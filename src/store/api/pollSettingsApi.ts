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
import { first, isEqual, isError, last, merge } from 'lodash';
import { filter } from 'rxjs';
import {
  IPollSettings,
  isValidPollSettingsEvent,
  STATE_EVENT_POLL_SETTINGS,
} from '../../model';
import { ThunkExtraArgument } from '../store';
import { baseApi } from './baseApi';

/**
 * Endpoints to manipulate poll settings.
 *
 * @remarks this api extends the {@link baseApi} so it should
 *          not be registered at the store.
 */
export const pollSettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Return the poll settings event of a room.
     */
    getPollSettings: builder.query<
      { event: StateEvent<IPollSettings> | undefined },
      void
    >({
      queryFn: async (_, { extra }) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const events = await widgetApi.receiveStateEvents(
            STATE_EVENT_POLL_SETTINGS,
            { stateKey: widgetApi.widgetParameters.roomId },
          );

          return {
            data: { event: first(events.filter(isValidPollSettingsEvent)) },
          };
        } catch (e) {
          return {
            error: {
              name: 'LoadFailed',
              message: `Could not load poll settings: ${
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
          .observeStateEvents(STATE_EVENT_POLL_SETTINGS)
          .pipe(filter(isValidPollSettingsEvent))
          .subscribe((event) => {
            updateCachedData(() => ({ event }));
          });

        // wait until subscription is cancelled
        await cacheEntryRemoved;

        subscription.unsubscribe();
      },
    }),

    /**
     * Patch the poll settings event of a room.
     */
    patchPollSettings: builder.mutation<
      {},
      { changes: Partial<IPollSettings> }
    >({
      async queryFn({ changes }, { extra }) {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const pollSettingsEvents = await widgetApi.receiveStateEvents(
            STATE_EVENT_POLL_SETTINGS,
            { stateKey: widgetApi.widgetParameters.roomId },
          );
          const pollSettingsEvent = last(
            pollSettingsEvents.filter(isValidPollSettingsEvent),
          );

          const pollSettings = merge(
            {},
            pollSettingsEvent?.content ?? {},
            changes,
          );

          if (
            pollSettingsEvent &&
            isEqual(pollSettingsEvent.content, pollSettings)
          ) {
            // No change necessary
            return { data: {} };
          }

          await widgetApi.sendStateEvent(
            STATE_EVENT_POLL_SETTINGS,
            pollSettings,
            { stateKey: widgetApi.widgetParameters.roomId },
          );

          return { data: {} };
        } catch (e) {
          return {
            error: {
              name: 'UpdateFailed',
              message: `Could not update poll settings: ${
                isError(e) ? e.message : e
              }`,
            },
          };
        }
      },
    }),
  }),
});

export const { useGetPollSettingsQuery, usePatchPollSettingsMutation } =
  pollSettingsApi;
