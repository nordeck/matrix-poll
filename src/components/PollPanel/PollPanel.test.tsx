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
  WidgetApiMockProvider,
} from '@matrix-widget-toolkit/react';
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mockGroup,
  mockPoll,
  mockPollSettings,
  mockPowerLevelsEvent,
} from '../../lib/testUtils';
import { createStore } from '../../store';
import { PollModalResult } from '../CreatePollModal';
import { PollPanel } from './PollPanel';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

afterEach(() => vi.useRealTimers());

describe('<PollPanel>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    widgetApi.mockSendStateEvent(
      mockGroup({
        state_key: 'red-party',
        event_id: 'event-id-0',
        content: {
          abbreviation: 'Red Party',
          color: '#ff0000',
          members: {
            '@user-alice:example.com': {
              memberRole: 'delegate',
            },
            '@user-bob:example.com': {
              memberRole: 'delegate',
            },
            '@user-charlie:example.com': {
              memberRole: 'delegate',
            },
            '@user-eric:example.com': {
              memberRole: 'representative',
            },
          },
        },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockGroup({
        event_id: 'event-id-1',
        state_key: 'blue-party',
        content: {
          abbreviation: 'Blue Party',
          color: '#0000ff',
          members: {
            '@user-dameon:example.com': {
              memberRole: 'delegate',
            },
          },
        },
      }),
    );

    widgetApi.mockSendStateEvent(mockPoll());
    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-1',
        content: {
          startTime: '3999-12-31T00:00:00Z',
          endTime: '3999-12-31T00:01:00Z',
        },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-2',
        content: {
          startTime: '2020-01-01T00:00:00Z',
          endTime: '2020-01-01T00:01:00Z',
        },
      }),
    );

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const store = useMemo(() => createStore({ widgetApi }), []);
      return (
        <ThemeSelectionProvider>
          <WidgetApiMockProvider value={widgetApi}>
            <Provider store={store}>{children}</Provider>
          </WidgetApiMockProvider>
        </ThemeSelectionProvider>
      );
    };
  });

  it('should render without exploding', async () => {
    render(<PollPanel />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('list', { name: /not started polls/i }),
    ).resolves.toBeInTheDocument();
    expect(
      screen.getByRole('list', { name: /active polls/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('list', { name: /finished polls/i }),
    ).toBeInTheDocument();

    const nav = await screen.findByRole('navigation');

    await expect(
      within(nav).findByRole('button', { name: /create new poll/i }),
    ).resolves.toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<PollPanel />, {
      wrapper: Wrapper,
    });

    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('should reorder upcoming polls', async () => {
    widgetApi.clearStateEvents();
    widgetApi.mockSendStateEvent(mockPoll());
    widgetApi.mockSendStateEvent(
      mockPoll({ state_key: 'poll-1', content: { title: 'Another Title' } }),
    );
    widgetApi.mockSendStateEvent(
      mockPollSettings({ content: { pollsOrder: ['poll-1', 'poll-0'] } }),
    );

    const { baseElement } = render(<PollPanel />, {
      wrapper: Wrapper,
    });

    const list = await screen.findByRole('list', {
      name: /not started polls/i,
    });

    await waitFor(() => {
      expect(
        within(list)
          .getAllByRole('listitem', { name: /title$/i })
          .map((c) => c.textContent),
      ).toEqual([
        expect.stringMatching(/another title/i),
        expect.stringMatching(/my title/i),
      ]);
    });

    const poll = within(list).getByRole('listitem', { name: /my title/i });
    const reorderButton = within(poll).getByRole('button', {
      name: 'Reorder polls',
      description: /My Title \. Press space bar to start a drag./,
    });

    reorderButton.focus();

    // Move the element one up by pressing space, arrow up and space to drop it
    // again.
    // While using await userEvent.keyboard('{Space}{ArrowUp}{Space}') should be
    // preferred, we can't use it here as rbd uses the keyCode property on the
    // event, however userEvent is not sending it anymore.
    fireEvent.keyDown(reorderButton, { keyCode: 32 /*{Space}*/ });

    await waitForAnnouncement(
      baseElement,
      /You have lifted a poll\. It is in position 2 of 2 in the list\./,
    );

    fireEvent.keyDown(reorderButton, { keyCode: 38 /*{ArrowUp}*/ });

    await waitForAnnouncement(
      baseElement,
      /You have moved the poll to position 1 of 2\./,
    );

    fireEvent.keyDown(reorderButton, { keyCode: 32 /*{Space}*/ });

    await waitForAnnouncement(
      baseElement,
      /You have dropped the poll\. It has moved from position 2 to 1\./,
    );

    await waitFor(() => {
      expect(
        within(list)
          .getAllByRole('listitem', { name: /title$/i })
          .map((c) => c.textContent),
      ).toEqual([
        expect.stringMatching(/my title/i),
        expect.stringMatching(/another title/i),
      ]);
    });
  });

  it('should rerender when the first running poll finishes', async () => {
    widgetApi.clearStateEvents();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2020-01-01T09:59:30Z'));

    widgetApi.mockSendStateEvent(
      mockPoll({
        content: {
          startTime: '2020-01-01T09:59:00Z',
          endTime: '2020-01-01T10:00:00Z',
        },
      }),
    );

    render(<PollPanel />, { wrapper: Wrapper });

    const activeList = await screen.findByRole('list', {
      name: /active polls/i,
    });
    const activePoll = within(activeList).getByRole('listitem', {
      name: 'My Title',
    });
    expect(
      screen.queryByRole('list', { name: /finished polls/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Documentation' }),
    ).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(activePoll).not.toBeInTheDocument();

    const finishedList = await screen.findByRole('list', {
      name: /finished polls/i,
    });
    expect(
      within(finishedList).getByRole('listitem', {
        name: 'My Title',
      }),
    ).toBeInTheDocument();
    await expect(
      screen.findByRole('region', { name: 'Documentation' }),
    ).resolves.toBeInTheDocument();
  });

  it('should rerender when a running poll finishes', async () => {
    widgetApi.clearStateEvents();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2020-01-01T09:59:30Z'));

    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'finished-poll',
        content: {
          title: 'A finished poll',
          startTime: '2020-01-01T00:00:00Z',
          endTime: '2020-01-01T00:01:00Z',
        },
      }),
    );

    widgetApi.mockSendStateEvent(
      mockPoll({
        content: {
          startTime: '2020-01-01T09:59:00Z',
          endTime: '2020-01-01T10:00:00Z',
        },
      }),
    );

    render(<PollPanel />, { wrapper: Wrapper });

    const activeList = await screen.findByRole('list', {
      name: /active polls/i,
    });
    const finishedList = screen.getByRole('list', {
      name: /finished polls/i,
    });
    expect(
      within(finishedList).getByRole('listitem', { name: 'A finished poll' }),
    ).toBeInTheDocument();

    const activePoll = within(activeList).getByRole('listitem', {
      name: 'My Title',
    });

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(activePoll).not.toBeInTheDocument();

    expect(
      within(finishedList).getByRole('listitem', {
        name: 'My Title',
      }),
    ).toBeInTheDocument();
  });

  it('should skip the poll creation if the user aborts the action', async () => {
    render(<PollPanel />, { wrapper: Wrapper });

    const nav = await screen.findByRole('navigation');

    await userEvent.click(
      within(nav).getByRole('button', { name: /create new poll/i }),
    );

    expect(widgetApi.openModal).toBeCalledWith(
      'create-poll',
      'Create new poll',
      {
        buttons: [
          {
            disabled: true,
            id: 'net.nordeck.poll.submit',
            kind: 'm.primary',
            label: 'Save',
          },
          {
            id: 'net.nordeck.poll.cancel',
            kind: 'm.secondary',
            label: 'Cancel',
          },
        ],
      },
    );

    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });

  it('should create a new poll', async () => {
    widgetApi.openModal.mockResolvedValue({
      poll: mockPoll().content,
    } as PollModalResult);

    render(<PollPanel />, { wrapper: Wrapper });

    const nav = await screen.findByRole('navigation');

    await userEvent.click(
      within(nav).getByRole('button', { name: /create new poll/i }),
    );

    expect(widgetApi.openModal).toBeCalledWith(
      'create-poll',
      'Create new poll',
      {
        buttons: [
          {
            disabled: true,
            id: 'net.nordeck.poll.submit',
            kind: 'm.primary',
            label: 'Save',
          },
          {
            id: 'net.nordeck.poll.cancel',
            kind: 'm.secondary',
            label: 'Cancel',
          },
        ],
      },
    );

    await waitFor(() => {
      expect(widgetApi.sendStateEvent).toBeCalledWith(
        'net.nordeck.poll',
        mockPoll().content,
        { stateKey: expect.any(String) },
      );
    });
  });

  it('should not be able to create a poll as a guest', () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: { users_default: 0 },
      }),
    );

    render(<PollPanel />, { wrapper: Wrapper });

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});

async function waitForAnnouncement(
  element: HTMLElement,
  message: string | RegExp,
) {
  await waitFor(() =>
    expect(
      // We are not able to access an aria-live region via the testing library
      element.querySelector('[aria-live=assertive]'),
    ).toHaveTextContent(message),
  );
}
