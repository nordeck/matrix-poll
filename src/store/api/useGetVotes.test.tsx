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
import { renderHook } from '@testing-library/react-hooks';
import { ComponentType, PropsWithChildren } from 'react';
import { mockPoll, mockPollStart, mockVote } from '../../lib/testUtils';
import { StoreProvider } from '../StoreProvider';
import { useGetVotes } from './useGetVotes';

let widgetApi: MockedWidgetApi;
let wrapper: ComponentType<PropsWithChildren<{}>>;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

beforeEach(() => {
  wrapper = ({ children }: PropsWithChildren<{ userId?: string }>) => (
    <WidgetApiMockProvider value={widgetApi}>
      <StoreProvider>{children}</StoreProvider>
    </WidgetApiMockProvider>
  );
});

describe('useGetVotes', () => {
  it('should handle missing poll', async () => {
    const { result, waitForValueToChange } = renderHook(
      () => useGetVotes('another-poll-id'),
      { wrapper }
    );

    await waitForValueToChange(() => result.current.isLoading);

    expect(result.current).toEqual({ isLoading: false, data: [] });
  });

  it('should report error', async () => {
    widgetApi.receiveStateEvents.mockRejectedValue(new Error('some error'));

    const { result, waitForValueToChange } = renderHook(
      () => useGetVotes('another-poll-id'),
      { wrapper }
    );

    await waitForValueToChange(() => result.current.isLoading);

    expect(result.current).toEqual({ isLoading: false, isError: true });
  });

  it('should accept votes for the poll', async () => {
    widgetApi.mockSendRoomEvent(mockPollStart());
    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-0',
        content: {
          startTime: '2020-01-01T00:00:00Z',
          startEventId: '$start-event-id',
        },
      })
    );
    const votes = [
      widgetApi.mockSendRoomEvent(
        mockVote({
          sender: 'user-alice',
          content: { pollId: 'poll-0', answerId: '1' },
          origin_server_ts: new Date('2020-01-01T00:00:00Z').getTime(),
        })
      ),
      widgetApi.mockSendRoomEvent(
        mockVote({
          sender: 'user-bob',
          content: { pollId: 'poll-0', answerId: '2' },
          origin_server_ts: new Date('2020-01-01T00:00:00Z').getTime(),
        })
      ),
      widgetApi.mockSendRoomEvent(
        mockVote({
          sender: 'user-charlie',
          content: { pollId: 'poll-0', answerId: '1' },
          origin_server_ts: new Date('2020-01-01T00:00:00Z').getTime(),
        })
      ),
      widgetApi.mockSendRoomEvent(
        mockVote({
          sender: 'user-eric',
          content: { pollId: 'poll-other', answerId: '1' },
          origin_server_ts: new Date('2020-01-01T00:00:00Z').getTime(),
        })
      ),
    ];

    const { result, waitForValueToChange } = renderHook(
      () => useGetVotes('poll-0'),
      { wrapper }
    );

    await waitForValueToChange(() => result.current.isLoading);

    expect(result.current).toEqual({
      isLoading: false,
      data: votes.slice(0, 3),
    });
  });

  it('should sort the votes by voting time', async () => {
    widgetApi.mockSendRoomEvent(mockPollStart());
    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-0',
        content: {
          startTime: '2020-01-01T00:00:00Z',
          startEventId: '$start-event-id',
          duration: 1,
        },
      })
    );
    const votes = [
      widgetApi.mockSendRoomEvent(
        mockVote({
          sender: 'user-alice',
          content: { pollId: 'poll-0', answerId: '1' },
          origin_server_ts: new Date('2020-01-01T00:00:01Z').getTime(),
        })
      ),
      widgetApi.mockSendRoomEvent(
        mockVote({
          sender: 'user-bob',
          content: { pollId: 'poll-0', answerId: '1' },
          origin_server_ts: new Date('2020-01-01T00:00:30Z').getTime(),
        })
      ),
      widgetApi.mockSendRoomEvent(
        mockVote({
          sender: 'user-charlie',
          content: { pollId: 'poll-0', answerId: '1' },
          origin_server_ts: new Date('2020-01-01T00:00:00Z').getTime(),
        })
      ),
    ];

    const { result, waitForValueToChange } = renderHook(
      () => useGetVotes('poll-0'),
      { wrapper }
    );

    await waitForValueToChange(() => result.current.isLoading);

    expect(result.current).toEqual({
      isLoading: false,
      data: [votes[2], votes[0], votes[1]],
    });
  });

  it('should use the first vote of a user', async () => {
    widgetApi.mockSendRoomEvent(mockPollStart());
    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-0',
        content: {
          startTime: '2020-01-01T00:00:00Z',
          startEventId: '$start-event-id',
        },
      })
    );
    const votes = [
      widgetApi.mockSendRoomEvent(
        mockVote({
          sender: 'user-alice',
          content: { pollId: 'poll-0', answerId: '2' },
          origin_server_ts: new Date('2020-01-01T00:00:01Z').getTime(),
          event_id: '$1',
        })
      ),
      // make sure the votes are sorted by origin_server_ts
      widgetApi.mockSendRoomEvent(
        mockVote({
          sender: 'user-alice',
          content: { pollId: 'poll-0', answerId: '1' },
          origin_server_ts: new Date('2020-01-01T00:00:00Z').getTime(),
          event_id: '$0',
        })
      ),
    ];

    const { result, waitForValueToChange } = renderHook(
      () => useGetVotes('poll-0'),
      { wrapper }
    );

    await waitForValueToChange(() => result.current.isLoading);

    expect(result.current).toEqual({
      isLoading: false,
      data: votes.slice(1),
    });
  });

  it('should skip votes for an unknown answer', async () => {
    widgetApi.mockSendRoomEvent(mockPollStart());
    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-0',
        content: {
          answers: [{ id: '1', label: 'Yo!' }],
          startTime: '2020-01-01T00:00:00Z',
          startEventId: '$start-event-id',
        },
      })
    );
    const votes = [
      widgetApi.mockSendRoomEvent(
        mockVote({
          sender: 'user-alice',
          content: { pollId: 'poll-0', answerId: '1' },
          origin_server_ts: new Date('2020-01-01T00:00:00Z').getTime(),
        })
      ),
      widgetApi.mockSendRoomEvent(
        mockVote({
          sender: 'user-bob',
          content: { pollId: 'poll-0', answerId: '22' },
          origin_server_ts: new Date('2020-01-01T00:00:00Z').getTime(),
        })
      ),
    ];

    const { result, waitForValueToChange } = renderHook(
      () => useGetVotes('poll-0'),
      { wrapper }
    );

    await waitForValueToChange(() => result.current.isLoading);

    expect(result.current).toEqual({
      isLoading: false,
      data: votes.slice(0, 1),
    });
  });

  it('should skip votes outside of the poll duration', async () => {
    widgetApi.mockSendRoomEvent(mockPollStart());
    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-0',
        content: {
          answers: [{ id: '1', label: 'Yo!' }],
          startTime: '2020-01-01T01:00:00Z',
          startEventId: '$start-event-id',
          duration: 1,
        },
      })
    );
    const votes = [
      // too early
      widgetApi.mockSendRoomEvent(
        mockVote({
          sender: '@user-1',
          content: { pollId: 'poll-0', answerId: '1' },
          origin_server_ts: new Date('2020-01-01T00:59:59Z').getTime(),
        })
      ),

      // correct
      widgetApi.mockSendRoomEvent(
        mockVote({
          sender: '@user-2',
          content: { pollId: 'poll-0', answerId: '1' },
          origin_server_ts: new Date('2020-01-01T01:00:00Z').getTime(),
        })
      ),

      // too late
      widgetApi.mockSendRoomEvent(
        mockVote({
          sender: '@user-3',
          content: { pollId: 'poll-0', answerId: '1' },
          origin_server_ts: new Date('2020-01-01T01:01:00Z').getTime(),
        })
      ),
    ];

    const { result, waitForValueToChange } = renderHook(
      () => useGetVotes('poll-0'),
      { wrapper }
    );

    await waitForValueToChange(() => result.current.isLoading);

    expect(result.current).toEqual({
      isLoading: false,
      data: votes.slice(1, 2),
    });
  });
});
