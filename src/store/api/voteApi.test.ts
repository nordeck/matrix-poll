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
import { range } from 'lodash';
import { mockPollStart, mockVote } from '../../lib/testUtils';
import { IVote } from '../../model';
import { createStore } from '../store';
import { voteApi } from './voteApi';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('getVotes', () => {
  it('should return votes for a poll', async () => {
    const vote0 = widgetApi.mockSendRoomEvent(
      mockVote({ origin_server_ts: 900 }),
    );
    const vote1 = widgetApi.mockSendRoomEvent(
      mockVote({ sender: '@user-alice', origin_server_ts: 500 }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-charlie',
        content: {
          pollId: 'poll-1',
        },
      }),
    );
    const vote3 = widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-dave',
        origin_server_ts: 1000,
        content: {
          'm.relates_to': undefined,
        },
      }),
    );
    const vote4 = widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-eve',
        origin_server_ts: 1500,
        content: {
          'm.relates_to': {
            rel_type: 'm.reference',
            event_id: '$another-start-event',
          },
        },
      }),
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          voteApi.endpoints.getVotes.initiate({
            pollId: 'poll-0',
            pollStartEventId: undefined,
          }),
        )
        .unwrap(),
    ).resolves.toEqual([vote1, vote0, vote3, vote4]);
  });

  it('should only return votes for a poll if they relate to the poll event', async () => {
    widgetApi.mockSendRoomEvent(mockPollStart());
    const vote0 = widgetApi.mockSendRoomEvent(
      mockVote({ origin_server_ts: 900 }),
    );
    const vote1 = widgetApi.mockSendRoomEvent(
      mockVote({ sender: '@user-alice', origin_server_ts: 500 }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-charlie',
        content: {
          pollId: 'poll-1',
        },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-dave',
        origin_server_ts: 1000,
        content: {
          'm.relates_to': undefined,
        },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-eve',
        origin_server_ts: 1500,
        content: {
          'm.relates_to': {
            rel_type: 'm.reference',
            event_id: '$another-start-event',
          },
        },
      }),
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          voteApi.endpoints.getVotes.initiate({
            pollId: 'poll-0',
            pollStartEventId: '$start-event-id',
          }),
        )
        .unwrap(),
    ).resolves.toEqual([vote1, vote0]);
  });

  it('should read all votes for a poll when it exceeds the page size', async () => {
    widgetApi.mockSendRoomEvent(
      mockPollStart({ event_id: '$another-start-event' }),
    );

    const votes = range(0, 51).map((idx) =>
      widgetApi.mockSendRoomEvent(
        mockVote({
          sender: `@user-${idx}`,
          content: {
            'm.relates_to': {
              rel_type: 'm.reference',
              event_id: '$another-start-event',
            },
          },
        }),
      ),
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          voteApi.endpoints.getVotes.initiate({
            pollId: 'poll-0',
            pollStartEventId: '$another-start-event',
          }),
        )
        .unwrap(),
    ).resolves.toEqual(votes);
  });

  it('should handle missing votes', async () => {
    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          voteApi.endpoints.getVotes.initiate({
            pollId: 'poll-0',
            pollStartEventId: undefined,
          }),
        )
        .unwrap(),
    ).resolves.toEqual([]);
  });

  it('should handle load errors', async () => {
    widgetApi.receiveRoomEvents.mockRejectedValue(new Error('Some Error'));

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          voteApi.endpoints.getVotes.initiate({
            pollId: 'poll-0',
            pollStartEventId: undefined,
          }),
        )
        .unwrap(),
    ).rejects.toEqual({
      message: 'Could not load votes: Some Error',
      name: 'LoadFailed',
    });
  });

  it('should observe votes', async () => {
    const store = createStore({ widgetApi });

    store.dispatch(
      voteApi.endpoints.getVotes.initiate({
        pollId: 'poll-0',
        pollStartEventId: undefined,
      }),
    );

    await waitFor(() =>
      expect(
        voteApi.endpoints.getVotes.select({
          pollId: 'poll-0',
          pollStartEventId: undefined,
        })(store.getState()).data,
      ).toEqual([]),
    );

    const vote = widgetApi.mockSendRoomEvent(mockVote());
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-charlie',
        content: {
          pollId: 'poll-1',
        },
      }),
    );
    const vote2 = widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-dave',
        origin_server_ts: 1500,
        content: {
          'm.relates_to': undefined,
        },
      }),
    );
    const vote3 = widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-eve',
        origin_server_ts: 1000,
        content: {
          'm.relates_to': {
            rel_type: 'm.reference',
            event_id: '$another-start-event',
          },
        },
      }),
    );

    await waitFor(() =>
      expect(
        voteApi.endpoints.getVotes.select({
          pollId: 'poll-0',
          pollStartEventId: undefined,
        })(store.getState()).data,
      ).toEqual([vote, vote3, vote2]),
    );
  });

  it('should observe votes if they relate to the poll event', async () => {
    widgetApi.mockSendRoomEvent(mockPollStart());

    const store = createStore({ widgetApi });

    store.dispatch(
      voteApi.endpoints.getVotes.initiate({
        pollId: 'poll-0',
        pollStartEventId: '$start-event-id',
      }),
    );

    await waitFor(() =>
      expect(
        voteApi.endpoints.getVotes.select({
          pollId: 'poll-0',
          pollStartEventId: '$start-event-id',
        })(store.getState()).data,
      ).toEqual([]),
    );

    const vote = widgetApi.mockSendRoomEvent(mockVote());
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-charlie',
        content: {
          pollId: 'poll-1',
        },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-dave',
        content: {
          'm.relates_to': undefined,
        },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-eve',
        content: {
          'm.relates_to': {
            rel_type: 'm.reference',
            event_id: '$another-start-event',
          },
        },
      }),
    );

    await waitFor(() =>
      expect(
        voteApi.endpoints.getVotes.select({
          pollId: 'poll-0',
          pollStartEventId: '$start-event-id',
        })(store.getState()).data,
      ).toEqual([vote]),
    );
  });
});

