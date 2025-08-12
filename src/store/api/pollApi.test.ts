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

import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockPoll } from '../../lib/testUtils';
import { createStore } from '../store';
import { pollApi } from './pollApi';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

afterEach(() => vi.useRealTimers());

describe('getPolls', () => {
  it('should return polls', async () => {
    const poll0 = widgetApi.mockSendStateEvent(
      mockPoll({
        origin_server_ts: 5,
      }),
    );
    const poll1 = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-1',
        origin_server_ts: 4,
      }),
    );
    const poll2 = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-2',
        origin_server_ts: 10,
        content: {
          startTime: '2022-09-29T14:13:23Z',
          endTime: '2022-09-29T14:14:23Z',
        },
      }),
    );
    const poll3 = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-3',
        origin_server_ts: 9,
        content: {
          startTime: '2022-09-29T14:13:23Z',
          endTime: '2022-09-29T14:14:23Z',
          startEventId: '$start-event-id',
        },
      }),
    );
    const poll4 = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-4',
        origin_server_ts: 8,
        content: {
          startTime: '2022-09-30T14:13:23Z',
          endTime: '2022-09-30T14:14:23Z',
        },
      }),
    );

    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(pollApi.endpoints.getPolls.initiate()).unwrap(),
    ).resolves.toEqual({
      entities: {
        [poll0.state_key]: poll0,
        [poll1.state_key]: poll1,
        [poll2.state_key]: poll2,
        [poll3.state_key]: poll3,
        [poll4.state_key]: poll4,
      },
      ids: [
        poll4.state_key,
        poll3.state_key,
        poll2.state_key,
        poll1.state_key,
        poll0.state_key,
      ],
    });
  });

  it('should migrate old polls', async () => {
    const eventOld = widgetApi.mockSendStateEvent(
      mockPoll({
        content: {
          startTime: '2020-01-01T10:00:00Z',
          duration: 6,
        },
      }),
    );
    const eventNew = widgetApi.mockSendStateEvent(
      mockPoll({
        content: {
          startTime: '2020-01-01T10:00:00Z',
          duration: 6,
          endTime: '2020-01-01T10:08:00Z',
        },
        state_key: 'poll-1',
      }),
    );

    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(pollApi.endpoints.getPolls.initiate()).unwrap(),
    ).resolves.toEqual({
      ids: [eventOld.state_key, eventNew.state_key],
      entities: {
        [eventNew.state_key]: eventNew,
        [eventOld.state_key]: expect.objectContaining({
          content: expect.objectContaining({
            startTime: '2020-01-01T10:00:00Z',
            duration: 6,
            endTime: '2020-01-01T10:06:00.000Z',
          }),
        }),
      },
    });
  });

  it('should migrate old polls when observing the room', async () => {
    const store = createStore({ widgetApi });

    store.dispatch(pollApi.endpoints.getPolls.initiate());

    await waitFor(() =>
      expect(
        pollApi.endpoints.getPolls.select()(store.getState()).data,
      ).toEqual({ entities: {}, ids: [] }),
    );

    const eventOld = widgetApi.mockSendStateEvent(
      mockPoll({
        content: {
          startTime: '2020-01-01T10:00:00Z',
          duration: 6,
        },
      }),
    );

    await waitFor(() =>
      expect(
        pollApi.endpoints.getPolls.select()(store.getState()).data,
      ).toEqual({
        ids: [eventOld.state_key],
        entities: {
          [eventOld.state_key]: expect.objectContaining({
            content: expect.objectContaining({
              startTime: '2020-01-01T10:00:00Z',
              duration: 6,
              endTime: '2020-01-01T10:06:00.000Z',
            }),
          }),
        },
      }),
    );
  });

  it('should handle missing polls', async () => {
    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(pollApi.endpoints.getPolls.initiate()).unwrap(),
    ).resolves.toEqual({ entities: {}, ids: [] });
  });

  it('should handle load errors', async () => {
    widgetApi.receiveStateEvents.mockRejectedValue(new Error('Some Error'));

    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(pollApi.endpoints.getPolls.initiate()).unwrap(),
    ).rejects.toEqual({
      message: 'Could not load polls: Some Error',
      name: 'LoadFailed',
    });
  });

  it('should observe polls', async () => {
    const store = createStore({ widgetApi });

    store.dispatch(pollApi.endpoints.getPolls.initiate());

    await waitFor(() =>
      expect(
        pollApi.endpoints.getPolls.select()(store.getState()).data,
      ).toEqual({ entities: {}, ids: [] }),
    );

    const poll = widgetApi.mockSendStateEvent(mockPoll());

    await waitFor(() =>
      expect(
        pollApi.endpoints.getPolls.select()(store.getState()).data,
      ).toEqual({
        entities: {
          [poll.state_key]: poll,
        },
        ids: [poll.state_key],
      }),
    );
  });

  it('should observe deletion of polls', async () => {
    const store = createStore({ widgetApi });
    const poll = widgetApi.mockSendStateEvent(mockPoll());

    store.dispatch(pollApi.endpoints.getPolls.initiate());

    await waitFor(() =>
      expect(
        pollApi.endpoints.getPolls.select()(store.getState()).data,
      ).toEqual({
        entities: {
          [poll.state_key]: poll,
        },
        ids: [poll.state_key],
      }),
    );

    // Delete poll
    widgetApi.mockSendStateEvent({
      type: 'net.nordeck.poll',
      sender: '@user-id:example.com',
      content: {},
      state_key: poll.state_key,
      origin_server_ts: 0,
      event_id: '$event-id-0',
      room_id: '!room-id:example.com',
    });

    await waitFor(() =>
      expect(
        pollApi.endpoints.getPolls.select()(store.getState()).data,
      ).toEqual({ entities: {}, ids: [] }),
    );
  });
});

