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

import { hasRoomEventPower } from '@matrix-widget-toolkit/api';
import { AsyncState } from '../../lib/utils';
import { ROOM_EVENT_VOTE } from '../../model';
import { selectPollById, useGetPollsQuery } from './pollApi';
import { useGetPowerLevelsQuery } from './powerLevelsApi';

/**
 * Returns if the user is permitted to vote the given poll.
 */
export function useUserCanVote(
  pollId: string,
  userId: string | undefined
): AsyncState<boolean> {
  const {
    data: pollsState,
    isLoading: isPollsLoading,
    isError: isPollsError,
  } = useGetPollsQuery();
  const {
    data: powerLevels,
    isLoading: isPowerLevelsLoading,
    isError: isPowerLevelsError,
  } = useGetPowerLevelsQuery();
  const pollEvent = pollsState ? selectPollById(pollsState, pollId) : undefined;

  if (!userId) {
    return { isLoading: false, data: false };
  }

  if (isPollsError || isPowerLevelsError) {
    return { isLoading: false, isError: true };
  }

  if (isPollsLoading || isPowerLevelsLoading) {
    return { isLoading: true };
  }

  // the poll was not found
  if (!pollEvent) {
    return { isLoading: false, data: false };
  }

  const hasPower = hasRoomEventPower(
    powerLevels?.event?.content,
    userId,
    ROOM_EVENT_VOTE
  );

  // no groups -> default to the power level
  if (pollEvent.content.groups === undefined) {
    return { isLoading: false, data: hasPower };
  }

  // has an active status
  const group = pollEvent.content.groups.find((g) => userId in g.votingRights);
  const user = group?.votingRights[userId];
  if (user?.state === 'active') {
    return { isLoading: false, data: hasPower };
  }

  // is a representative that represents a delegate
  const isRepresentative = pollEvent.content.groups.some((g) =>
    Object.values(g.votingRights).some(
      (m) => m?.state === 'represented' && m.representedBy === userId
    )
  );
  if (isRepresentative) {
    return { isLoading: false, data: hasPower };
  }

  return { isLoading: false, data: false };
}
