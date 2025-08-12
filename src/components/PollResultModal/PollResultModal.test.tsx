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

import { StateEvent } from '@matrix-widget-toolkit/api';
import { ThemeSelectionProvider } from '@matrix-widget-toolkit/react';
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockPoll, mockRoomMember, mockVote } from '../../lib/testUtils';
import { IPoll, PollType } from '../../model';
import { createStore } from '../../store';
import { PollResultModal } from './PollResultModal';

vi.mock('@carbon/charts-react', () => ({
  GroupedBarChart: () => {
    return <p>GroupedBarChart</p>;
  },
  SimpleBarChart: () => {
    return <p>SimpleBarChart</p>;
  },
}));

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<PollResultModal/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;
  let pollEvent: StateEvent<IPoll>;

  beforeEach(() => {
    pollEvent = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-0',
        content: {
          startTime: new Date().toISOString(),
          pollType: PollType.ByName,
          groups: [
            {
              id: 'group-1',
              eventId: '$...',
              abbreviation: 'Group 1',
              color: '#ff0000',
              votingRights: {
                '@user-alice:example.com': { state: 'active' },
              },
            },
            {
              id: 'group-2',
              eventId: '$...',
              abbreviation: 'Group 2',
              color: '#0000ff',
              votingRights: {
                '@user-bob:example.com': { state: 'active' },
              },
            },
          ],
        },
      }),
    );

    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-alice:example.com',
        content: { displayname: 'Alice' },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-bob:example.com',
        content: { displayname: 'Bob' },
      }),
    );

    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-alice:example.com',
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

  it('should render without exploding', async () => {
    render(
      <PollResultModal
        buttonText="Show Results"
        poll={pollEvent.content}
        pollId="poll-0"
        pollIsFinished
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(screen.getByRole('button', { name: 'Show Results' }));

    const dialog = await screen.findByRole('dialog', {
      name: 'My Title',
      description: 'My Question',
    });

    expect(
      within(dialog).getByRole('region', { name: 'My Question' }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('region', { name: 'Results' }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('region', { name: 'Voting persons' }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  });

  it('should hide the voting persons section for open polls', async () => {
    pollEvent = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-0',
        content: {
          startTime: new Date().toISOString(),
          pollType: PollType.Open,
          groups: [
            {
              id: 'group-1',
              eventId: '$...',
              abbreviation: 'Group 1',
              color: '#ff0000',
              votingRights: {
                '@user-alice:example.com': { state: 'active' },
              },
            },
            {
              id: 'group-2',
              eventId: '$...',
              abbreviation: 'Group 2',
              color: '#0000ff',
              votingRights: {
                '@user-bob:example.com': { state: 'active' },
              },
            },
          ],
        },
      }),
    );

    render(
      <PollResultModal
        buttonText="Show Results"
        poll={pollEvent.content}
        pollId="poll-0"
        pollIsFinished
      />,
      { wrapper: Wrapper },
    );

    await userEvent.click(screen.getByRole('button', { name: 'Show Results' }));

    const dialog = await screen.findByRole('dialog', {
      name: 'My Title',
      description: 'My Question',
    });

    expect(
      within(dialog).getByRole('region', { name: 'My Question' }),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole('region', { name: 'Voting persons' }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  });

  //TODO: accessibility to be fixed
  it.skip('should have no accessibility violations', async () => {
    const { container } = render(
      <PollResultModal
        buttonText="Show Results"
        poll={pollEvent.content}
        pollId="poll-0"
        pollIsFinished
      />,
      { wrapper: Wrapper },
    );

    expect(await axe.run(container)).toHaveNoViolations();

    await userEvent.click(screen.getByRole('button', { name: 'Show Results' }));

    expect(await axe.run(container)).toHaveNoViolations();

    const dialog = await screen.findByRole('dialog', {
      name: 'My Title',
      description: 'My Question',
    });

    await userEvent.click(
      within(dialog).getByRole('button', { name: /result display mode/i }),
    );
    await userEvent.click(
      screen.getByRole('option', { name: /result by group/i }),
    );

    expect(
      within(dialog).getByRole('heading', { name: 'Group 1' }),
    ).toBeInTheDocument();

    expect(await axe.run(container)).toHaveNoViolations();
  });
});
