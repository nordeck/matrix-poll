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
import { t } from 'i18next';
import { DateTime, Duration, DurationUnit } from 'luxon';
import { Middleware } from 'redux';
import i18n from '../../i18n';
import { IPoll } from '../../model';
import {
  AppDispatch,
  pollApi,
  RootState,
  selectPollsFinished,
  selectPollsOngoing,
  selectPollsUpcoming,
} from '../../store';
import { ShowNotificationFn } from './PollStatusNotificationsProvider';

type PollStatus =
  | 'created'
  | 'started'
  | 'reached_half'
  | 'reached_last_quarter'
  | 'finished';

type CreatePollNotificationsMiddlewareProps = {
  showNotification: ShowNotificationFn;
};

/**
 * Creates a new redux middleware that emits notifications when a poll changes
 * its state:
 *
 * 1. A poll is started.
 * 2. 50% of the duration passed.
 * 3. 75% of the duration passed.
 * 4. A poll is finished.
 *
 * The middleware uses a state-machine per poll to reliably recognize the state
 * changes.
 *
 * @param param - properties:
 *                showNotification: a function that reads the generated
 *                                  notifications
 * @returns a middleware that can be registered to a redux store
 */
export function createPollStatusNotificationsMiddleware({
  showNotification,
}: CreatePollNotificationsMiddlewareProps): Middleware<
  {},
  RootState,
  AppDispatch
