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
import { mockGroup, mockPoll, mockPowerLevelsEvent } from '../../lib/testUtils';
import { GroupContent } from '../../model';
import { PollGroup } from '../../model/IPoll';
import { syncPollGroupsWithRoomGroups, userPermissionHasChange } from './utils';

describe('syncPollGroupsWithRoomGroups', () => {
  let groupEvents: StateEvent<GroupContent>[];
  let redPollGroup: PollGroup;
  let bluePollGroup: PollGroup;
  let greenPollGroup: PollGroup;

  beforeEach(() => {
    groupEvents = [
      mockGroup({
        content: {
          abbreviation: 'Red Party',
          color: '#ff0000',
          members: {
            'user-alice': {
              memberRole: 'delegate',
            },
            'user-bob': {
              memberRole: 'delegate',
            },
            'user-charlie': {
              memberRole: 'delegate',
            },
            'user-eric': {
              memberRole: 'representative',
            },
          },
        },
        state_key: 'red-party',
        event_id: 'event-id-1',
      }),
      mockGroup({
        content: {
          abbreviation: 'Blue Party',
          color: '#0000ff',
          members: {
            'user-dameon': {
              memberRole: 'delegate',
            },
          },
        },
        state_key: 'blue-party',
        event_id: 'event-id-2',
      }),
    ];

    redPollGroup = {
      id: 'red-party',
      eventId: 'event-id-1',
      abbreviation: 'Red Party',
      color: '#ff0000',
      votingRights: {
        'user-alice': {
          state: 'active',
        },
        'user-bob': {
          state: 'active',
        },
        'user-charlie': {
          state: 'active',
        },
      },
    };

    bluePollGroup = {
      id: 'blue-party',
      eventId: 'event-id-2',
      abbreviation: 'Blue Party',
      color: '#0000ff',
      votingRights: {
        'user-dameon': {
          state: 'active',
        },
      },
    };

    greenPollGroup = {
      id: 'green-party',
      eventId: 'event-id-3',
      abbreviation: 'Green Party',
      color: '#00ff00',
      votingRights: {
        'user-hans': {
          state: 'active',
        },
      },
    };
  });

  it('should initialize groups from group events if the groups are empty', () => {
    const groups: PollGroup[] = [];
    const result = syncPollGroupsWithRoomGroups(groups, groupEvents);

    expect(result).toEqual([redPollGroup, bluePollGroup]);
  });

  it('should add new group if there is an additional group in the group events', () => {
    const modifiedRedPollGroup: PollGroup = {
      id: 'red-party',
      eventId: 'event-id-1',
      abbreviation: 'Red Party',
      color: '#ff0000',
      votingRights: {
        'user-alice': {
          // Make sure that changes to the red group are preserved
          state: 'invalid',
        },
        'user-bob': {
          state: 'active',
        },
        'user-charlie': {
          state: 'active',
        },
      },
    };
    const groups: PollGroup[] = [modifiedRedPollGroup];
    const result = syncPollGroupsWithRoomGroups(groups, groupEvents);

    expect(result).toEqual([modifiedRedPollGroup, bluePollGroup]);
  });

  it('should remove group that is not part of the group events', () => {
    const modifiedRedPollGroup: PollGroup = {
      id: 'red-party',
      eventId: 'event-id-1',
      abbreviation: 'Red Party',
      color: '#ff0000',
      votingRights: {
        'user-alice': {
          // Make sure that changes to the red group are preserved
          state: 'invalid',
        },
        'user-bob': {
          state: 'active',
        },
        'user-charlie': {
          state: 'active',
        },
      },
    };
    const groups: PollGroup[] = [
      modifiedRedPollGroup,
      bluePollGroup,
      greenPollGroup,
    ];
    const result = syncPollGroupsWithRoomGroups(groups, groupEvents);

    expect(result).toEqual([modifiedRedPollGroup, bluePollGroup]);
  });

  describe('resolve conflicts in a group if the event id does not match the event id of the group event', () => {
    it('should preserve the previous state of a delegate', () => {
      const groups: PollGroup[] = [
        redPollGroup,
        {
          id: 'blue-party',
          eventId: 'event-id-0',
          abbreviation: 'Blue Party',
          color: '#0000ff',
          votingRights: {
            'user-dameon': {
              state: 'invalid',
            },
            'user-gina': {
              state: 'active',
            },
          },
        },
      ];

      const result = syncPollGroupsWithRoomGroups(groups, groupEvents);

      expect(result).toEqual([
        redPollGroup,
        {
          id: 'blue-party',
          eventId: 'event-id-2',
          abbreviation: 'Blue Party',
          color: '#0000ff',
          votingRights: {
            'user-dameon': {
              state: 'invalid',
            },
          },
        },
      ]);
    });

    it('should discard the state if the representative is now a delegate', () => {
      const groups: PollGroup[] = [
        {
          id: 'red-party',
          eventId: 'event-id-0',
          abbreviation: 'Red Party',
          color: '#ff0000',
          votingRights: {
            'user-alice': {
              state: 'active',
            },
            'user-bob': {
              state: 'represented',
              representedBy: 'user-charlie',
            },
          },
        },
        bluePollGroup,
      ];

      const result = syncPollGroupsWithRoomGroups(groups, groupEvents);

      expect(result).toEqual([
        {
          id: 'red-party',
          eventId: 'event-id-1',
          abbreviation: 'Red Party',
          color: '#ff0000',
          votingRights: {
            'user-alice': {
              state: 'active',
            },
            'user-bob': {
              state: 'invalid',
            },
            'user-charlie': {
              state: 'active',
            },
          },
        },
        bluePollGroup,
      ]);
    });

    it('should discard the state if the representative is removed from the group', () => {
      const groups: PollGroup[] = [
        {
          id: 'red-party',
          eventId: 'event-id-0',
          abbreviation: 'Red Party',
          color: '#ff0000',
          votingRights: {
            'user-alice': {
              state: 'active',
            },
            'user-bob': {
              state: 'represented',
              representedBy: 'user-iris',
            },
            'user-charlie': {
              state: 'active',
            },
          },
        },
        bluePollGroup,
      ];

      const result = syncPollGroupsWithRoomGroups(groups, groupEvents);

      expect(result).toEqual([
        {
          id: 'red-party',
          eventId: 'event-id-1',
          abbreviation: 'Red Party',
          color: '#ff0000',
          votingRights: {
            'user-alice': {
              state: 'active',
            },
            'user-bob': {
              state: 'invalid',
            },
            'user-charlie': {
              state: 'active',
            },
          },
        },
        bluePollGroup,
      ]);
    });
  });

  it('should return true if a user of a group has no more permission to vote', () => {
    const powerLevelsEvent = mockPowerLevelsEvent({
      content: {
        events_default: 50,
        users: {
          'user1@example': 20,
          'user2@example': 70,
          'user3@example': 100,
          'user4@example': 0,
        },
      },
    });
    const groups = [
      mockPoll({
        content: {
          groups: [
            {
              id: 'group-1',
              eventId: 'event-id-0',
              abbreviation: 'group-1',
              color: '#fff',
              votingRights: {
                'user1@example': {
                  state: 'active',
                },
                'user2@example': {
                  state: 'active',
                },
                'user3@example': {
                  state: 'represented',
                  representedBy: 'user4@example',
                },
              },
            },
          ],
        },
      }),
    ][0].content.groups;

    expect(userPermissionHasChange(groups, powerLevelsEvent.content)).toBe(
      true,
    );
  });

  it('should return fasle if all users of a group has permission to vote', () => {
    const powerLevelsEvent = mockPowerLevelsEvent({
      content: {
        events_default: 50,
        users: {
          'user1@example': 80,
          'user2@example': 70,
          'user3@example': 100,
          'user4@example': 50,
        },
      },
    });
    const groups = [
      mockPoll({
        content: {
          groups: [
            {
              id: 'group-1',
              eventId: 'event-id-0',
              abbreviation: 'group-1',
              color: '#fff',
              votingRights: {
                'user1@example': {
                  state: 'active',
                },
                'user2@example': {
                  state: 'active',
                },
                'user3@example': {
                  state: 'represented',
                  representedBy: 'user4@example',
                },
              },
            },
          ],
        },
      }),
    ][0].content.groups;

    expect(userPermissionHasChange(groups, powerLevelsEvent.content)).toBe(
      false,
    );
  });
});