describe('updatePoll', () => {
  it('should create poll', async () => {
    const store = createStore({ widgetApi });
    const poll = mockPoll().content;

    await expect(
      store
        .dispatch(
          pollApi.endpoints.updatePoll.initiate({
            pollId: 'poll-0',
            content: poll,
          }),
        )
        .unwrap(),
    ).resolves.toEqual({});

    expect(widgetApi.sendStateEvent).toBeCalledWith('net.nordeck.poll', poll, {
      stateKey: 'poll-0',
    });
  });

  it('should update existing poll', async () => {
    const store = createStore({ widgetApi });

    widgetApi.mockSendStateEvent(mockPoll());

    const poll = mockPoll({
      content: {
        title: 'New Title',
      },
    }).content;

    await expect(
      store
        .dispatch(
          pollApi.endpoints.updatePoll.initiate({
            pollId: 'poll-0',
            content: poll,
          }),
        )
        .unwrap(),
    ).resolves.toEqual({});

    expect(widgetApi.sendStateEvent).toBeCalledWith('net.nordeck.poll', poll, {
      stateKey: 'poll-0',
    });
  });

  it('should reject on error', async () => {
    const store = createStore({ widgetApi });

    widgetApi.receiveStateEvents.mockRejectedValue(new Error('Some Error'));

    await expect(
      store
        .dispatch(
          pollApi.endpoints.updatePoll.initiate({
            pollId: 'poll-0',
            content: mockPoll().content,
          }),
        )
        .unwrap(),
    ).rejects.toEqual({
      name: 'UpdateFailed',
      message: 'Could not update poll: Some Error',
    });

    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });

  it('should be idempotent', async () => {
    const store = createStore({ widgetApi });
    const poll = mockPoll().content;

    await store
      .dispatch(
        pollApi.endpoints.updatePoll.initiate({
          pollId: 'poll-0',
          content: poll,
        }),
      )
      .unwrap();
    await store
      .dispatch(
        pollApi.endpoints.updatePoll.initiate({
          pollId: 'poll-0',
          content: poll,
        }),
      )
      .unwrap();
  });
});

