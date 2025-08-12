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
  ThemeSelectionProvider,
  useThemeSelection,
} from '@matrix-widget-toolkit/react';
import { render, screen } from '@testing-library/react';
import { ComponentType, PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockPoll } from '../../../lib/testUtils';
import { PollType } from '../../../model';
import { PollInvalidAnswer, SelectPollResults } from '../../../store';
import PollResultChartBar from './PollResultChartBar';

const mockSimpleBarChart = vi.fn();

vi.mock('@carbon/charts-react', () => ({
  SimpleBarChart: (props: unknown) => {
    // capture the render props
    mockSimpleBarChart(props);

    return <p>SimpleBarChart</p>;
  },
}));

vi.mock('@matrix-widget-toolkit/react', async (importOriginal) => ({
  ...(await importOriginal()),
  useThemeSelection: vi.fn(),
}));

describe('<PollResultChartBar/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    vi.mocked(useThemeSelection).mockReturnValue({
      theme: 'light',
      setTheme: vi.fn(),
      isModal: false,
    });

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
          '@user-1:example.com': '1',
          '@user-2:example.com': PollInvalidAnswer,
          '@user-3:example.com': '2',
          '@user-4:example.com': '1',
        },
      },
      votingRights: [
        '@user-1:example.com',
        '@user-2:example.com',
        '@user-3:example.com',
        '@user-4:example.com',
      ],
    };

    render(<PollResultChartBar isFinished pollResults={pollResult} />, {
      wrapper: Wrapper,
    });

    expect(screen.getByText('SimpleBarChart')).toBeInTheDocument();

    expect(mockSimpleBarChart).toBeCalledWith({
      data: [
        { group: 'Yes', value: 2 },
        { group: 'No', value: 1 },
        { group: 'Invalid', value: 1 },
      ],
      options: {
        color: {
          scale: {
            Invalid: '#7B24FF',
            No: '#5B5201',
            Yes: '#0A60FF',
          },
        },
        axes: {
          bottom: {
            mapsTo: 'group',
            scaleType: 'labels',
          },
          left: {
            mapsTo: 'value',
            ticks: {
              values: [0, 1, 2],
            },
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
    };

    render(<PollResultChartBar pollResults={pollResult} />, {
      wrapper: Wrapper,
    });

    expect(screen.getByText('SimpleBarChart')).toBeInTheDocument();

    expect(mockSimpleBarChart).toBeCalledWith({
      data: [
        { group: 'Yes', value: 2 },
        { group: 'No', value: 1 },
      ],
      options: {
        color: {
          scale: {
            No: '#5B5201',
            Yes: '#0A60FF',
          },
        },
        axes: {
          bottom: {
            mapsTo: 'group',
            scaleType: 'labels',
          },
          left: {
            mapsTo: 'value',
            ticks: {
              values: [0, 1, 2],
            },
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

  it('should change the diagrams colors in dark mode', () => {
    vi.mocked(useThemeSelection).mockReturnValue({
      theme: 'dark',
      setTheme: vi.fn(),
      isModal: false,
    });
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
    };

    render(<PollResultChartBar pollResults={pollResult} />, {
      wrapper: Wrapper,
    });

    expect(screen.getByText('SimpleBarChart')).toBeInTheDocument();

    expect(mockSimpleBarChart).toBeCalledWith({
      data: [
        { group: 'Yes', value: 2 },
        { group: 'No', value: 1 },
      ],
      options: {
        color: {
          scale: {
            No: '#CBB701',
            Yes: '#8AB3FF',
          },
        },
        axes: {
          bottom: {
            mapsTo: 'group',
            scaleType: 'labels',
          },
          left: {
            mapsTo: 'value',
            ticks: {
              values: [0, 1, 2],
            },
          },
        },
        height: '270px',
        theme: 'g100',
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
