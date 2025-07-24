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

import { getEnvironment } from '@matrix-widget-toolkit/mui';
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { renderHook, waitFor } from '@testing-library/react';
import { DateTime } from 'luxon';
import { ComponentType, PropsWithChildren, useState } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mockPoll,
  mockPowerLevelsEvent,
  mockRoomMember,
  mockVote,
} from '../../lib/testUtils';
import { createStore } from '../store';
import { PollInvalidAnswer, usePollResults } from './usePollResults';

vi.mock('@matrix-widget-toolkit/mui', async (importOriginal) => ({
  ...(await importOriginal()),
  getEnvironment: vi.fn(),
}));

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('selectPollResults', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    widgetApi.mockSendStateEvent(mockPowerLevelsEvent());

    vi.mocked(getEnvironment).mockImplementation(
      (_, defaultValue) => defaultValue,
    );

    Wrapper = ({ children }) => {
      const [store] = useState(() => createStore({ widgetApi }));
      return <Provider store={store}>{children}</Provider>;
    };
  });

  it('should return error', async () => {
    widgetApi.receiveStateEvents.mockRejectedValue(new Error('Some error'));

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({ isLoading: false, isError: true }),
    );
  });

  it('should return error, when vote loading is skipped', async () => {
    widgetApi.receiveStateEvents.mockRejectedValue(new Error('Some error'));

    const { result } = renderHook(
      () =>
        usePollResults('my-poll', {
          includeInvalidVotes: true,
          skipLoadingVotes: true,
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({ isLoading: false, isError: true }),
    );
  });

  it('should return error when vote loading fails', async () => {
    widgetApi.readEventRelations.mockRejectedValue(new Error());

    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          groups: undefined,
          startTime: '2020-01-01T00:00:00Z',
          endTime: '2020-01-01T00:01:00Z',
          startEventId: '$start-event-id',
        },
      }),
    );

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({ isLoading: false, isError: true }),
    );
  });

  it('should ignore error when vote loading fails but vote loading is skipped', async () => {
    widgetApi.readEventRelations.mockRejectedValue(new Error());

    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          groups: undefined,
          startTime: '2020-01-01T00:00:00Z',
          endTime: '2020-01-01T00:01:00Z',
          startEventId: '$start-event-id',
        },
      }),
    );
    widgetApi.mockSendStateEvent(mockRoomMember({ state_key: '@user' }));

    const { result } = renderHook(
      () =>
        usePollResults('my-poll', {
          includeInvalidVotes: true,
          skipLoadingVotes: true,
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          results: { votes: { '@user': PollInvalidAnswer } },
          votingRights: ['@user'],
        },
      }),
    );
  });

  it('should return undefined when no poll was found', async () => {
    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({ isLoading: false, value: undefined }),
    );
  });

  it('should return undefined when no poll was found, when vote loading is skipped', async () => {
    const { result } = renderHook(
      () =>
        usePollResults('my-poll', {
          includeInvalidVotes: true,
          skipLoadingVotes: true,
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({ isLoading: false, value: undefined }),
    );
  });

  it('should still return information when poll was not started', async () => {
    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          groups: undefined,
        },
      }),
    );
    widgetApi.mockSendStateEvent(mockRoomMember({ state_key: '@user' }));

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          results: { votes: { '@user': PollInvalidAnswer } },
          votingRights: ['@user'],
        },
      }),
    );
  });

  it('should return all votes without groups', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          users: {
            '@user-with-power-1': 50,
            '@user-with-power-2': 50,
            '@user-without-power': 10,
          },
          events: {
            'net.nordeck.poll.vote': 50,
          },
          events_default: 0,
          users_default: 0,
        },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({ state_key: '@user-with-power-1' }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({ state_key: '@user-with-power-2' }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({ state_key: '@user-without-power' }),
    );
    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
          answers: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
          groups: undefined,
        },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-with-power-1',
        event_id: '0',
        content: { pollId: 'my-poll', answerId: '1' },
        origin_server_ts: Date.now(),
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-with-power-2',
        event_id: '1',
        content: { pollId: 'my-poll', answerId: '1' },
        origin_server_ts: Date.now(),
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-without-power',
        event_id: '2',
        content: { pollId: 'my-poll', answerId: '2' },
        origin_server_ts: Date.now(),
      }),
    );

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          votingRights: [
            '@user-with-power-1',
            '@user-with-power-2',
            '@user-without-power',
          ],
          results: {
            votes: {
              '@user-with-power-1': '1',
              '@user-with-power-2': '1',
              '@user-without-power': '2',
            },
          },
        },
      }),
    );
  });

  it('should not return any votes, when vote loading is skipped', async () => {
    widgetApi.mockSendStateEvent(
      mockRoomMember({ state_key: '@user-with-power-1' }),
    );
    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
          answers: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
          groups: undefined,
        },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-with-power-1',
        event_id: '0',
        content: { pollId: 'my-poll', answerId: '1' },
        origin_server_ts: Date.now(),
      }),
    );

    const { result } = renderHook(
      () =>
        usePollResults('my-poll', {
          includeInvalidVotes: true,
          skipLoadingVotes: true,
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          votingRights: ['@user-with-power-1'],
          results: {
            votes: {
              '@user-with-power-1': PollInvalidAnswer,
            },
          },
        },
      }),
    );
  });

  it('should handle missing answer from users with power without groups', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          users: {
            '@user-with-power-1': 50,
            '@user-without-power': 10,
          },
          events: {
            'net.nordeck.poll.vote': 50,
          },
          events_default: 0,
          users_default: 0,
        },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({ state_key: '@user-with-power-1' }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({ state_key: '@user-without-power' }),
    );
    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
          answers: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
          groups: undefined,
        },
      }),
    );

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          votingRights: ['@user-with-power-1'],
          results: {
            votes: {
              '@user-with-power-1': PollInvalidAnswer,
            },
          },
        },
      }),
    );
  });

  it('should ignore missing users that left the room', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          users: {
            '@user-with-power-1': 50,
            '@user-with-power-2': 50,
          },
          events: {
            'net.nordeck.poll.vote': 50,
          },
          events_default: 0,
          users_default: 0,
        },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({ state_key: '@user-with-power-1' }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-with-power-2',
        content: { membership: 'leave' },
      }),
    );
    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
          answers: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
          groups: undefined,
        },
      }),
    );

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          votingRights: ['@user-with-power-1'],
          results: {
            votes: {
              '@user-with-power-1': PollInvalidAnswer,
            },
          },
        },
      }),
    );
  });

  it('should ignore missing answers if not enabled without groups', async () => {
    widgetApi.mockSendStateEvent(mockPowerLevelsEvent());
    widgetApi.mockSendStateEvent(
      mockRoomMember({ state_key: '@user-with-power-1' }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({ state_key: '@user-with-power-2' }),
    );
    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
          answers: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
          groups: undefined,
        },
      }),
    );

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: false }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          votingRights: [],
          results: {
            votes: {},
          },
        },
      }),
    );
  });

  it('should handle missing answer with groups', async () => {
    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
          answers: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
          groups: [
            {
              id: 'group-1',
              eventId: '$...',
              abbreviation: 'Group 1',
              color: '#ff0000',
              votingRights: {
                '@user-delegate-1': { state: 'active' },
              },
            },
            {
              id: 'group-2',
              eventId: '$...',
              abbreviation: 'Group 2',
              color: '#0000ff',
              votingRights: {
                '@user-delegate-2': { state: 'active' },
              },
            },
          ],
        },
      }),
    );

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          votingRights: ['@user-delegate-1', '@user-delegate-2'],
          results: {
            votes: {
              '@user-delegate-1': PollInvalidAnswer,
              '@user-delegate-2': PollInvalidAnswer,
            },
          },
          groupedResults: {
            'group-1': {
              abbreviation: 'Group 1',
              color: '#ff0000',
              votes: {
                '@user-delegate-1': PollInvalidAnswer,
              },
              invalidVoters: {},
            },
            'group-2': {
              abbreviation: 'Group 2',
              color: '#0000ff',
              votes: {
                '@user-delegate-2': PollInvalidAnswer,
              },
              invalidVoters: {},
            },
          },
        },
      }),
    );
  });

  it('should ignore missing answers if not enabled with groups', async () => {
    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
          answers: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
          groups: [
            {
              id: 'group-1',
              eventId: '$...',
              abbreviation: 'Group 1',
              color: '#ff0000',
              votingRights: {
                '@user-delegate-1': { state: 'active' },
              },
            },
            {
              id: 'group-2',
              eventId: '$...',
              abbreviation: 'Group 2',
              color: '#0000ff',
              votingRights: {
                '@user-delegate-2': { state: 'active' },
              },
            },
          ],
        },
      }),
    );

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: false }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          votingRights: [],
          results: {
            votes: {},
          },
          groupedResults: {
            'group-1': {
              abbreviation: 'Group 1',
              color: '#ff0000',
              votes: {},
              invalidVoters: {},
            },
            'group-2': {
              abbreviation: 'Group 2',
              color: '#0000ff',
              votes: {},
              invalidVoters: {},
            },
          },
        },
      }),
    );
  });

  it('should handle active delegates of a group', async () => {
    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
          answers: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
          groups: [
            {
              id: 'group-1',
              eventId: '$...',
              abbreviation: 'Group 1',
              color: '#ff0000',
              votingRights: {
                '@user-delegate-1': { state: 'active' },
              },
            },
            {
              id: 'group-2',
              eventId: '$...',
              abbreviation: 'Group 2',
              color: '#0000ff',
              votingRights: {
                '@user-delegate-2': { state: 'active' },
              },
            },
          ],
        },
      }),
    );

    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-delegate-1',
        content: { pollId: 'my-poll', answerId: '1' },
        origin_server_ts: Date.now(),
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-delegate-2',
        content: { pollId: 'my-poll', answerId: '2' },
        origin_server_ts: Date.now(),
      }),
    );

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          votingRights: ['@user-delegate-1', '@user-delegate-2'],
          results: {
            votes: {
              '@user-delegate-1': '1',
              '@user-delegate-2': '2',
            },
          },
          groupedResults: {
            'group-1': {
              abbreviation: 'Group 1',
              color: '#ff0000',
              votes: { '@user-delegate-1': '1' },
              invalidVoters: {},
            },
            'group-2': {
              abbreviation: 'Group 2',
              color: '#0000ff',
              votes: { '@user-delegate-2': '2' },
              invalidVoters: {},
            },
          },
        },
      }),
    );
  });

  it('should handle invalid delegates of a group', async () => {
    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
          answers: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
          groups: [
            {
              id: 'group-1',
              eventId: '$...',
              abbreviation: 'Group 1',
              color: '#ff0000',
              votingRights: {
                '@user-delegate-1': { state: 'active' },
                '@user-delegate-2': { state: 'invalid' },
              },
            },
            {
              id: 'group-2',
              eventId: '$...',
              abbreviation: 'Group 2',
              color: '#0000ff',
              votingRights: {
                '@user-delegate-3': { state: 'invalid' },
              },
            },
          ],
        },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-delegate-1',
        content: { pollId: 'my-poll', answerId: '1' },
        origin_server_ts: Date.now(),
      }),
    );

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          votingRights: ['@user-delegate-1'],
          results: {
            votes: { '@user-delegate-1': '1' },
          },
          groupedResults: {
            'group-1': {
              abbreviation: 'Group 1',
              color: '#ff0000',
              votes: { '@user-delegate-1': '1' },
              invalidVoters: {
                '@user-delegate-2': { state: 'invalid' },
              },
            },
            'group-2': {
              abbreviation: 'Group 2',
              color: '#0000ff',
              votes: {},
              invalidVoters: {
                '@user-delegate-3': { state: 'invalid' },
              },
            },
          },
        },
      }),
    );
  });

  it('should handle represented delegates of a group', async () => {
    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
          answers: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
          groups: [
            {
              id: 'group-1',
              eventId: '$...',
              abbreviation: 'Group 1',
              color: '#ff0000',
              votingRights: {
                '@user-delegate': {
                  state: 'represented',
                  representedBy: '@user-backup',
                },
              },
            },
          ],
        },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-backup',
        content: { pollId: 'my-poll', answerId: '1' },
        origin_server_ts: Date.now(),
      }),
    );

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          votingRights: ['@user-backup'],
          results: {
            votes: { '@user-backup': '1' },
          },
          groupedResults: {
            'group-1': {
              abbreviation: 'Group 1',
              color: '#ff0000',
              votes: { '@user-backup': '1' },
              invalidVoters: {
                '@user-delegate': {
                  state: 'represented',
                  representedBy: '@user-backup',
                },
              },
            },
          },
        },
      }),
    );
  });

  it('should handle represented delegates of a group if no vote was cast', async () => {
    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
          answers: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
          groups: [
            {
              id: 'group-1',
              eventId: '$...',
              abbreviation: 'Group 1',
              color: '#ff0000',
              votingRights: {
                '@user-delegate': {
                  state: 'represented',
                  representedBy: '@user-backup',
                },
              },
            },
          ],
        },
      }),
    );

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          votingRights: ['@user-backup'],
          results: {
            votes: { '@user-backup': PollInvalidAnswer },
          },
          groupedResults: {
            'group-1': {
              abbreviation: 'Group 1',
              color: '#ff0000',
              votes: { '@user-backup': PollInvalidAnswer },
              invalidVoters: {
                '@user-delegate': {
                  state: 'represented',
                  representedBy: '@user-backup',
                },
              },
            },
          },
        },
      }),
    );
  });

  it('should ignore a delegate that is part of two groups', async () => {
    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
          answers: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
          groups: [
            {
              id: 'group-1',
              eventId: '$...',
              abbreviation: 'Group 1',
              color: '#ff0000',
              votingRights: {
                '@user-delegate-1': { state: 'active' },
                '@user-delegate-2': { state: 'active' },
                '@user-delegate-3': { state: 'invalid' },
              },
            },
            {
              id: 'group-2',
              eventId: '$...',
              abbreviation: 'Group 2',
              color: '#0000ff',
              votingRights: {
                '@user-delegate-1': { state: 'active' },
                '@user-delegate-2': { state: 'invalid' },
                '@user-delegate-3': { state: 'active' },
              },
            },
          ],
        },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-delegate-1',
        content: { pollId: 'my-poll', answerId: '1' },
        origin_server_ts: Date.now(),
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-delegate-2',
        content: { pollId: 'my-poll', answerId: '2' },
        origin_server_ts: Date.now(),
      }),
    );

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          votingRights: ['@user-delegate-1', '@user-delegate-2'],
          results: {
            votes: {
              '@user-delegate-1': '1',
              '@user-delegate-2': '2',
            },
          },
          groupedResults: {
            'group-1': {
              abbreviation: 'Group 1',
              color: '#ff0000',
              votes: {
                '@user-delegate-1': '1',
                '@user-delegate-2': '2',
              },
              invalidVoters: {
                '@user-delegate-3': { state: 'invalid' },
              },
            },
            'group-2': {
              abbreviation: 'Group 2',
              color: '#0000ff',
              votes: {},
              invalidVoters: {},
            },
          },
        },
      }),
    );
  });

  it('should ignore a representative that is used twice in a group', async () => {
    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
          answers: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
          groups: [
            {
              id: 'group-1',
              eventId: '$...',
              abbreviation: 'Group 1',
              color: '#ff0000',
              votingRights: {
                '@user-delegate-1': {
                  state: 'represented',
                  representedBy: '@user-backup',
                },
              },
            },
            {
              id: 'group-2',
              eventId: '$...',
              abbreviation: 'Group 2',
              color: '#0000ff',
              votingRights: {
                '@user-delegate-2': {
                  state: 'represented',
                  representedBy: '@user-backup',
                },
              },
            },
          ],
        },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-backup',
        content: { pollId: 'my-poll', answerId: '1' },
        origin_server_ts: Date.now(),
      }),
    );

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          votingRights: ['@user-backup'],
          results: {
            votes: { '@user-backup': '1' },
          },
          groupedResults: {
            'group-1': {
              abbreviation: 'Group 1',
              color: '#ff0000',
              votes: { '@user-backup': '1' },
              invalidVoters: {
                '@user-delegate-1': {
                  state: 'represented',
                  representedBy: '@user-backup',
                },
              },
            },
            'group-2': {
              abbreviation: 'Group 2',
              color: '#0000ff',
              votes: {},
              invalidVoters: {
                '@user-delegate-2': { state: 'invalid' },
              },
            },
          },
        },
      }),
    );
  });

  it('should ignore a representative that is used twice in different groups', async () => {
    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
          answers: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
          groups: [
            {
              id: 'group-1',
              eventId: '$...',
              abbreviation: 'Group 1',
              color: '#ff0000',
              votingRights: {
                '@user-delegate-1': {
                  state: 'represented',
                  representedBy: '@user-backup',
                },
                '@user-delegate-2': {
                  state: 'represented',
                  representedBy: '@user-backup',
                },
              },
            },
          ],
        },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-backup',
        content: { pollId: 'my-poll', answerId: '1' },
        origin_server_ts: Date.now(),
      }),
    );

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          votingRights: ['@user-backup'],
          results: {
            votes: { '@user-backup': '1' },
          },
          groupedResults: {
            'group-1': {
              abbreviation: 'Group 1',
              color: '#ff0000',
              votes: { '@user-backup': '1' },
              invalidVoters: {
                '@user-delegate-1': {
                  state: 'represented',
                  representedBy: '@user-backup',
                },
                '@user-delegate-2': { state: 'invalid' },
              },
            },
          },
        },
      }),
    );
  });

  it('should ignore a representative that is already a delegate in a group', async () => {
    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
          answers: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
          groups: [
            {
              id: 'group-1',
              eventId: '$...',
              abbreviation: 'Group 1',
              color: '#ff0000',
              votingRights: {
                '@user-delegate-1': {
                  state: 'represented',
                  representedBy: '@user-delegate-2',
                },
                '@user-delegate-2': { state: 'active' },
              },
            },
          ],
        },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-delegate-2',
        content: { pollId: 'my-poll', answerId: '1' },
        origin_server_ts: Date.now(),
      }),
    );

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          votingRights: ['@user-delegate-2'],
          results: {
            votes: { '@user-delegate-2': '1' },
          },
          groupedResults: {
            'group-1': {
              abbreviation: 'Group 1',
              color: '#ff0000',
              votes: { '@user-delegate-2': '1' },
              invalidVoters: {
                '@user-delegate-1': { state: 'invalid' },
              },
            },
          },
        },
      }),
    );
  });

  it('should ignore ignored users', async () => {
    vi.mocked(getEnvironment).mockImplementation((name, defaultValue) =>
      name === 'REACT_APP_IGNORE_USER_IDS'
        ? '@user-with-power-2'
        : defaultValue,
    );

    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          users: {
            '@user-with-power-1': 50,
            '@user-with-power-2': 50,
          },
          events: {
            'net.nordeck.poll.vote': 50,
          },
          events_default: 0,
          users_default: 0,
        },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({ state_key: '@user-with-power-1' }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({ state_key: '@user-with-power-2' }),
    );
    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
          answers: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
          groups: undefined,
        },
      }),
    );

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          votingRights: ['@user-with-power-1'],
          results: {
            votes: {
              '@user-with-power-1': PollInvalidAnswer,
            },
          },
        },
      }),
    );
  });

  it('should ignore votes from non-group members', async () => {
    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
          answers: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
          groups: [
            {
              id: 'group-1',
              eventId: '$...',
              abbreviation: 'Group 1',
              color: '#ff0000',
              votingRights: {
                '@user-delegate': { state: 'active' },
              },
            },
          ],
        },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-delegate',
        content: { pollId: 'my-poll', answerId: '1' },
        origin_server_ts: Date.now(),
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-1',
        content: { pollId: 'my-poll', answerId: '2' },
        origin_server_ts: Date.now(),
      }),
    );

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          votingRights: ['@user-delegate'],
          results: {
            votes: { '@user-delegate': '1' },
          },
          groupedResults: {
            'group-1': {
              abbreviation: 'Group 1',
              color: '#ff0000',
              votes: { '@user-delegate': '1' },
              invalidVoters: {},
            },
          },
        },
      }),
    );
  });

  it('should ignore votes from invalid members in a group', async () => {
    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
          answers: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
          groups: [
            {
              id: 'group-1',
              eventId: '$...',
              abbreviation: 'Group 1',
              color: '#ff0000',
              votingRights: {
                '@user-delegate': { state: 'invalid' },
              },
            },
          ],
        },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-delegate',
        content: { pollId: 'my-poll', answerId: '1' },
        origin_server_ts: Date.now(),
      }),
    );

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          votingRights: [],
          results: {
            votes: {},
          },
          groupedResults: {
            'group-1': {
              abbreviation: 'Group 1',
              color: '#ff0000',
              votes: {},
              invalidVoters: {
                '@user-delegate': { state: 'invalid' },
              },
            },
          },
        },
      }),
    );
  });

  it('should ignore votes from represented members in a group', async () => {
    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
          answers: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
          groups: [
            {
              id: 'group-1',
              eventId: '$...',
              abbreviation: 'Group 1',
              color: '#ff0000',
              votingRights: {
                '@user-delegate': {
                  state: 'represented',
                  representedBy: '@user-backup',
                },
              },
            },
          ],
        },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-delegate',
        content: { pollId: 'my-poll', answerId: '1' },
        origin_server_ts: Date.now(),
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-backup',
        content: { pollId: 'my-poll', answerId: '1' },
        origin_server_ts: Date.now(),
      }),
    );

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          votingRights: ['@user-backup'],
          results: {
            votes: { '@user-backup': '1' },
          },
          groupedResults: {
            'group-1': {
              abbreviation: 'Group 1',
              color: '#ff0000',
              votes: { '@user-backup': '1' },
              invalidVoters: {
                '@user-delegate': {
                  state: 'represented',
                  representedBy: '@user-backup',
                },
              },
            },
          },
        },
      }),
    );
  });

  it('should only consider the first vote of a user without groups', async () => {
    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
          answers: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
          groups: undefined,
        },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user',
        content: { pollId: 'my-poll', answerId: '1' },
        event_id: 'event-0',
        origin_server_ts: Date.now(),
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user',
        content: { pollId: 'my-poll', answerId: '2' },
        event_id: 'event-1',
        origin_server_ts: Date.now(),
      }),
    );

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          votingRights: ['@user'],
          results: {
            votes: { '@user': '1' },
          },
        },
      }),
    );
  });

  it('should only consider the first vote of a user with groups', async () => {
    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
          answers: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
          groups: [
            {
              id: 'group-1',
              eventId: '$...',
              abbreviation: 'Group 1',
              color: '#ff0000',
              votingRights: {
                '@user': {
                  state: 'active',
                },
              },
            },
          ],
        },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user',
        content: { pollId: 'my-poll', answerId: '1' },
        event_id: 'event-1',
        origin_server_ts: Date.now(),
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user',
        content: { pollId: 'my-poll', answerId: '2' },
        event_id: 'event-2',
        origin_server_ts: Date.now(),
      }),
    );

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          votingRights: ['@user'],
          results: {
            votes: { '@user': '1' },
          },
          groupedResults: {
            'group-1': {
              abbreviation: 'Group 1',
              color: '#ff0000',
              votes: { '@user': '1' },
              invalidVoters: {},
            },
          },
        },
      }),
    );
  });

  it('should only consider votes that were sent during the poll duration without groups', async () => {
    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          answers: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
          groups: undefined,
          startTime: '2020-01-01T01:00:00Z',
          endTime: '2020-01-01T01:01:00Z',
          duration: 1,
        },
      }),
    );
    // too early
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-1',
        content: { pollId: 'my-poll', answerId: '1' },
        origin_server_ts: new Date('2020-01-01T00:59:59Z').getTime(),
      }),
    );
    // correct
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-2',
        content: { pollId: 'my-poll', answerId: '1' },
        origin_server_ts: new Date('2020-01-01T01:00:00Z').getTime(),
      }),
    );
    // too late
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-3',
        content: { pollId: 'my-poll', answerId: '1' },
        origin_server_ts: new Date('2020-01-01T01:01:00Z').getTime(),
      }),
    );

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          votingRights: ['@user-2'],
          results: {
            votes: { '@user-2': '1' },
          },
        },
      }),
    );
  });

  it('should only consider votes that were sent during the poll duration with groups', async () => {
    const poll = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'my-poll',
        content: {
          answers: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
          startTime: '2020-01-01T01:00:00Z',
          endTime: '2020-01-01T01:01:00Z',
          duration: 1,
          groups: [
            {
              id: 'group-1',
              eventId: '$...',
              abbreviation: 'Group 1',
              color: '#ff0000',
              votingRights: {
                '@user-1': {
                  state: 'active',
                },
                '@user-2': {
                  state: 'active',
                },
                '@user-3': {
                  state: 'active',
                },
              },
            },
          ],
        },
      }),
    );
    // too early
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-1',
        content: { pollId: 'my-poll', answerId: '1' },
        origin_server_ts: new Date('2020-01-01T00:59:59Z').getTime(),
      }),
    );
    // correct
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-2',
        content: { pollId: 'my-poll', answerId: '1' },
        origin_server_ts: new Date('2020-01-01T01:00:00Z').getTime(),
      }),
    );
    // too late
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-3',
        content: { pollId: 'my-poll', answerId: '1' },
        origin_server_ts: new Date('2020-01-01T01:01:00Z').getTime(),
      }),
    );

    const { result } = renderHook(
      () => usePollResults('my-poll', { includeInvalidVotes: true }),
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(result.current).toEqual({
        isLoading: false,
        data: {
          poll,
          votingRights: ['@user-1', '@user-2', '@user-3'],
          results: {
            votes: {
              '@user-1': PollInvalidAnswer,
              '@user-2': '1',
              '@user-3': PollInvalidAnswer,
            },
          },
          groupedResults: {
            'group-1': {
              abbreviation: 'Group 1',
              color: '#ff0000',
              votes: {
                '@user-1': PollInvalidAnswer,
                '@user-2': '1',
                '@user-3': PollInvalidAnswer,
              },
              invalidVoters: {},
            },
          },
        },
      }),
    );
  });
});
