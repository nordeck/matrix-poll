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

import { mockGroup } from '../lib/testUtils';
import {
  isValidGroupEvent,
  MemberContent,
  migratePollGroupSchema,
} from './IGroup';

describe('isValidGroupEvent', () => {
  it('should accept event', () => {
    expect(
      isValidGroupEvent({
        content: {
          abbreviation: 'CDU',
          color: 'black',
          members: {
            '@adenauer': { memberRole: 'delegate' },
            '@erhard': { memberRole: 'representative' },
          },
        },
        state_key: 'group-id',
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'net.nordeck.poll.group',
      }),
    ).toBe(true);
  });

  it('should accept additional properties', () => {
    expect(
      isValidGroupEvent({
        content: {
          abbreviation: 'CDU',
          color: 'black',
          members: {
            '@adenauer': { memberRole: 'delegate', additional: 'data' },
            '@erhard': { memberRole: 'representative', additional: 'data' },
          },
          additional: 'data',
        },
        state_key: 'group-id',
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'net.nordeck.poll.group',
      }),
    ).toBe(true);
  });

  it.each<Object>([
    { abbreviation: undefined },
    { abbreviation: null },
    { abbreviation: 111 },
    { abbreviation: '' },
    { color: undefined },
    { color: null },
    { color: 111 },
    { color: '' },
    { members: undefined },
    { members: null },
    { members: 111 },
    { members: { '@adenauer': null } },
    { members: { '@adenauer': 111 } },
    // While the next rule is desired, we need to stay backward compatible
    //{ members: { '@adenauer': { memberRole: undefined } } },
    { members: { '@adenauer': { memberRole: null } } },
    { members: { '@adenauer': { memberRole: 111 } } },
    { members: { '@adenauer': { memberRole: 'unknown' } } },
  ])('should reject event with patch %j', (patch: Object) => {
    expect(
      isValidGroupEvent({
        content: {
          abbreviation: 'CDU',
          color: 'black',
          members: {
            '@adenauer': { memberRole: 'delegate' },
            '@erhard': { memberRole: 'representative' },
          },
          ...patch,
        },
        state_key: 'group-id',
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'net.nordeck.poll.group',
      }),
    ).toBe(false);
  });
});

describe('migratePollGroupSchema', () => {
  it('should remove members that have a leaveDate', () => {
    const group = mockGroup({
      content: {
        abbreviation: 'Gruppe 1',
        color: '#1d1adb',
        members: {
          '@user-alice': {
            memberRole: 'delegate',
          },
          '@user-charlie': {
            joinDate: '2022-03-08T09:45:36.862Z',
            leaveDate: '2022-03-08T10:45:36.862Z',
            memberRole: 'representative',
          } as MemberContent,
        },
      },
    });

    expect(migratePollGroupSchema(group)).toEqual(
      mockGroup({
        content: {
          abbreviation: 'Gruppe 1',
          color: '#1d1adb',
          members: {
            '@user-alice': {
              memberRole: 'delegate',
            },
          },
        },
      }),
    );
  });

  it('should remove joinDate and leaveDate', () => {
    const group = mockGroup({
      content: {
        abbreviation: 'Gruppe 1',
        color: '#1d1adb',
        members: {
          '@user-alice': {
            joinDate: '2022-03-08T09:45:33.411Z',
            memberRole: 'delegate',
          } as MemberContent,
          '@user-bob': {
            joinDate: '2022-03-08T09:45:33.411Z',
            leaveDate: undefined,
            memberRole: 'delegate',
          } as MemberContent,
        },
      },
    });

    expect(migratePollGroupSchema(group)).toEqual(
      mockGroup({
        content: {
          abbreviation: 'Gruppe 1',
          color: '#1d1adb',
          members: {
            '@user-alice': {
              memberRole: 'delegate',
            },
            '@user-bob': {
              memberRole: 'delegate',
            },
          },
        },
      }),
    );
  });

  it('should add missing memberRole', () => {
    const group = mockGroup({
      content: {
        abbreviation: 'Gruppe 1',
        color: '#1d1adb',
        members: {
          '@user-alice': {} as MemberContent,
          '@user-bob': {
            memberRole: 'delegate',
          },
        },
      },
    });

    expect(migratePollGroupSchema(group)).toEqual(
      mockGroup({
        content: {
          abbreviation: 'Gruppe 1',
          color: '#1d1adb',
          members: {
            '@user-alice': {
              memberRole: 'delegate',
            },
            '@user-bob': {
              memberRole: 'delegate',
            },
          },
        },
      }),
    );
  });
});
