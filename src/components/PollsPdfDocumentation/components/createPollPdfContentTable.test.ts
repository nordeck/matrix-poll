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

import { t } from 'i18next';
import { mockPoll } from '../../../lib/testUtils';
import { PollType } from '../../../model';
import { PollInvalidAnswer, SelectPollResults } from '../../../store';
import {
  addBreakLineToTheName,
  createPollPdfContentTable,
} from './createPollPdfContentTable';

function mockResults(pollType: PollType): SelectPollResults {
  return {
    poll: mockPoll({
      content: {
        pollType,
        startTime: '2020-01-01T03:33:55Z',
      },
    }),
    results: {
      votes: {
        '@user-1': '1',
        '@user-2': PollInvalidAnswer,
        '@user-3': '2',
      },
    },
    votingRights: ['@user-1', '@user-2'],
  };
}

function mockGroupedResults(pollType: PollType): SelectPollResults {
  return {
    poll: mockPoll({
      content: {
        pollType,
        startTime: '2020-01-01T03:33:55Z',
      },
    }),
    results: {
      votes: {
        '@user-1': '1',
        '@user-2': PollInvalidAnswer,
        '@user-3': '2',
      },
    },
    votingRights: ['@user-1', '@user-2'],
    groupedResults: {
      'group-1': {
        abbreviation: 'Group 1',
        color: '#ff0000',
        votes: {
          '@user-1': '1',
          '@user-2': PollInvalidAnswer,
        },
        invalidVoters: {},
      },
      'group-2': {
        abbreviation: 'Group 2',
        color: '#0000ff',
        votes: {
          '@user-3': '2',
        },
        invalidVoters: {},
      },
      'group-3': {
        abbreviation: 'Group 3',
        color: '#ffaaff',
        votes: {},
        invalidVoters: {},
      },
    },
  };
}

describe('createPollPdfContentTable', () => {
  const getUserDisplayName = (id: string) => `Name of ${id}`;

  it('should generate table for "byName" with groups', () => {
    const pollResult = mockGroupedResults(PollType.ByName);

    expect(
      createPollPdfContentTable(pollResult, { t, getUserDisplayName })
    ).toMatchSnapshot();
  });

  it('should generate table for "byName" without groups', () => {
    const pollResult = mockResults(PollType.ByName);

    expect(
      createPollPdfContentTable(pollResult, { t, getUserDisplayName })
    ).toMatchSnapshot();
  });

  it('should generate table for "open" with groups', () => {
    const pollResult = mockGroupedResults(PollType.Open);

    expect(
      createPollPdfContentTable(pollResult, { t, getUserDisplayName })
    ).toMatchSnapshot();
  });

  it('should not generate table for "open" without groups', () => {
    const pollResult = mockResults(PollType.Open);

    expect(
      createPollPdfContentTable(pollResult, { t, getUserDisplayName })
    ).toEqual([]);
  });

  it('should not generate table for "secret" with groups', () => {
    const pollResult = mockGroupedResults(PollType.Secret);

    expect(
      createPollPdfContentTable(pollResult, { t, getUserDisplayName })
    ).toEqual([]);
  });

  it('should not generate table for "secret" without groups', () => {
    const pollResult = mockResults(PollType.Secret);

    expect(
      createPollPdfContentTable(pollResult, { t, getUserDisplayName })
    ).toEqual([]);
  });

  it('should add to the name a break line every 45 character if there is 3 answer columns', () => {
    let userName: string;

    // no break line
    userName = 'user-1(@someid.that.break.one.time)';
    expect(addBreakLineToTheName(userName, 3)).toBe(
      `user-1(@someid.that.break.one.time)`
    );

    // one break line
    userName = 'user-1(@someid.that.break.one.time.that.break.one.time)';
    expect(addBreakLineToTheName(userName, 3)).toBe(
      'user-1(@someid.that.break.one.time.that.break\n.one.time)'
    );

    // two break line
    userName =
      'user-1(@someid.that.break.one.time.that.break.one.time.that.break.one.time.that.break.one.time)';
    expect(addBreakLineToTheName(userName, 3)).toBe(
      'user-1(@someid.that.break.one.time.that.break\n.one.time.that.break.one.time.that.break.one.\ntime)'
    );
  });

  it('should add to the name a break line every 40 character if there is 4 answer columns', () => {
    let userName: string;

    // no break line
    userName = 'user-1(@someid.that.break.one.time)';
    expect(addBreakLineToTheName(userName, 4)).toBe(
      `user-1(@someid.that.break.one.time)`
    );

    // one break line
    userName = 'user-1(@someid.that.break.one.time.that.break.one.time)';
    expect(addBreakLineToTheName(userName, 4)).toBe(
      'user-1(@someid.that.break.one.time.that.\nbreak.one.time)'
    );

    // two break line
    userName =
      'user-1(@someid.that.break.one.time.that.break.one.time.that.break.one.time.that.break.one.time)';
    expect(addBreakLineToTheName(userName, 4)).toBe(
      'user-1(@someid.that.break.one.time.that.\nbreak.one.time.that.break.one.time.that.\nbreak.one.time)'
    );
  });
});
