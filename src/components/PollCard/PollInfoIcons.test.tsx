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
import axe from 'axe-core';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mockPoll } from '../../lib/testUtils';
import { PollType } from '../../model';
import { createStore } from '../../store';
import { PollInfoIcons } from './PollInfoIcons';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<PollInfosIcons/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    widgetApi.mockSendStateEvent(mockPoll());

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
    render(<PollInfoIcons pollId="poll-0" showVotes />, {
      wrapper: Wrapper,
    });

    const list = await screen.findByRole('list', { name: /poll details/i });

    expect(
      within(list).getByRole('listitem', {
        name: /open poll \(grouped\)/i,
      }),
    ).toBeInTheDocument();

    expect(
      within(list).getByRole('listitem', { name: /4 voters/i }),
    ).toBeInTheDocument();

    expect(
      within(list).getByRole('listitem', { name: /0 voting persons/i }),
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<PollInfoIcons pollId="poll-0" showVotes />, {
      wrapper: Wrapper,
    });

    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('should render open polls', async () => {
    widgetApi.mockSendStateEvent(
      mockPoll({ content: { pollType: PollType.Open, groups: undefined } }),
    );

    render(<PollInfoIcons pollId="poll-0" showVotes />, {
      wrapper: Wrapper,
    });

    const list = await screen.findByRole('list', { name: /poll details/i });

    const typeItem = within(list).getByRole('listitem', {
      name: /open poll/i,
    });
    expect(within(typeItem).getByTestId('LockOpenIcon')).toBeInTheDocument();
  });

  it('should render secret polls', async () => {
    widgetApi.mockSendStateEvent(
      mockPoll({ content: { pollType: PollType.Secret, groups: undefined } }),
    );

    render(<PollInfoIcons pollId="poll-0" showVotes />, {
      wrapper: Wrapper,
    });

    const list = await screen.findByRole('list', { name: /poll details/i });

    const typeItem = within(list).getByRole('listitem', {
      name: /secret poll/i,
    });
    expect(within(typeItem).getByTestId('LockIcon')).toBeInTheDocument();
  });

  it('should render named polls', async () => {
    widgetApi.mockSendStateEvent(
      mockPoll({ content: { pollType: PollType.ByName, groups: undefined } }),
    );

    render(<PollInfoIcons pollId="poll-0" showVotes />, {
      wrapper: Wrapper,
    });

    const list = await screen.findByRole('list', { name: /poll details/i });

    const typeItem = within(list).getByRole('listitem', {
      name: /poll by name/i,
    });
    expect(within(typeItem).getByTestId('BadgeIcon')).toBeInTheDocument();
  });

  it('should render loading state when votes still loading', async () => {
    widgetApi.receiveRoomEvents.mockReturnValue(new Promise(() => {}));

    widgetApi.mockSendStateEvent(
      mockPoll({ content: { pollType: PollType.Open, groups: undefined } }),
    );

    render(<PollInfoIcons pollId="poll-0" showVotes />, {
      wrapper: Wrapper,
    });

    const list = await screen.findByRole('list', { name: /poll details/i });

    expect(
      within(list).getByRole('listitem', { name: /Votes loading/i }),
    ).toBeInTheDocument();
  });

  it('should not render votes when loading them failed', async () => {
    widgetApi.receiveRoomEvents.mockRejectedValue(new Error('Some Error'));

    widgetApi.mockSendStateEvent(
      mockPoll({ content: { pollType: PollType.Open, groups: undefined } }),
    );

    render(<PollInfoIcons pollId="poll-0" showVotes />, {
      wrapper: Wrapper,
    });

    const list = await screen.findByRole('list', { name: /poll details/i });

    expect(
      within(list).getByRole('listitem', {
        name: /open poll/i,
      }),
    ).toBeInTheDocument();

    expect(
      within(list).getByRole('listitem', { name: /0 voters/i }),
    ).toBeInTheDocument();

    expect(
      within(list).queryByRole('listitem', { name: /Votes loading/i }),
    ).not.toBeInTheDocument();

    expect(
      within(list).queryByRole('listitem', { name: /0 voting persons/i }),
    ).not.toBeInTheDocument();
  });
});
