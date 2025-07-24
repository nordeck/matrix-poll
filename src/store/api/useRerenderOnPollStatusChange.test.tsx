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
import { act, renderHook, waitFor } from '@testing-library/react';
import { ComponentType, PropsWithChildren } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockPoll } from '../../lib/testUtils';
import { StoreProvider } from '../StoreProvider';
import { useRerenderOnPollStatusChange } from './useRerenderOnPollStatusChange';

let widgetApi: MockedWidgetApi;
let wrapper: ComponentType<PropsWithChildren<{}>>;

afterEach(() => widgetApi.stop());

afterEach(() => vi.useRealTimers());

beforeEach(() => {
  widgetApi = mockWidgetApi();

  wrapper = ({ children }: PropsWithChildren<{ userId?: string }>) => (
    <WidgetApiMockProvider value={widgetApi}>
      <StoreProvider>{children}</StoreProvider>
    </WidgetApiMockProvider>
  );
});

describe('useRerenderOnPollStatusChange', () => {
  it('should trigger the update when a running poll ends', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2020-01-01T09:59:59Z'));

    widgetApi.mockSendStateEvent(
      mockPoll({
        content: {
          startTime: '2020-01-01T09:59:00Z',
          endTime: '2020-01-01T10:00:00Z',
        },
      }),
    );

    const { result } = renderHook(() => useRerenderOnPollStatusChange(), {
      wrapper,
    });

    await waitFor(() =>
      expect(result.current).toEqual({ pollCount: 1, renderTimer: 0 }),
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current).toEqual(
      expect.objectContaining({
        pollCount: 1,
        renderTimer: expect.any(Number),
      }),
    );
    expect(result.current.renderTimer).toBeGreaterThan(0);
  });
});
