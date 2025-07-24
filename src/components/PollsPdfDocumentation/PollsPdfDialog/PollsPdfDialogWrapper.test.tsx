/*
 * Copyright 2023 Nordeck IT + Consulting GmbH
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
import { render, screen } from '@testing-library/react';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mockPoll,
  mockRoomMember,
  mockRoomName,
  mockVote,
} from '../../../lib/testUtils';
import { PollType } from '../../../model';
import { createStore, PollInvalidAnswer } from '../../../store';
import { createPollPdf } from '../pdf';
import PollsPdfDialogWrapper from './PollsPdfDialogWrapper';

// The pdf library doesn't work in test, so we mock pdf generation completely
vi.mock('../pdf', () => ({ createPollPdf: vi.fn() }));

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<PollsPdfDialogWrapper>', () => {
  const onClose = vi.fn();
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    widgetApi.mockSendStateEvent(mockRoomMember());

    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-id',
        content: {
          displayname: 'My User',
        },
      }),
    );

    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-0',
        content: {
          startTime: '2020-01-02T00:00:00Z',
          endTime: '2020-01-02T00:01:00Z',
          title: 'Second Poll',
          pollType: PollType.ByName,
          groups: undefined,
        },
      }),
    );

    widgetApi.mockSendRoomEvent(
      mockVote({ sender: '@user-alice', origin_server_ts: 1577923215000 }),
    );

    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-1',
        content: {
          startTime: '2020-01-01T00:00:00Z',
          endTime: '2020-01-01T00:01:00Z',
          title: 'First Poll',
          groups: undefined,
        },
      }),
    );

    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-2',
        content: {
          startTime: '2999-12-31T23:23:59Z',
          endTime: '2999-12-31T23:24:59Z',
          title: 'Third Poll',
          groups: undefined,
        },
      }),
    );

    widgetApi.mockSendStateEvent(mockRoomName());

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const store = useMemo(() => createStore({ widgetApi }), []);
      return (
        <WidgetApiMockProvider value={widgetApi}>
          <Provider store={store}>{children}</Provider>
        </WidgetApiMockProvider>
      );
    };

    vi.mocked(URL.createObjectURL).mockReturnValue('blob:url');
  });

  it('should generate pdf', async () => {
    vi.mocked(createPollPdf).mockResolvedValue(new Blob(['value']));

    render(<PollsPdfDialogWrapper onClose={onClose} />, { wrapper: Wrapper });

    const link = await screen.findByRole('link', { name: 'Download' });
    expect(link).toHaveAttribute('href', 'blob:url');

    expect(vi.mocked(createPollPdf)).toBeCalledTimes(1);
    expect(vi.mocked(createPollPdf)).toBeCalledWith({
      authorName: '@user-id',
      getUserDisplayName: expect.any(Function),
      pollResults: [
        {
          poll: {
            content: {
              answers: [
                { id: '1', label: 'Yes' },
                { id: '2', label: 'No' },
              ],
              description: 'My Description',
              duration: 1,
              endTime: '2020-01-01T00:01:00Z',
              pollType: 'open',
              question: 'My Question',
              resultType: 'visible',
              startTime: '2020-01-01T00:00:00Z',
              title: 'First Poll',
            },
            event_id: '$event-id-0',
            origin_server_ts: 0,
            room_id: '!room-id',
            sender: '@user-id',
            state_key: 'poll-1',
            type: 'net.nordeck.poll',
          },
          results: {
            votes: {
              '@user-alice': PollInvalidAnswer,
              '@user-id': PollInvalidAnswer,
            },
          },
          votingRights: ['@user-alice', '@user-id'],
        },
        {
          poll: {
            content: {
              answers: [
                { id: '1', label: 'Yes' },
                { id: '2', label: 'No' },
              ],
              description: 'My Description',
              duration: 1,
              endTime: '2020-01-02T00:01:00Z',
              pollType: 'byName',
              question: 'My Question',
              resultType: 'visible',
              startTime: '2020-01-02T00:00:00Z',
              title: 'Second Poll',
            },
            event_id: '$event-id-0',
            origin_server_ts: 0,
            room_id: '!room-id',
            sender: '@user-id',
            state_key: 'poll-0',
            type: 'net.nordeck.poll',
          },
          results: {
            votes: {
              '@user-alice': '1',
              '@user-id': PollInvalidAnswer,
            },
          },
          votingRights: ['@user-alice', '@user-id'],
        },
      ],
      roomMemberEvents: [
        {
          content: {
            avatar_url: 'mxc://alice.png',
            displayname: 'Alice',
            membership: 'join',
          },
          event_id: '$event-id-0',
          origin_server_ts: 0,
          room_id: '!room-id',
          sender: '@user-id',
          state_key: '@user-alice',
          type: 'm.room.member',
        },
        {
          content: {
            avatar_url: 'mxc://alice.png',
            displayname: 'My User',
            membership: 'join',
          },
          event_id: '$event-id-0',
          origin_server_ts: 0,
          room_id: '!room-id',
          sender: '@user-id',
          state_key: '@user-id',
          type: 'm.room.member',
        },
      ],
      roomName: 'My Room',
    });
  });

  it('should revoke URL on unload', async () => {
    vi.mocked(createPollPdf).mockResolvedValue(new Blob(['value']));

    const { unmount } = render(<PollsPdfDialogWrapper onClose={onClose} />, {
      wrapper: Wrapper,
    });

    const link = await screen.findByRole('link', { name: 'Download' });
    expect(link).toHaveAttribute('href', 'blob:url');

    unmount();

    expect(vi.mocked(URL.revokeObjectURL)).toBeCalledWith('blob:url');
  });

  it('should handle error while generating PDF', async () => {
    vi.mocked(createPollPdf).mockRejectedValue(new Error('Failed'));

    render(<PollsPdfDialogWrapper onClose={onClose} />, { wrapper: Wrapper });

    await expect(screen.findByRole('status')).resolves.toHaveTextContent(
      'Something went wrong while generating the PDF documentation.',
    );
  });

  it('should show loading state', () => {
    vi.mocked(createPollPdf).mockImplementation(
      () =>
        new Promise(() => {
          /* Never resolves */
        }),
    );

    render(<PollsPdfDialogWrapper onClose={onClose} />, { wrapper: Wrapper });

    expect(
      screen.getByRole('progressbar', { name: 'Download' }),
    ).toBeInTheDocument();
  });
});
