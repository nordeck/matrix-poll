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
import { ComponentType, PropsWithChildren } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mockPowerLevelsEvent } from '../../lib/testUtils';
import { StoreProvider } from '../StoreProvider';
import { usePowerLevels } from './usePowerLevels';

let widgetApi: MockedWidgetApi;
let wrapper: ComponentType<PropsWithChildren<{}>>;

afterEach(() => widgetApi.stop());

beforeEach(() => {
  widgetApi = mockWidgetApi();

  wrapper = ({ children }: PropsWithChildren<{ userId?: string }>) => (
    <WidgetApiMockProvider value={widgetApi}>
      <StoreProvider>{children}</StoreProvider>
    </WidgetApiMockProvider>
  );
});

describe('usePowerLevels', () => {
  it('should have no power while loading', () => {
    const { result } = renderHook(() => usePowerLevels(), {
      wrapper,
    });

    expect(result.current).toEqual({
      canCreatePoll: undefined,
      canCreatePollSettings: undefined,
      canCreateGroups: undefined,
      canCreateVote: undefined,
    });
  });

  it('should have power to create polls', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          events: {
            'net.nordeck.poll': 0,
          },
          events_default: 100,
          state_default: 100,
          users_default: 0,
        },
      }),
    );

    const { result } = renderHook(() => usePowerLevels(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current).toEqual({
        canCreatePoll: true,
        canCreatePollSettings: false,
        canCreateGroups: false,
        canCreateVote: false,
      });
    });
  });

  it('should have power to create poll settings', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          events: {
            'net.nordeck.poll.settings': 0,
          },
          events_default: 100,
          state_default: 100,
          users_default: 0,
        },
      }),
    );

    const { result } = renderHook(() => usePowerLevels(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current).toEqual({
        canCreatePoll: false,
        canCreatePollSettings: true,
        canCreateGroups: false,
        canCreateVote: false,
      });
    });
  });

  it('should have power to create groups', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          events: {
            'net.nordeck.poll.group': 0,
          },
          events_default: 100,
          state_default: 100,
          users_default: 0,
        },
      }),
    );

    const { result } = renderHook(() => usePowerLevels(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current).toEqual({
        canCreatePoll: false,
        canCreatePollSettings: false,
        canCreateGroups: true,
        canCreateVote: false,
      });
    });
  });

  it('should have power to create votes', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          events: {
            'net.nordeck.poll.vote': 0,
          },
          events_default: 100,
          state_default: 100,
          users_default: 0,
        },
      }),
    );

    const { result } = renderHook(() => usePowerLevels(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current).toEqual({
        canCreatePoll: false,
        canCreatePollSettings: false,
        canCreateGroups: false,
        canCreateVote: true,
      });
    });
  });
});
