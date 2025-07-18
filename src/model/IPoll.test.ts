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
import { mockPoll } from '../lib/testUtils';
import { isValidPollEvent, migratePollSchema } from './IPoll';

describe('isValidPollEvent', () => {
  it('should accept event', () => {
    expect(
      isValidPollEvent({
        content: {
          title: 'My title',
          description: 'My Description',
          question: 'My Question?',
          pollType: 'open',
          answers: [
            {
              id: 'answer-0',
              label: 'Hell No!',
            },
          ],
          duration: 60,
          resultType: 'visible',
          startTime: '2022-05-02T15:19:35.792Z',
          endTime: '2022-05-02T15:19:36.792Z',
          startEventId: '$start-event-id',
        },
        state_key: 'poll-id',
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'net.nordeck.poll',
      }),
    ).toBe(true);
  });

  it('should accept event without optional values', () => {
    expect(
      isValidPollEvent({
        content: {
          title: 'My title',
          description: '',
          question: 'My Question?',
          pollType: 'open',
          answers: [
            {
              id: 'answer-0',
              label: 'Hell No!',
            },
          ],
          duration: 60,
          resultType: 'visible',
        },
        state_key: 'poll-id',
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'net.nordeck.poll',
      }),
    ).toBe(true);
  });

  it('should accept event with groups', () => {
    expect(
      isValidPollEvent({
        content: {
          title: 'My title',
          description: 'My Description',
          question: 'My Question?',
          pollType: 'open',
          answers: [
            {
              id: 'answer-0',
              label: 'Hell No!',
            },
          ],
          duration: 60,
          resultType: 'visible',
          startTime: '2022-05-02T15:19:35.792Z',
          groups: [
            {
              id: 'group-id',
              eventId: 'group-event-id',
              abbreviation: 'CDU',
              color: 'black',
              votingRights: {
                '@adenauer': { state: 'active' },
                '@erhard': { state: 'invalid' },
                '@kiesinger': { state: 'represented', representedBy: '@kohl' },
              },
            },
          ],
        },
        state_key: 'poll-id',
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'net.nordeck.poll',
      }),
    ).toBe(true);
  });

  it('should accept additional properties', () => {
    expect(
      isValidPollEvent({
        content: {
          title: 'My title',
          description: 'My Description',
          question: 'My Question?',
          pollType: 'open',
          answers: [
            {
              id: 'answer-0',
              label: 'Hell No!',
              additional: 'data',
            },
          ],
          duration: 60,
          resultType: 'visible',
          startTime: '2022-05-02T15:19:35.792Z',
          groups: [
            {
              id: 'group-id',
              eventId: 'group-event-id',
              abbreviation: 'CDU',
              color: 'black',
              votingRights: {
                '@adenauer': { state: 'active', additional: 'data' },
                '@erhard': { state: 'invalid', additional: 'data' },
                '@kiesinger': {
                  state: 'represented',
                  representedBy: '@kohl',
                  additional: 'data',
                },
              },
              additional: 'data',
            },
          ],
          additional: 'data',
        },
        state_key: 'poll-id',
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'net.nordeck.poll',
      }),
    ).toBe(true);
  });

  it.each<object>([
    { title: undefined },
    { title: null },
    { title: 111 },
    { title: '' },
    { description: undefined },
    { description: null },
    { description: 111 },
    { question: undefined },
    { question: null },
    { question: 111 },
    { question: '' },
    { pollType: undefined },
    { pollType: null },
    { pollType: 111 },
    { pollType: '' },
    { pollType: 'unknown' },
    { answers: undefined },
    { answers: null },
    { answers: 111 },
    { answers: [] },
    { answers: [{ id: undefined, label: 'Hell No!' }] },
    { answers: [{ id: null, label: 'Hell No!' }] },
    { answers: [{ id: 111, label: 'Hell No!' }] },
    { answers: [{ id: 'answer-0', label: undefined }] },
    { answers: [{ id: 'answer-0', label: null }] },
    { answers: [{ id: 'answer-0', label: 111 }] },
    { duration: undefined },
    { duration: null },
    { duration: '111' },
    { resultType: undefined },
    { resultType: null },
    { resultType: 111 },
    { resultType: '' },
    { resultType: 'unknown' },
    { startTime: null },
    { startTime: 111 },
    { startTime: '' },
    { startTime: 'my-date' },
    { startEventId: null },
    { startEventId: 111 },
    { startEventId: '' },
    { endTime: null },
    { endTime: 111 },
    { endTime: '' },
    { endTime: 'my-date' },
    { groups: null },
    { groups: 111 },
  ])('should reject event with patch %j', (patch: object) => {
    expect(
      isValidPollEvent({
        content: {
          title: 'My title',
          description: 'My Description',
          question: 'My Question?',
          pollType: 'open',
          answers: [
            {
              id: 'answer-0',
              label: 'Hell No!',
            },
          ],
          duration: 60,
          resultType: 'visible',
          startTime: '2022-05-02T15:19:35.792Z',
          endTime: '2022-05-02T15:19:36.792Z',
          groups: [
            {
              id: 'group-id',
              eventId: 'group-event-id',
              abbreviation: 'CDU',
              color: 'black',
              votingRights: {
                '@adenauer': { state: 'active' },
                '@erhard': { state: 'invalid' },
                '@kiesinger': {
                  state: 'represented',
                  representedBy: '@kohl',
                },
              },
            },
          ],
          ...patch,
        },
        state_key: 'poll-id',
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'net.nordeck.poll',
      }),
    ).toBe(false);
  });

  it.each<object>([
    { id: undefined },
    { id: null },
    { id: 111 },
    { eventId: undefined },
    { eventId: null },
    { eventId: 111 },
    { abbreviation: undefined },
    { abbreviation: null },
    { abbreviation: 111 },
    { abbreviation: '' },
    { color: undefined },
    { color: null },
    { color: 111 },
    { color: '' },
    { votingRights: undefined },
    { votingRights: null },
    { votingRights: 111 },
    { votingRights: { '@adenauer': {} } },
    { votingRights: { '@adenauer': { state: null } } },
    { votingRights: { '@adenauer': { state: 111 } } },
    { votingRights: { '@adenauer': { state: '' } } },
    { votingRights: { '@adenauer': { state: 'unknown' } } },
    {
      votingRights: {
        '@adenauer': { state: 'represented', representedBy: undefined },
      },
    },
    {
      votingRights: {
        '@adenauer': { state: 'represented', representedBy: null },
      },
    },
    {
      votingRights: {
        '@adenauer': { state: 'represented', representedBy: 111 },
      },
    },
    {
      votingRights: {
        '@adenauer': { state: 'represented', representedBy: '' },
      },
    },
  ])('should reject event with group patch %j', (patch: object) => {
    expect(
      isValidPollEvent({
        content: {
          title: 'My title',
          description: 'My Description',
          question: 'My Question?',
          pollType: 'open',
          answers: [
            {
              id: 'answer-0',
              label: 'Hell No!',
            },
          ],
          duration: 60,
          resultType: 'visible',
          startTime: '2022-05-02T15:19:35.792Z',
          groups: [
            {
              id: 'group-id',
              eventId: 'group-event-id',
              abbreviation: 'CDU',
              color: 'black',
              votingRights: {
                '@adenauer': { state: 'active' },
                '@erhard': { state: 'invalid' },
                '@kiesinger': {
                  state: 'represented',
                  representedBy: '@kohl',
                },
              },
              ...patch,
            },
          ],
        },
        state_key: 'poll-id',
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'net.nordeck.poll',
      }),
    ).toBe(false);
  });
});

describe('migratePollSchema', () => {
  it('should add the endTime for started and finished polls', () => {
    const poll = mockPoll({
      content: {
        startTime: '2020-01-01T10:00:00Z',
        duration: 6,
      },
    });

    expect(migratePollSchema(poll)).toEqual(
      mockPoll({
        content: {
          startTime: '2020-01-01T10:00:00Z',
          endTime: '2020-01-01T10:06:00.000Z',
          duration: 6,
        },
      }),
    );
  });

  it('should skip events that already fulfil the newest schema', () => {
    const poll = mockPoll({
      content: {
        startTime: '2020-01-01T10:00:00Z',
        duration: 6,
        endTime: '2020-01-01T10:08:00Z',
      },
    });

    expect(migratePollSchema(poll)).toEqual(
      mockPoll({
        content: {
          startTime: '2020-01-01T10:00:00Z',
          endTime: '2020-01-01T10:08:00Z',
          duration: 6,
        },
      }),
    );
  });
});
