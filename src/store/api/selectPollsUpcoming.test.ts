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
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mockPoll } from '../../lib/testUtils';
import { createStore } from '../store';
import { pollApi } from './pollApi';
import { selectPollsUpcoming } from './selectPollsUpcoming';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('selectPollsUpcoming', () => {
  it('should only show upcoming polls', async () => {
    const poll0 = widgetApi.mockSendStateEvent(mockPoll());
    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-1',
        content: { startTime: '2022-08-11T17:33:00Z' },
      }),
    );

    const store = createStore({ widgetApi });

    const state = await store
      .dispatch(pollApi.endpoints.getPolls.initiate())
      .unwrap();

    expect(selectPollsUpcoming(state)).toEqual([poll0]);
  });

  it('should sort upcoming polls', async () => {
    const poll0 = widgetApi.mockSendStateEvent(mockPoll());
    const poll1 = widgetApi.mockSendStateEvent(
      mockPoll({ state_key: 'poll-1' }),
    );
    const poll2 = widgetApi.mockSendStateEvent(
      mockPoll({ state_key: 'poll-2', origin_server_ts: 1000 }),
    );
    const poll3 = widgetApi.mockSendStateEvent(
      mockPoll({ state_key: 'poll-3', origin_server_ts: 400 }),
    );

    const store = createStore({ widgetApi });

    const state = await store
      .dispatch(pollApi.endpoints.getPolls.initiate())
      .unwrap();

    expect(selectPollsUpcoming(state, ['poll-1', 'poll-0'])).toEqual([
      poll1,
      poll0,
      poll3,
      poll2,
    ]);
  });
});
