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
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  mockPoll,
  mockPowerLevelsEvent,
  mockRoomMember,
  mockVote,
} from '../../lib/testUtils';
import { IPoll } from '../../model';
import { createStore } from '../../store';
import { PollCard } from './PollCard';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<PollCard/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;
  let poll: StateEvent<IPoll>;

  beforeEach(() => {
    poll = widgetApi.mockSendStateEvent(
      mockPoll({
        content: {
          startTime: new Date().toISOString(),
          groups: undefined,
        },
      }),
    );

    widgetApi.mockSendStateEvent(mockPowerLevelsEvent());

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const store = useMemo(() => createStore({ widgetApi }), []);
      return <Provider store={store}>{children}</Provider>;
    };
  });

  it('should render without exploding', async () => {
    render(<PollCard poll={poll.content} pollId={poll.state_key} />, {
      wrapper: Wrapper,
    });

    expect(screen.getByText(/my title/i)).toBeInTheDocument();
    expect(screen.getByText(/my question/i)).toBeInTheDocument();
    expect(screen.getByText(/my description/i)).toBeInTheDocument();
    await expect(
      screen.findByRole('listitem', { name: /open poll/i }),
    ).resolves.toBeInTheDocument();
    expect(
      screen.getByRole('listitem', { name: /0 voters/i }),
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <PollCard poll={poll.content} pollId={poll.state_key} />,
      { wrapper: Wrapper },
    );

    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('should render custom content in all slots', () => {
    render(
      <PollCard
        extra={<p>Extra Slot</p>}
        header={<p>Header Slot</p>}
        headerMeta={<p>Header Meta Slot</p>}
        poll={poll.content}
        pollId={poll.state_key}
      >
        <p>Children</p>
      </PollCard>,
      { wrapper: Wrapper },
    );

    expect(screen.getByText(/header slot/i)).toBeInTheDocument();
    expect(screen.getByText(/header meta slot/i)).toBeInTheDocument();
    expect(screen.getByText(/extra slot/i)).toBeInTheDocument();
    expect(screen.getByText(/children/i)).toBeInTheDocument();
  });

  it('should render cast votes and participants', async () => {
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: 'user-1',
        content: { membership: 'join' },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: 'user-2',
        content: { membership: 'invite' },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: 'user-3',
        content: { membership: 'leave' },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: 'user-4',
        content: { membership: 'ban' },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: 'user-5',
        content: { membership: 'knock' },
      }),
    );

    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: 'user-1',
        origin_server_ts: Date.now(),
        content: { pollId: 'poll-0', answerId: '1' },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: 'user-2',
        origin_server_ts: Date.now(),
        content: { pollId: 'poll-0', answerId: '2' },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: 'user-3',
        origin_server_ts: Date.now(),
        content: { pollId: 'poll-0', answerId: '1' },
      }),
    );

    render(<PollCard poll={poll.content} pollId={poll.state_key} showVotes />, {
      wrapper: Wrapper,
    });

    await expect(
      screen.findByRole('listitem', { name: /3 voters/i }),
    ).resolves.toBeInTheDocument();
    expect(
      screen.getByRole('listitem', { name: /3 voting persons/i }),
    ).toBeInTheDocument();
  });

  it('should render participants when not yet started', async () => {
    poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-0',
        content: { groups: undefined },
      }),
    );

    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: 'user-1',
        content: { membership: 'join' },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: 'user-2',
        content: { membership: 'invite' },
      }),
    );

    render(<PollCard poll={poll.content} pollId={poll.state_key} />, {
      wrapper: Wrapper,
    });

    await expect(
      screen.findByRole('listitem', { name: /2 voters/i }),
    ).resolves.toBeInTheDocument();
    expect(
      screen.queryByRole('listitem', { name: /voting persons/i }),
    ).not.toBeInTheDocument();
  });

  it('should render show correct information if no one voted yet', async () => {
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: 'user-1',
        content: { membership: 'join' },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: 'user-2',
        content: { membership: 'invite' },
      }),
    );

    render(<PollCard poll={poll.content} pollId={poll.state_key} showVotes />, {
      wrapper: Wrapper,
    });

    await expect(
      screen.findByRole('listitem', { name: /2 voters/i }),
    ).resolves.toBeInTheDocument();
    expect(
      screen.getByRole('listitem', { name: /0 voting persons/i }),
    ).toBeInTheDocument();
  });
});
