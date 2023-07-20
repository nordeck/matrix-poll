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
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { mockPoll, mockRoomMember, mockVote } from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { ShowResultsByGroupedNameList } from './ShowResultsByGroupedNameList';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<ShowResultsByGroupedNameList/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-0',
        content: {
          startTime: new Date().toISOString(),
          groups: [
            {
              id: 'group-1',
              eventId: '$...',
              abbreviation: 'Group 1',
              color: '#ff0000',
              votingRights: {
                'user-alice': { state: 'active' },
              },
            },
            {
              id: 'group-2',
              eventId: '$...',
              abbreviation: 'Group 2',
              color: '#0000ff',
              votingRights: {
                'user-bob': { state: 'active' },
              },
            },
          ],
        },
      }),
    );

    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: 'user-alice',
        content: { displayname: 'Alice' },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: 'user-bob',
        content: { displayname: 'Bob' },
      }),
    );

    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: 'user-alice',
        origin_server_ts: Date.now(),
        content: {
          pollId: 'poll-0',
          answerId: '1',
        },
      }),
    );

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const store = useMemo(() => createStore({ widgetApi }), []);
      return (
        <ThemeSelectionProvider>
          <Provider store={store}>{children}</Provider>
        </ThemeSelectionProvider>
      );
    };
  });

  it('should not explode if poll does not exist', () => {
    const { container } = render(
      <ShowResultsByGroupedNameList pollId="another-poll" />,
      { wrapper: Wrapper },
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('should not explode if poll has no groups', () => {
    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-0',
        content: {
          startTime: new Date().toISOString(),
          groups: undefined,
        },
      }),
    );

    const { container } = render(
      <ShowResultsByGroupedNameList pollId="poll-0" />,
      { wrapper: Wrapper },
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <ShowResultsByGroupedNameList pollId="poll-0" />,
      { wrapper: Wrapper },
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should render the poll results', async () => {
    render(<ShowResultsByGroupedNameList pollId="poll-0" />, {
      wrapper: Wrapper,
    });

    const group1List = await screen.findByRole('list', { name: /group 1/i });
    expect(within(group1List).getAllByRole('listitem')).toHaveLength(1);

    const aliceListItem = within(group1List).getByRole('listitem', {
      name: /alice/i,
    });
    within(aliceListItem).getByText(/alice/i);
    within(aliceListItem).getByText(/yes/i);

    const group2List = screen.getByRole('list', { name: /group 2/i });
    const emptyListItem = within(group2List).getByRole('listitem');
    expect(
      within(emptyListItem).getByText(/no votes were cast\./i),
    ).toBeInTheDocument();
  });

  it('should render invalid votes if finished', async () => {
    render(<ShowResultsByGroupedNameList isFinished pollId="poll-0" />, {
      wrapper: Wrapper,
    });

    const group1List = await screen.findByRole('list', { name: /group 1/i });
    expect(within(group1List).getAllByRole('listitem')).toHaveLength(1);

    const aliceListItem = within(group1List).getByRole('listitem', {
      name: /alice/i,
    });
    within(aliceListItem).getByText(/alice/i);
    within(aliceListItem).getByText(/yes/i);

    const group2List = screen.getByRole('list', { name: /group 2/i });
    expect(within(group1List).getAllByRole('listitem')).toHaveLength(1);

    const bobListItem = within(group2List).getByRole('listitem', {
      name: /bob/i,
    });
    within(bobListItem).getByText(/bob/i);
    within(bobListItem).getByText(/invalid/i);
  });
});
