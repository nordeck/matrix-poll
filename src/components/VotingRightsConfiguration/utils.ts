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

import {
  hasRoomEventPower,
  PowerLevelsStateEvent,
  StateEvent,
  StateEventCreateContent,
} from '@matrix-widget-toolkit/api';
import { GroupContent, ROOM_EVENT_VOTE } from '../../model';
import { PollGroup, VotingRights } from '../../model/IPoll';

export function syncPollGroupsWithRoomGroups(
  pollGroups: PollGroup[],
  groupEvents: StateEvent<GroupContent>[],
): PollGroup[] {
  return groupEvents.map((groupEvent) => {
    const existingPollGroup = pollGroups.find(
      (g) => g.id === groupEvent.state_key,
    );

    if (
      existingPollGroup &&
      existingPollGroup.eventId === groupEvent.event_id
    ) {
      return existingPollGroup;
    }

    const groupMembers = Object.entries(groupEvent.content.members);

    const delegates = groupMembers
      .filter(([_, m]) => m.memberRole === 'delegate')
      .map(([userId]) => userId);

    const representatives = groupMembers
      .filter(([_, m]) => m.memberRole === 'representative')
      .map(([userId]) => userId);

    const votingRights: VotingRights = Object.fromEntries(
      delegates.map((m) => {
        if (existingPollGroup) {
          const existingVotingRight = existingPollGroup.votingRights[m];

          if (existingVotingRight) {
            if (
              existingVotingRight.state === 'represented' &&
              !representatives.includes(existingVotingRight.representedBy)
            ) {
              return [m, { state: 'invalid' }];
            }
            return [m, existingVotingRight];
          }
        }

        return [m, { state: 'active' }];
      }),
    );

    return {
      id: groupEvent.state_key,
      eventId: groupEvent.event_id,
      abbreviation: groupEvent.content.abbreviation,
      color: groupEvent.content.color,
      votingRights,
    };
  });
}

export const userPermissionHasChange = (
  groups: PollGroup[] | undefined,
  powerLevel: PowerLevelsStateEvent | undefined,
  createEvent: StateEvent<StateEventCreateContent> | undefined,
) => {
  return groups?.some((group) => {
    return Object.entries(group.votingRights).some((delegateId) => {
      const userPermission =
        delegateId[1]?.state === 'represented'
          ? delegateId[1].representedBy
          : delegateId[0];
      return !hasRoomEventPower(
        powerLevel,
        createEvent,
        userPermission,
        ROOM_EVENT_VOTE,
      );
    });
  });
};
