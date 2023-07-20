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
import { mockPoll } from '../../lib/testUtils';
import { createStore } from '../store';
import { pollApi } from './pollApi';
import { selectPollsFinished } from './selectPollsFinished';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

afterEach(() => jest.useRealTimers());

describe('selectPollsFinished', () => {
  it('should only show finished polls', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2022-08-11T17:34:00Z'));

    widgetApi.mockSendStateEvent(mockPoll());
    const poll1 = widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-1',
        content: {
          startTime: '2022-08-11T17:33:00Z',
          endTime: '2022-08-11T17:34:00Z',
        },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-2',
        content: {
          startTime: '2022-08-11T17:33:00.001Z',
          endTime: '2022-08-11T17:34:00.001Z',
        },
      }),
    );

    const store = createStore({ widgetApi });

    const state = await store
      .dispatch(pollApi.endpoints.getPolls.initiate())
      .unwrap();

    expect(selectPollsFinished(state)).toEqual([poll1]);
  });
});
