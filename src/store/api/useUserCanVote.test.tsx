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
import { mockPoll, mockPowerLevelsEvent } from '../../lib/testUtils';
import { StoreProvider } from '../StoreProvider';
import { useUserCanVote } from './useUserCanVote';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('useUserCanVote', () => {
  let wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          events: {
            'net.nordeck.poll.vote': 50,
          },
          events_default: 1000,
          users_default: 100,
        },
      }),
    );

    wrapper = ({ children }: PropsWithChildren<{}>) => (
      <WidgetApiMockProvider value={widgetApi}>
        <StoreProvider>{children}</StoreProvider>
      </WidgetApiMockProvider>
    );
  });

  it('should return false if still loading', async () => {
    const { result } = renderHook(() => useUserCanVote('poll-1', 'user-1'), {
      wrapper,
    });

    expect(result.current).toEqual({ isLoading: true });
  });

  it('should return reject if a userId is missing', async () => {
    const { result } = renderHook(() => useUserCanVote('poll-1', undefined), {
      wrapper,
    });

    expect(result.current).toEqual({ isLoading: false, data: false });
  });

  it('should return error', async () => {
    widgetApi.receiveStateEvents.mockRejectedValue(new Error('Some error'));

    const { result, waitForValueToChange } = renderHook(
      () => useUserCanVote('poll-1', 'user-1'),
      { wrapper },
    );

    await waitForValueToChange(() => result.current.isLoading);

    expect(result.current).toEqual({ isLoading: false, isError: true });
  });

  it('should return reject if a poll does not exist', async () => {
    const { result, waitForValueToChange } = renderHook(
      () => useUserCanVote('poll-1', 'user-1'),
      { wrapper },
    );

    await waitForValueToChange(() => result.current.isLoading);

    expect(result.current).toEqual({ isLoading: false, data: false });
  });

  describe('without groups', () => {
    beforeEach(() => {
      widgetApi.mockSendStateEvent(
        mockPoll({ state_key: 'poll-1', content: { groups: undefined } }),
      );
    });

    it('should accept vote of user with the correct power', async () => {
      const { result, waitForValueToChange } = renderHook(
        () => useUserCanVote('poll-1', 'user-1'),
        { wrapper },
      );

      await waitForValueToChange(() => result.current.isLoading);

      expect(result.current).toEqual({ isLoading: false, data: true });
    });

    it('should reject vote of user with missing power', async () => {
      widgetApi.mockSendStateEvent(
        mockPowerLevelsEvent({
          content: {
            events: {
              'net.nordeck.poll.vote': 100,
            },
            events_default: 0,
            users_default: 1,
          },
        }),
      );

      const { result, waitForValueToChange } = renderHook(
        () => useUserCanVote('poll-1', 'user-1'),
        { wrapper },
      );

      await waitForValueToChange(() => result.current.isLoading);

      expect(result.current).toEqual({ isLoading: false, data: false });
    });
  });

  describe('with groups', () => {
    beforeEach(() => {
      widgetApi.mockSendStateEvent(
        mockPoll({
          state_key: 'poll-1',
          content: {
            groups: [
              {
                id: 'group-id',
                eventId: 'event-id',
                abbreviation: 'CDU',
                color: 'black',
                votingRights: {
                  '@delegate': {
                    state: 'active',
                  },
                  '@delegate-absent': {
                    state: 'represented',
                    representedBy: '@representative-represents',
                  },
                },
              },
            ],
          },
        }),
      );
    });

    it('should accept vote from delegate with correct power', async () => {
      const { result, waitForValueToChange } = renderHook(
        () => useUserCanVote('poll-1', '@delegate'),
        { wrapper },
      );

      await waitForValueToChange(() => result.current.isLoading);

      expect(result.current).toEqual({ isLoading: false, data: true });
    });

    it('should reject vote from delegate with missing power', async () => {
      widgetApi.mockSendStateEvent(
        mockPowerLevelsEvent({
          content: {
            events: {
              'net.nordeck.poll.vote': 100,
            },
            events_default: 0,
            users_default: 1,
          },
        }),
      );

      const { result, waitForValueToChange } = renderHook(
        () => useUserCanVote('poll-1', '@delegate'),
        { wrapper },
      );

      await waitForValueToChange(() => result.current.isLoading);

      expect(result.current).toEqual({ isLoading: false, data: false });
    });

    it('should accept vote from representative that votes for a delegate with correct power', async () => {
      const { result, waitForValueToChange } = renderHook(
        () => useUserCanVote('poll-1', '@representative-represents'),
        { wrapper },
      );

      await waitForValueToChange(() => result.current.isLoading);

      expect(result.current).toEqual({ isLoading: false, data: true });
    });

    it('should reject vote from representative that votes for a delegate with missing power', async () => {
      widgetApi.mockSendStateEvent(
        mockPowerLevelsEvent({
          content: {
            events: {
              'net.nordeck.poll.vote': 100,
            },
            events_default: 0,
            users_default: 1,
          },
        }),
      );

      const { result, waitForValueToChange } = renderHook(
        () => useUserCanVote('poll-1', '@representative-represents'),
        { wrapper },
      );

      await waitForValueToChange(() => result.current.isLoading);

      expect(result.current).toEqual({ isLoading: false, data: false });
    });

    it('should reject vote from absent delegate with correct power', async () => {
      const { result, waitForValueToChange } = renderHook(
        () => useUserCanVote('poll-1', '@delegate-absent'),
        { wrapper },
      );

      await waitForValueToChange(() => result.current.isLoading);

      expect(result.current).toEqual({ isLoading: false, data: false });
    });

    it('should reject vote from a guest with correct power', async () => {
      const { result, waitForValueToChange } = renderHook(
        () => useUserCanVote('poll-1', '@guest'),
        { wrapper },
      );

      await waitForValueToChange(() => result.current.isLoading);

      expect(result.current).toEqual({ isLoading: false, data: false });
    });
  });
});