describe('vote', () => {
  it('should vote for a poll without start event', async () => {
    const store = createStore({ widgetApi });
    const expectedVoteContent: IVote = {
      pollId: 'poll-0',
      answerId: '1',
    };

    await expect(
      store
        .dispatch(
          voteApi.endpoints.vote.initiate({
            pollId: 'poll-0',
            answerId: '1',
            pollStartEventId: undefined,
          }),
        )
        .unwrap(),
    ).resolves.toEqual({
      event: expect.objectContaining({
        content: expectedVoteContent,
      }),
    });

    expect(widgetApi.sendRoomEvent).toBeCalledWith(
      'net.nordeck.poll.vote',
      expectedVoteContent,
    );
  });

  it('should vote for a poll with a start event', async () => {
    const store = createStore({ widgetApi });
    const expectedVoteContent: IVote = {
      pollId: 'poll-0',
      answerId: '1',
      'm.relates_to': {
        rel_type: 'm.reference',
        event_id: '$start-event-id',
      },
    };

    await expect(
      store
        .dispatch(
          voteApi.endpoints.vote.initiate({
            pollId: 'poll-0',
            answerId: '1',
            pollStartEventId: '$start-event-id',
          }),
        )
        .unwrap(),
    ).resolves.toEqual({
      event: expect.objectContaining({
        content: expectedVoteContent,
      }),
    });

    expect(widgetApi.sendRoomEvent).toBeCalledWith(
      'net.nordeck.poll.vote',
      expectedVoteContent,
    );
  });

  it('should reject on error', async () => {
    const store = createStore({ widgetApi });

    widgetApi.sendRoomEvent.mockRejectedValue(new Error('Some Error'));

    await expect(
      store
        .dispatch(
          voteApi.endpoints.vote.initiate({
            pollId: 'poll-0',
            answerId: '1',
            pollStartEventId: undefined,
          }),
        )
        .unwrap(),
    ).rejects.toEqual({
      name: 'UpdateFailed',
      message: 'Could not vote: Some Error',
    });
  });
});