> {
  // global state to keep track of the values
  const pollsState: Record<string, PollStatus> = {};
  // global state to keep track of timers that were created
  const pollsNextTimer: Record<string, ReturnType<typeof setTimeout>> = {};

  // send a poll notification for a status
  function sendPollNotification(status: PollStatus, poll: StateEvent<IPoll>) {
    // all states only work for started polls
    if (!poll.content.startTime || !poll.content.endTime) {
      return;
    }

    const endTime = DateTime.fromISO(poll.content.endTime);

    if (status === 'started') {
      showNotification(
        'info',
        t(
          'pollStatusNotifications.started',
          'The poll “{{title}}” was started and ends in {{remainingTime}}.',
          {
            title: poll.content.title,
            remainingTime: normalizeDuration(endTime.diffNow()).toHuman({
              listStyle: 'long',
            }),
          },
        ),
      );
    } else if (status === 'reached_half' || status === 'reached_last_quarter') {
      showNotification(
        'info',
        t(
          'pollStatusNotifications.endsSoon',
          'The poll “{{title}}” ends in {{remainingTime}}.',
          {
            title: poll.content.title,
            remainingTime: normalizeDuration(endTime.diffNow()).toHuman({
              listStyle: 'long',
            }),
          },
        ),
      );
    } else if (status === 'finished') {
      showNotification(
        'info',
        t('pollStatusNotifications.finished', 'The poll “{{title}}” ended.', {
          title: poll.content.title,
          remainingTime: normalizeDuration(endTime.diffNow()).toHuman({
            listStyle: 'long',
          }),
        }),
      );
    }
  }

  return ({ getState, dispatch }) =>
    (next) => {
      // delay the calculations until the translations are loaded
      let translationsReady = i18n.isInitialized;
      i18n.on('initialized', () => {
        translationsReady = true;
        refreshNotifications();
      });

      // replaces/creates the timeout for a poll to notice status changes
      // even when the redux state didn't update.
      function addTimer(pollId: string, dateTime: DateTime) {
        if (pollId in pollsNextTimer) {
          clearTimeout(pollsNextTimer[pollId]);
          delete pollsNextTimer[pollId];
        }

        // Rerender the component when the meeting ends. If a value larger than
        // MAX_INT32=(2^31-1) is provided to setTimeout, it triggers instantly.
        // So we cap the value to allow a proper behavior for meetings >24 days
        // in the future.
        pollsNextTimer[pollId] = setTimeout(
          () => refreshNotifications(),
          dateTime.diffNow().toMillis() % 0x7fffffff,
        );
      }

      // global handler to refresh the notifications
      const refreshNotifications = () => {
        const state = getState();

        // Read the state directly from the store. This won't initiate a loading
        // of the data, but we started that by calling `.initiate()` below.
        const polls = pollApi.endpoints.getPolls.select()(state).data;
        const notStartedPolls = polls ? selectPollsUpcoming(polls) : [];
        const onGoingPolls = polls ? selectPollsOngoing(polls) : [];
        const finishedPolls = polls ? selectPollsFinished(polls) : [];

        // initialize the map so we can reliably decide if a poll was started OR
        // if a started poll was loaded
        notStartedPolls.forEach((p) => {
          pollsState[p.state_key] = 'created';
        });

        onGoingPolls.forEach((poll) => {
          const { state_key: p, content } = poll;

          // should always be defined
          if (!content.startTime || !content.endTime) {
            return;
          }

          const timeDiff = DateTime.fromISO(content.endTime).diff(
            DateTime.fromISO(content.startTime),
            'minute',
          );
          const duration = Math.floor(timeDiff.as('minutes'));

          // make sure a single execution always triggers a single
          // message (the last one).
          let sendNotification: PollStatus | undefined = undefined;

          if (pollsState[p] === 'created') {
            sendNotification = 'started';
          }

          // initialize the status even if the `created` state was skipped. We
          // might also fall through to another status that will then update
          // the `sendNotification` variable.
          if (!(p in pollsState) || pollsState[p] === 'created') {
            pollsState[p] = 'started';
          }

          const startTime = DateTime.fromISO(content.startTime);
          const now = DateTime.now();

          if (pollsState[p] === 'started') {
            const halfTime = startTime.plus({ minutes: duration / 2 });

            if (halfTime <= now) {
              sendNotification = 'reached_half';
              pollsState[p] = 'reached_half';
            } else {
              addTimer(p, halfTime);
            }
          }

          if (pollsState[p] === 'reached_half') {
            const lastQuartersTime = startTime.plus({
              minutes: (3 * duration) / 4,
            });

            if (lastQuartersTime <= now) {
              sendNotification = 'reached_last_quarter';
              pollsState[p] = 'reached_last_quarter';
            } else {
              addTimer(p, lastQuartersTime);
            }
          }

          if (pollsState[p] === 'reached_last_quarter') {
            const endTime = DateTime.fromISO(content.endTime);
            addTimer(p, endTime);
          }

          if (sendNotification) {
            sendPollNotification(sendNotification, poll);
          }
        });

        finishedPolls.forEach((poll) => {
          const { state_key: p } = poll;

          delete pollsNextTimer[p];

          if (pollsState[p] && pollsState[p] !== 'finished') {
            sendPollNotification('finished', poll);
          }

          pollsState[p] = 'finished';
        });
      };

      let subscriptionStarted = false;
      return (action) => {
        // request the loading of the polls. we don't await it but keep it open
        // forever. we don't stop the call because there is no shutdown logic
        // for a redux middleware.
        //
        // if we don't call it conditionally we will create an infinite loop.
        // if we call it outside of `(action) => {}`, the other middelwares
        // wouldn't be initialized yet and calling `dispatch` would throw.
        if (!subscriptionStarted) {
          subscriptionStarted = true;
          dispatch(pollApi.endpoints.getPolls.initiate());
        }

        // this part is executed for every action
        // first update the state
        const nextReturn = next(action);

        // then derive actions from the state
        if (translationsReady) {
          refreshNotifications();
        }

        return nextReturn;
      };
    };
}

/**
 * Normalize a duration so it can be reasonably converted into a human readable
 * later string. It returns the following formats depending on the remaining time:
 *
 * * "XX hours"
 * * "XX hours, XX minutes"
 * * "XX minutes"
 * * "XX minutes, XX seconds"
 * * "XX seconds"
 *
 * @param duration - a duration for humanize
 * @returns the normalized duration
 */
export function normalizeDuration(duration: Duration): Duration {
  let normalizedDuration = Duration.fromMillis(
    Math.round(duration.toMillis() / 1000) * 1000,
  );

  const units: DurationUnit[] = [];

  if (Math.floor(normalizedDuration.as('hours')) > 0) {
    units.push('hours');
  }

  if (Math.floor(normalizedDuration.as('minutes')) % 60 > 0) {
    units.push('minutes');
  }

  if (Math.floor(normalizedDuration.as('seconds')) % 60 > 0) {
    // skip the seconds when we display hours
    if (units.includes('hours')) {
      normalizedDuration = normalizedDuration
        .shiftTo('hours', 'minutes', 'seconds')
        .set({ seconds: 0 });
    } else {
      units.push('seconds');
    }
  }

  return normalizedDuration.shiftTo(...units);
}
