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

import { mockPoll } from '../../../lib/testUtils';
import { SelectPollResults } from '../../../store';
import { createPollPdfSpecifics } from './createPollPdfSpecifics';

describe('createPollPdfSpecifics', () => {
  const getUserDisplayName = (id: string) => `Name of ${id}`;

  it('should generate a poll specifics content if there is a group and someone is represented', () => {
    const pollResult: SelectPollResults = {
      poll: mockPoll({
        content: {
          groups: [
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
                  representedBy: 'user-backup-1',
                },
              },
            },
            {
              id: 'blue-party',
              eventId: 'event-id-1',
              abbreviation: 'Blue Party',
              color: '#0000ff',
              votingRights: {
                'user-dameon': {
                  state: 'represented',
                  representedBy: 'user-backup-2',
                },
              },
            },
          ],
        },
      }),
      results: {
        votes: {},
      },
      votingRights: [],
    };

    expect(
      createPollPdfSpecifics(pollResult, getUserDisplayName)
    ).toMatchSnapshot();
  });

  it('should generate a poll specifics content if there is a group, someone is representing someone else and someone is not represented', () => {
    const pollResult: SelectPollResults = {
      poll: mockPoll({
        content: {
          groups: [
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
                  representedBy: 'user-backup-1',
                },
                'user-charlie': {
                  state: 'invalid',
                },
              },
            },
            {
              id: 'blue-party',
              eventId: 'event-id-1',
              abbreviation: 'Blue Party',
              color: '#0000ff',
              votingRights: {
                'user-dameon': {
                  state: 'represented',
                  representedBy: 'user-backup-2',
                },
              },
            },
          ],
        },
      }),
      results: {
        votes: {},
      },
      votingRights: [],
    };

    expect(
      createPollPdfSpecifics(pollResult, getUserDisplayName)
    ).toMatchSnapshot();
  });

  it('should not generate a poll specifics content if there is no group', () => {
    const pollResult: SelectPollResults = {
      poll: mockPoll({
        content: {
          groups: undefined,
          startTime: '2020-01-01T03:33:55Z',
        },
      }),
      results: {
        votes: {},
      },
      votingRights: [],
    };

    expect(
      createPollPdfSpecifics(pollResult, getUserDisplayName)
    ).toMatchSnapshot();
  });

  it('should generate a poll specifics content if there is a group with absent delegate without representing', () => {
    const pollResult: SelectPollResults = {
      poll: mockPoll({
        content: {
          groups: [
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
                  state: 'invalid',
                },
              },
            },
            {
              id: 'blue-party',
              eventId: 'event-id-1',
              abbreviation: 'Blue Party',
              color: '#0000ff',
              votingRights: {
                'user-dameon': {
                  state: 'active',
                },
              },
            },
          ],
          startTime: '2020-01-01T03:33:55Z',
        },
      }),
      results: {
        votes: {},
      },
      votingRights: [],
    };

    expect(
      createPollPdfSpecifics(pollResult, getUserDisplayName)
    ).toMatchSnapshot();
  });
});
