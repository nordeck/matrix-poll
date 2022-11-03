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

import { WidgetApiMockProvider } from '@matrix-widget-toolkit/react';
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { mockPoll } from '../../lib/testUtils';
import { createStore } from '../../store';
import { PollsListFinished } from './PollsListFinished';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<PollsListFinished/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    widgetApi.mockSendStateEvent(
      mockPoll({
        content: {
          startTime: '2020-01-01T00:00:00Z',
          endTime: '2020-01-01T00:01:00Z',
          startEventId: '$start-event-id',
        },
      })
    );
    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-1',
        content: {
          title: 'Another Title',
          startTime: '2020-01-01T00:00:00Z',
          endTime: '2020-01-01T00:01:00Z',
          startEventId: '$start-event-id2',
        },
      })
    );

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const store = useMemo(() => createStore({ widgetApi }), []);
      return (
        <Provider store={store}>
          <WidgetApiMockProvider value={widgetApi}>
            {children}
          </WidgetApiMockProvider>
        </Provider>
      );
    };
  });

  it('should render without exploding', async () => {
    render(<PollsListFinished />, { wrapper: Wrapper });

    expect(
      screen.getByRole('heading', { level: 3, name: /finished polls/i })
    ).toBeInTheDocument();
    await expect(screen.findByText('2')).resolves.toBeInTheDocument();

    const list = screen.getByRole('list', { name: /finished polls/i });

    expect(
      within(list).getByRole('listitem', { name: /my title/i })
    ).toBeInTheDocument();
    expect(
      within(list).getByRole('listitem', { name: /another title/i })
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<PollsListFinished />, { wrapper: Wrapper });

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have an accessible description that refers to the poll title', async () => {
    render(<PollsListFinished />, { wrapper: Wrapper });

    const finishedPollList = screen.getByRole('list', {
      name: /finished polls/i,
    });
    const finishedPollListItem = await within(finishedPollList).findByRole(
      'listitem',
      { name: 'Another Title' }
    );

    expect(
      within(finishedPollListItem).getByRole('button', {
        name: 'See result',
      })
    ).toHaveAccessibleDescription('Another Title');
  });

  it('should show a loading state', async () => {
    widgetApi.readEventRelations.mockReturnValue(new Promise(() => {}));
    render(<PollsListFinished />, { wrapper: Wrapper });

    const finishedPollList = screen.getByRole('list', {
      name: /finished polls/i,
    });
    const finishedPollListItem = await within(finishedPollList).findByRole(
      'listitem',
      { name: 'Another Title' }
    );
    expect(
      within(finishedPollListItem).getByTestId('votesLoadingPollFinished')
    ).toBeInTheDocument();
  });

  it('should show an error message when votes failed to load', async () => {
    widgetApi.readEventRelations.mockRejectedValue(new Error('Some Error'));
    render(<PollsListFinished />, { wrapper: Wrapper });

    const finishedPollList = screen.getByRole('list', {
      name: /finished polls/i,
    });
    const finishedPollListItem = await within(finishedPollList).findByRole(
      'listitem',
      { name: 'Another Title' }
    );

    const alert = await within(finishedPollListItem).findByRole('status');
    expect(
      within(alert).getByText('Data could not be loaded.')
    ).toBeInTheDocument();

    expect(
      within(finishedPollListItem).queryByText(/See result/)
    ).not.toBeInTheDocument();
  });
});
