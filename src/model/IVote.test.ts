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

import { describe, expect, it } from 'vitest';
import { isValidVoteEvent } from './IVote';

describe('isValidVoteEvent', () => {
  it('should accept event', () => {
    expect(
      isValidVoteEvent({
        content: {
          pollId: 'poll-id',
          answerId: 'answer-id',
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id:example.com',
        sender: '@user-id:example.com',
        type: 'net.nordeck.poll.vote',
      }),
    ).toBe(true);
  });

  it('should accept additional properties', () => {
    expect(
      isValidVoteEvent({
        content: {
          pollId: 'poll-id',
          answerId: 'answer-id',
          additional: 'data',
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id:example.com',
        sender: '@user-id:example.com',
        type: 'net.nordeck.poll.vote',
      }),
    ).toBe(true);
  });

  it('should accept event with relation', () => {
    expect(
      isValidVoteEvent({
        content: {
          pollId: 'poll-id',
          answerId: 'answer-id',
          'm.relates_to': {
            rel_type: 'm.reference',
            event_id: '$event-id',
          },
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id:example.com',
        sender: '@user-id:example.com',
        type: 'net.nordeck.poll.vote',
      }),
    ).toBe(true);
  });

  it.each<object>([
    { pollId: undefined },
    { pollId: null },
    { pollId: 111 },
    { pollId: '' },
    { answerId: undefined },
    { answerId: null },
    { answerId: 111 },
    { answerId: '' },
    { 'm.relates_to': { rel_type: undefined, event_id: '$event-id' } },
    { 'm.relates_to': { rel_type: null, event_id: '$event-id' } },
    { 'm.relates_to': { rel_type: '', event_id: '$event-id' } },
    { 'm.relates_to': { rel_type: 'm.replace', event_id: '$event-id' } },
    { 'm.relates_to': { rel_type: 'm.reference', event_id: undefined } },
    { 'm.relates_to': { rel_type: 'm.reference', event_id: null } },
    { 'm.relates_to': { rel_type: 'm.reference', event_id: '' } },
  ])('should reject event with patch %j', (patch: object) => {
    expect(
      isValidVoteEvent({
        content: {
          pollId: 'poll-id',
          answerId: 'answer-id',
          ...patch,
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id:example.com',
        sender: '@user-id:example.com',
        type: 'net.nordeck.poll.vote',
      }),
    ).toBe(false);
  });
});
