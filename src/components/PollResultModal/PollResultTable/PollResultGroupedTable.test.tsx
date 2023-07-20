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

import { render, screen, within } from '@testing-library/react';
import { mockPoll } from '../../../lib/testUtils';
import { PollType } from '../../../model';
import { PollInvalidAnswer, SelectPollResults } from '../../../store';
import { PollResultGroupedTable } from './PollResultGroupedTable';

describe('<PollResultGroupedTable/>', () => {
  let pollResult: SelectPollResults;

  beforeEach(() => {
    pollResult = {
      poll: mockPoll({
        content: {
          pollType: PollType.Open,
          startTime: '2020-01-01T03:33:55Z',
        },
      }),
      results: {
        votes: {
          '@user-1': '1',
          '@user-2': PollInvalidAnswer,
          '@user-3': '2',
          '@user-4': '1',
        },
      },
      groupedResults: {
        'red-party': {
          abbreviation: 'Red Party',
          color: '#ff0000',
          invalidVoters: {},
          votes: {
            '@user-1': '1',
            '@user-2': PollInvalidAnswer,
          },
        },
        'blue-party': {
          abbreviation: 'Blue Party',
          color: '#0000ff',
          invalidVoters: {},
          votes: {
            '@user-3': '2',
            '@user-4': '1',
          },
        },
      },
      votingRights: ['@user-1', '@user-2', '@user-3', '@user-4'],
    };
  });

  it('should render finished poll result', () => {
    render(<PollResultGroupedTable isFinished pollResults={pollResult} />);

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');

    expect(within(rows[0]).getAllByRole('columnheader')).toHaveLength(3);

    // Actually a rowheader, but the testing library is broken here
    expect(
      within(rows[1]).getByRole('columnheader', { name: 'Yes' }),
    ).toBeInTheDocument();
    expect(
      within(rows[1]).getByRole('rowheader', { name: 'Total' }),
    ).toBeInTheDocument();
    expect(within(rows[1]).getByRole('cell')).toHaveTextContent('2');

    expect(
      within(rows[2]).getByRole('rowheader', { name: 'Red Party' }),
    ).toBeInTheDocument();
    expect(within(rows[2]).getByRole('cell')).toHaveTextContent('1');

    expect(
      within(rows[3]).getByRole('rowheader', { name: 'Blue Party' }),
    ).toBeInTheDocument();
    expect(within(rows[3]).getByRole('cell')).toHaveTextContent('1');

    // Actually a rowheader, but the testing library is broken here
    expect(
      within(rows[4]).getByRole('columnheader', { name: 'No' }),
    ).toBeInTheDocument();
    expect(
      within(rows[4]).getByRole('rowheader', { name: 'Total' }),
    ).toBeInTheDocument();
    expect(within(rows[4]).getByRole('cell')).toHaveTextContent('1');

    expect(
      within(rows[5]).getByRole('rowheader', { name: 'Red Party' }),
    ).toBeInTheDocument();
    expect(within(rows[5]).getByRole('cell')).toHaveTextContent('0');

    expect(
      within(rows[6]).getByRole('rowheader', { name: 'Blue Party' }),
    ).toBeInTheDocument();
    expect(within(rows[6]).getByRole('cell')).toHaveTextContent('1');

    // Actually a rowheader, but the testing library is broken here
    expect(
      within(rows[7]).getByRole('columnheader', { name: 'Invalid' }),
    ).toBeInTheDocument();
    expect(
      within(rows[7]).getByRole('rowheader', { name: 'Total' }),
    ).toBeInTheDocument();
    expect(within(rows[7]).getByRole('cell')).toHaveTextContent('1');

    expect(
      within(rows[8]).getByRole('rowheader', { name: 'Red Party' }),
    ).toBeInTheDocument();
    expect(within(rows[8]).getByRole('cell')).toHaveTextContent('1');

    expect(
      within(rows[9]).getByRole('rowheader', { name: 'Blue Party' }),
    ).toBeInTheDocument();
    expect(within(rows[9]).getByRole('cell')).toHaveTextContent('0');
  });

  it('should render unfinished poll result', () => {
    render(<PollResultGroupedTable pollResults={pollResult} />);

    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');

    expect(within(rows[0]).getAllByRole('columnheader')).toHaveLength(3);

    // Actually a rowheader, but the testing library is broken here
    expect(
      within(rows[1]).getByRole('columnheader', { name: 'Yes' }),
    ).toBeInTheDocument();
    expect(
      within(rows[1]).getByRole('rowheader', { name: 'Total' }),
    ).toBeInTheDocument();
    expect(within(rows[1]).getByRole('cell')).toHaveTextContent('2');

    expect(
      within(rows[2]).getByRole('rowheader', { name: 'Red Party' }),
    ).toBeInTheDocument();
    expect(within(rows[2]).getByRole('cell')).toHaveTextContent('1');

    expect(
      within(rows[3]).getByRole('rowheader', { name: 'Blue Party' }),
    ).toBeInTheDocument();
    expect(within(rows[3]).getByRole('cell')).toHaveTextContent('1');

    // Actually a rowheader, but the testing library is broken here
    expect(
      within(rows[4]).getByRole('columnheader', { name: 'No' }),
    ).toBeInTheDocument();
    expect(
      within(rows[4]).getByRole('rowheader', { name: 'Total' }),
    ).toBeInTheDocument();
    expect(within(rows[4]).getByRole('cell')).toHaveTextContent('1');

    expect(
      within(rows[5]).getByRole('rowheader', { name: 'Red Party' }),
    ).toBeInTheDocument();
    expect(within(rows[5]).getByRole('cell')).toHaveTextContent('0');

    expect(
      within(rows[6]).getByRole('rowheader', { name: 'Blue Party' }),
    ).toBeInTheDocument();
    expect(within(rows[6]).getByRole('cell')).toHaveTextContent('1');
  });
});
