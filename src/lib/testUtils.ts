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
  PowerLevelsStateEvent,
  RoomEvent,
  RoomMemberStateEventContent,
  StateEvent,
  StateEventCreateContent,
} from '@matrix-widget-toolkit/api';
import {
  GroupContent,
  IPoll,
  IPollSettings,
  IVote,
  PollStartEvent,
  PollType,
  ResultType,
  RoomNameEvent,
} from '../model';

/**
 * Create a matrix room member event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockRoomMember({
  state_key = '@user-alice:example.com',
  event_id = '$event-id-0',
  content = {},
}: {
  state_key?: string;
  event_id?: string;
  content?: Partial<RoomMemberStateEventContent>;
} = {}): StateEvent<RoomMemberStateEventContent> {
  return {
    type: 'm.room.member',
    sender: '@user-id:example.com',
    content: {
      membership: 'join',
      displayname: 'Alice',
      avatar_url: 'mxc://alice.png',
      ...content,
    },
    state_key,
    origin_server_ts: 0,
    event_id,
    room_id: '!room-id:example.com',
  };
}

/**
 * Create a matrix room name event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockRoomName({
  room_id = '!room-id:example.com',
  content = {},
}: {
  room_id?: string;
  content?: Partial<RoomNameEvent>;
} = {}): StateEvent<RoomNameEvent> {
  return {
    type: 'm.room.name',
    sender: '',
    content: {
      name: 'My Room',
      ...content,
    },
    state_key: room_id,
    origin_server_ts: 0,
    event_id: '$event-id-0',
    room_id,
  };
}

/**
 * Create a matrix power levels event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockPowerLevelsEvent({
  content = {},
}: {
  content?: Partial<PowerLevelsStateEvent>;
} = {}): StateEvent<PowerLevelsStateEvent> {
  return {
    type: 'm.room.power_levels',
    sender: '@user-id:example.com',
    content: {
      users_default: 100,
      ...content,
    },
    state_key: '',
    origin_server_ts: 0,
    event_id: '$event-id-0',
    room_id: '!room-id:example.com',
  };
}

/**
 * Create a poll event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockPoll({
  state_key = 'poll-0',
  event_id = '$event-id-0',
  origin_server_ts = 0,
  content = {},
}: {
  state_key?: string;
  event_id?: string;
  origin_server_ts?: number;
  content?: Partial<IPoll>;
} = {}): StateEvent<IPoll> {
  return {
    type: 'net.nordeck.poll',
    sender: '@user-id:example.com',
    content: {
      title: 'My Title',
      question: 'My Question',
      description: 'My Description',
      pollType: PollType.Open,
      answers: [
        { id: '1', label: 'Yes' },
        { id: '2', label: 'No' },
      ],
      resultType: ResultType.Visible,
      duration: 1,
      groups: [
        {
          id: 'red-party',
          eventId: '$event-id-0',
          abbreviation: 'Red Party',
          color: '#ff0000',
          votingRights: {
            '@user-alice:example.com': {
              state: 'active',
            },
            '@user-bob:example.com': {
              state: 'active',
            },
            '@user-charlie:example.com': {
              state: 'active',
            },
          },
        },
        {
          id: 'blue-party',
          eventId: '$event-id-1',
          abbreviation: 'Blue Party',
          color: '#0000ff',
          votingRights: {
            '@user-dameon:example.com': {
              state: 'active',
            },
          },
        },
      ],
      ...content,
    },
    state_key,
    origin_server_ts,
    event_id,
    room_id: '!room-id:example.com',
  };
}

/**
 * Create a poll start event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockPollStart({
  event_id = '$start-event-id',
  origin_server_ts = 0,
  content = {},
}: {
  state_key?: string;
  event_id?: string;
  origin_server_ts?: number;
  content?: Partial<PollStartEvent>;
} = {}): RoomEvent<PollStartEvent> {
  return {
    type: 'net.nordeck.poll.start',
    sender: '@user-id:example.com',
    content: {
      ...content,
    },
    origin_server_ts,
    event_id,
    room_id: '!room-id:example.com',
  };
}

/**
 * Create a group event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockGroup({
  state_key = 'group-0',
  event_id = '$event-id-0',
  content = {},
}: {
  state_key?: string;
  event_id?: string;
  content?: Partial<GroupContent>;
} = {}): StateEvent<GroupContent> {
  return {
    type: 'net.nordeck.poll.group',
    sender: '@user-id:example.com',
    content: {
      abbreviation: 'GROUP 0',
      color: '#07f556',
      members: {},
      ...content,
    },
    state_key,
    origin_server_ts: 0,
    event_id,
    room_id: '!room-id:example.com',
  };
}

/**
 * Create a matrix vote event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockVote({
  event_id,
  sender = '@user-bob:example.com',
  origin_server_ts = 0,
  content = {},
}: {
  event_id?: string;
  sender?: string;
  origin_server_ts?: number;
  content?: Partial<IVote>;
} = {}): RoomEvent<IVote> {
  return {
    type: 'net.nordeck.poll.vote',
    sender,
    content: {
      answerId: '1',
      pollId: 'poll-0',
      'm.relates_to': {
        rel_type: 'm.reference',
        event_id: '$start-event-id',
      },
      ...content,
    },
    origin_server_ts,
    event_id: event_id ?? sender,
    room_id: '!room-id:example.com',
  };
}

/**
 * Create a poll settings event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockPollSettings({
  event_id = '$event-id-0',
  content = {},
}: {
  event_id?: string;
  content?: Partial<IPollSettings>;
} = {}): StateEvent<IPollSettings> {
  return {
    type: 'net.nordeck.poll.settings',
    sender: '@user-id:example.com',
    content: {
      ...content,
    },
    state_key: '!room-id:example.com',
    origin_server_ts: 0,
    event_id,
    room_id: '!room-id:example.com',
  };
}

/**
 * Create a room version 11 create event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockRoomVersion11CreateEvent({
  event_id = '$event-id-0',
  origin_server_ts = 0,
  content = {},
}: {
  event_id?: string;
  origin_server_ts?: number;
  content?: Partial<{ room_version: '11' }>;
} = {}): StateEvent<StateEventCreateContent> {
  return {
    type: 'm.room.create',
    sender: '@user-id:example.com',
    content: {
      room_version: '11',
      ...content,
    },
    origin_server_ts,
    event_id,
    room_id: '!room-id:example.com',
    state_key: '',
  };
}
