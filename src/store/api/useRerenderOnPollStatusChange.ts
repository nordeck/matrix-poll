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
import { DateTime } from 'luxon';
import { useEffect, useMemo, useState } from 'react';
import { IPoll } from '../../model';
import { selectAllPolls, useGetPollsQuery } from './pollApi';
import { selectPollsOngoing } from './selectPollsOngoing';

export function useRerenderOnPollStatusChange() {
  const [renderTimer, setRenderTimer] = useState(0);
  const { data: pollsState } = useGetPollsQuery();

  useEffect(() => {
    const pollsNextTimer: Record<string, ReturnType<typeof setTimeout>> = {};

    // replaces/creates the timeout for a poll to notice status changes
    // even when the redux state didn't update.
    function addTimer(poll: StateEvent<IPoll>) {
      if (!poll.content.startTime) {
        return;
      }

      const startTime = DateTime.fromISO(poll.content.startTime);
      const endTime = startTime.plus({ minutes: poll.content.duration });

      if (endTime < DateTime.now()) {
        return;
      }

      if (poll.state_key in pollsNextTimer) {
        clearTimeout(pollsNextTimer[poll.state_key]);
        delete pollsNextTimer[poll.state_key];
      }

      // Rerender the component when the meeting ends. If a value larger than
      // MAX_INT32=(2^31-1) is provided to setTimeout, it triggers instantly.
      // So we cap the value to allow a proper behavior for meetings >24 days
      // in the future.
      pollsNextTimer[poll.state_key] = setTimeout(() => {
        setRenderTimer((old) => old + 1);

        // readd the timer to also work if a poll is longer than 24 days and the
        // widget stays open for that long.
        addTimer(poll);
      }, endTime.diffNow().toMillis() % 0x7fffffff);
    }

    const onGoingPolls = pollsState ? selectPollsOngoing(pollsState) : [];
    onGoingPolls.forEach(addTimer);

    // cancel all timers
    return () => {
      Object.values(pollsNextTimer).forEach((t) => clearTimeout(t));
    };
  }, [pollsState]);

  return useMemo(
    () => ({
      pollCount: pollsState ? selectAllPolls(pollsState).length : 0,
      renderTimer,
    }),
    [pollsState, renderTimer],
  );
}
