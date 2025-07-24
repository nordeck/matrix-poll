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
import { renderHook, waitFor } from '@testing-library/react';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mockPoll, mockPollStart, mockVote } from '../../lib/testUtils';
import { createStore } from '../../store';
import { usePollStatus } from './usePollStatus';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('usePollStatus', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
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

  it('should handle poll that is not in the redux store', async () => {
    const { result } = renderHook(() => usePollStatus('unknown-poll-id'), {
      wrapper: Wrapper,
    });

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          hasVoted: false,
          canViewResults: false,
          pollHasResults: false,
          canVote: false,
        },
      }),
    );
  });

  it('should handle poll', async () => {
    widgetApi.mockSendRoomEvent(mockPollStart());
    widgetApi.mockSendStateEvent(
      mockPoll({
        content: {
          startTime: '2020-01-01T00:00:00Z',
          startEventId: '$start-event-id',
        },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        origin_server_ts: new Date('2020-01-01T00:00:01Z').getTime(),
      }),
    );

    const { result } = renderHook(() => usePollStatus('poll-0'), {
      wrapper: Wrapper,
    });

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          hasVoted: false,
          canViewResults: true,
          pollHasResults: true,
          canVote: false,
        },
      }),
    );
  });
});
