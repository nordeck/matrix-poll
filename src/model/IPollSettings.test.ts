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

import { isValidPollSettingsEvent } from './IPollSettings';

describe('isValidPollSettingsEvent', () => {
  it('should accept empty event', () => {
    expect(
      isValidPollSettingsEvent({
        content: {},
        state_key: '',
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'net.nordeck.poll.settings',
      })
    ).toBe(true);
  });

  it('should accept event', () => {
    expect(
      isValidPollSettingsEvent({
        content: {
          pdfButtonDisabledAfter: '2022-05-02T15:19:35.792Z',
          pollsOrder: ['poll-id-0', 'poll-id-1'],
        },
        state_key: '',
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'net.nordeck.poll.settings',
      })
    ).toBe(true);
  });

  it('should accept additional properties', () => {
    expect(
      isValidPollSettingsEvent({
        content: {
          pdfButtonDisabledAfter: '2022-05-02T15:19:35.792Z',
          pollsOrder: ['poll-id-0', 'poll-id-1'],
          additional: 'test',
        },
        state_key: '',
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'net.nordeck.poll.settings',
      })
    ).toBe(true);
  });

  it.each<Object>([
    { pdfButtonDisabledAfter: null },
    { pdfButtonDisabledAfter: 111 },
    { pdfButtonDisabledAfter: '' },
    { pdfButtonDisabledAfter: 'my date' },
    { pollsOrder: null },
    { pollsOrder: 111 },
    { pollsOrder: [undefined] },
    { pollsOrder: [null] },
    { pollsOrder: [111] },
  ])('should reject event with patch %j', (patch: Object) => {
    expect(
      isValidPollSettingsEvent({
        content: {
          pdfButtonDisabledAfter: '2022-05-02T15:19:35.792Z',
          pollsOrder: ['poll-id-0', 'poll-id-1'],
          ...patch,
        },
        state_key: '',
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'net.nordeck.poll.settings',
      })
    ).toBe(false);
  });
});
