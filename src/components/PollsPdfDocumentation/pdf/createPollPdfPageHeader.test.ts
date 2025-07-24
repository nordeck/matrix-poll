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

import { describe, expect, it } from 'vitest';
import { mockRoomMember } from '../../../lib/testUtils';
import { createPollPdfPageHeader } from './createPollPdfPageHeader';

describe('createPollPdfPageHeader', () => {
  it('should generate a pdf header and table', () => {
    const roomMemberEvents = [
      mockRoomMember({
        state_key: '@user-1',
        content: { membership: 'invite' },
      }),
      mockRoomMember({
        state_key: '@user-2',
        content: { membership: 'invite' },
      }),
      mockRoomMember({
        state_key: '@user-3',
        content: { membership: 'join' },
      }),
      mockRoomMember({
        state_key: '@user-4',
        content: { membership: 'leave' },
      }),
      mockRoomMember({
        state_key: '@user-5',
        content: { membership: 'join' },
      }),
      mockRoomMember({
        state_key: '@user-6',
        content: { membership: 'join' },
      }),
    ];

    expect(
      createPollPdfPageHeader({
        roomName: 'PDF Test',
        roomMemberEvents,
      }),
    ).toMatchSnapshot();
  });
});