describe('startPoll', () => {
  it('should start poll', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2022-10-05T10:14:23Z'));

    const store = createStore({ widgetApi });

    widgetApi.mockSendStateEvent(mockPoll());

    await expect(
      store
        .dispatch(
          pollApi.endpoints.startPoll.initiate({
            pollId: 'poll-0',
          }),
        )
        .unwrap(),
    ).resolves.toEqual({});

    expect(widgetApi.sendRoomEvent).toHaveBeenNthCalledWith(
      1,
      'net.nordeck.poll.start',
      {},
    );

    const startEventId = (await widgetApi.sendRoomEvent.mock.results[0].value)
      .event_id;

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.poll',
      mockPoll({
        content: {
          startTime: '2022-10-05T10:14:23.000Z',
          endTime: '2022-10-05T10:15:23.000Z',
          startEventId,
        },
      }).content,
      { stateKey: 'poll-0' },
    );
  });

  it('should reject on error', async () => {
    const store = createStore({ widgetApi });

    widgetApi.receiveStateEvents.mockRejectedValue(new Error('Some Error'));

    await expect(
      store
        .dispatch(
          pollApi.endpoints.startPoll.initiate({
            pollId: 'poll-0',
          }),
        )
        .unwrap(),
    ).rejects.toEqual({
      name: 'UpdateFailed',
      message: 'Could not start poll: Some Error',
    });

    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });

  it('should be idempotent', async () => {
    const store = createStore({ widgetApi });

    widgetApi.mockSendStateEvent(mockPoll());

    await store
      .dispatch(
        pollApi.endpoints.startPoll.initiate({
          pollId: 'poll-0',
        }),
      )
      .unwrap();
    await store
      .dispatch(
        pollApi.endpoints.startPoll.initiate({
          pollId: 'poll-0',
        }),
      )
      .unwrap();

    expect(widgetApi.sendStateEvent).toBeCalledTimes(1);
    expect(widgetApi.sendRoomEvent).toBeCalledTimes(1);
  });
});

describe('stopPoll', () => {
  it('should stop poll', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2022-10-05T10:14:23Z'));

    const store = createStore({ widgetApi });

    widgetApi.mockSendStateEvent(
      mockPoll({
        content: {
          startTime: '2022-10-05T10:14:23.000Z',
          endTime: '2022-10-05T10:17:23.000Z',
          startEventId: '$start-event-id',
        },
      }),
    );

    await expect(
      store
        .dispatch(
          pollApi.endpoints.stopPoll.initiate({
            pollId: 'poll-0',
          }),
        )
        .unwrap(),
    ).resolves.toEqual({});

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.poll',
      mockPoll({
        content: {
          startTime: '2022-10-05T10:14:23.000Z',
          endTime: '2022-10-05T10:14:23.000Z',
          startEventId: '$start-event-id',
        },
      }).content,
      { stateKey: 'poll-0' },
    );
  });

  it('should reject on error', async () => {
    const store = createStore({ widgetApi });

    widgetApi.receiveStateEvents.mockRejectedValue(new Error('Some Error'));

    await expect(
      store
        .dispatch(
          pollApi.endpoints.stopPoll.initiate({
            pollId: 'poll-0',
          }),
        )
        .unwrap(),
    ).rejects.toEqual({
      name: 'UpdateFailed',
      message: 'Could not stop poll: Some Error',
    });

    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });
});

describe('deletePoll', () => {
  it('should delete poll', async () => {
    const store = createStore({ widgetApi });

    widgetApi.mockSendStateEvent(mockPoll());

    await expect(
      store
        .dispatch(
          pollApi.endpoints.deletePoll.initiate({
            pollId: 'poll-0',
          }),
        )
        .unwrap(),
    ).resolves.toEqual({});

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.poll',
      {},
      { stateKey: 'poll-0' },
    );
  });

  it('should reject on error', async () => {
    const store = createStore({ widgetApi });

    widgetApi.receiveStateEvents.mockRejectedValue(new Error('Some Error'));

    await expect(
      store
        .dispatch(
          pollApi.endpoints.deletePoll.initiate({
            pollId: 'poll-0',
          }),
        )
        .unwrap(),
    ).rejects.toEqual({
      name: 'UpdateFailed',
      message: 'Could not delete poll: Some Error',
    });

    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });

  it('should be idempotent', async () => {
    const store = createStore({ widgetApi });

    widgetApi.mockSendStateEvent(mockPoll());

    await store
      .dispatch(
        pollApi.endpoints.deletePoll.initiate({
          pollId: 'poll-0',
        }),
      )
      .unwrap();
    await store
      .dispatch(
        pollApi.endpoints.deletePoll.initiate({
          pollId: 'poll-0',
        }),
      )
      .unwrap();
  });
});
