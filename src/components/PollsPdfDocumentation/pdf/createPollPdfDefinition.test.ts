/*
 * Copyright 2023 Nordeck IT + Consulting GmbH
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

import { mockPoll, mockRoomMember } from '../../../lib/testUtils';
import { createPollPdfDefinition } from './createPollPdfDefinition';

describe('createPollPdfDefinition', () => {
  const getUserDisplayName = (id: string) => `Name of ${id}`;

  it('should generate a pdf header and table', () => {
    const pollResult = {
      poll: mockPoll({
        content: {
          startTime: '2020-01-01T03:33:55Z',
          endTime: '2020-01-01T03:34:55Z',
        },
      }),
      results: {
        votes: {
          '@user-alice': '1',
        },
      },
      votingRights: ['@user-alice'],
    };
    const roomMember = mockRoomMember();

    expect(
      createPollPdfDefinition({
        authorName: 'Author Name',
        roomName: 'Room Name',
        pollResults: [pollResult],
        roomMemberEvents: [roomMember],
        getUserDisplayName,
      }),
    ).toMatchSnapshot();
  });
});
