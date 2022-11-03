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

import { ThemeSelectionProvider } from '@matrix-widget-toolkit/react';
import { render, screen } from '@testing-library/react';
import { ComponentType, PropsWithChildren } from 'react';
import { mockPoll } from '../../../lib/testUtils';
import { PollType } from '../../../model';
import { PollInvalidAnswer, SelectPollResults } from '../../../store';
import { PollResultGroupedChartBar } from './PollResultGroupedChartBar';

const mockSimpleBarChart = jest.fn();

jest.mock('@carbon/charts-react', () => ({
  GroupedBarChart: (props: unknown) => {
    // capture the render props
    mockSimpleBarChart(props);

    return <p>GroupedBarChart</p>;
  },
}));

describe('<PollResultGroupedChartBar/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      return <ThemeSelectionProvider>{children}</ThemeSelectionProvider>;
    };
  });

  it('should render finished poll result', () => {
    const pollResult: SelectPollResults = {
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
      votingRights: ['@user-1', '@user-2', '@user-3', '@user-4'],
      groupedResults: {
        'answer-1': {
          abbreviation: 'Group 1',
          color: '#ff0000',
          votes: {
            '@user-1': '1',
            '@user-2': PollInvalidAnswer,
          },
          invalidVoters: {},
        },
        'answer-2': {
          abbreviation: 'Group 2',
          color: '#0000ff',
          votes: {
            '@user-3': '2',
            '@user-4': '1',
          },
          invalidVoters: {},
        },
      },
    };

    render(<PollResultGroupedChartBar isFinished pollResults={pollResult} />, {
      wrapper: Wrapper,
    });

    expect(screen.getByText('GroupedBarChart')).toBeInTheDocument();

    expect(mockSimpleBarChart).toBeCalledWith({
      data: [
        { answer: 'Yes', group: 'Group 1', value: 1 },
        { answer: 'No', group: 'Group 1', value: 0 },
        { answer: 'Invalid', group: 'Group 1', value: 1 },
        { answer: 'Yes', group: 'Group 2', value: 1 },
        { answer: 'No', group: 'Group 2', value: 1 },
        { answer: 'Invalid', group: 'Group 2', value: 0 },
      ],
      options: {
        axes: {
          bottom: {
            mapsTo: 'answer',
            scaleType: 'labels',
          },
          left: {
            mapsTo: 'value',
            ticks: {
              values: [0, 1],
            },
          },
        },
        color: {
          scale: {
            'Group 1': '#ff0000',
            'Group 2': '#0000ff',
          },
        },
        height: '270px',
        theme: 'white',
        toolbar: {
          enabled: false,
        },
        tooltip: {
          enabled: false,
        },
      },
    });
  });

  it('should render unfinished poll result', () => {
    const pollResult: SelectPollResults = {
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
      votingRights: ['@user-1', '@user-2', '@user-3', '@user-4'],
      groupedResults: {
        'answer-1': {
          abbreviation: 'Group 1',
          color: '#ff0000',
          votes: {
            '@user-1': '1',
            '@user-2': PollInvalidAnswer,
          },
          invalidVoters: {},
        },
        'answer-2': {
          abbreviation: 'Group 2',
          color: '#0000ff',
          votes: {
            '@user-3': '2',
            '@user-4': '1',
          },
          invalidVoters: {},
        },
      },
    };

    render(<PollResultGroupedChartBar pollResults={pollResult} />, {
      wrapper: Wrapper,
    });

    expect(screen.getByText('GroupedBarChart')).toBeInTheDocument();

    expect(mockSimpleBarChart).toBeCalledWith({
      data: [
        { answer: 'Yes', group: 'Group 1', value: 1 },
        { answer: 'No', group: 'Group 1', value: 0 },
        { answer: 'Yes', group: 'Group 2', value: 1 },
        { answer: 'No', group: 'Group 2', value: 1 },
      ],
      options: {
        axes: {
          bottom: {
            mapsTo: 'answer',
            scaleType: 'labels',
          },
          left: {
            mapsTo: 'value',
            ticks: {
              values: [0, 1],
            },
          },
        },
        color: {
          scale: {
            'Group 1': '#ff0000',
            'Group 2': '#0000ff',
          },
        },
        height: '270px',
        theme: 'white',
        toolbar: {
          enabled: false,
        },
        tooltip: {
          enabled: false,
        },
      },
    });
  });
});
