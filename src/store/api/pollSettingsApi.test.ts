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
import { mockPollSettings } from '../../lib/testUtils';
import { createStore } from '../store';
import { pollSettingsApi } from './pollSettingsApi';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('getPollSettings', () => {
  it('should return poll settings', async () => {
    const event = widgetApi.mockSendStateEvent(mockPollSettings());

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(pollSettingsApi.endpoints.getPollSettings.initiate())
        .unwrap(),
    ).resolves.toEqual({ event });
  });

  it('should handle missing poll settings', async () => {
    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(pollSettingsApi.endpoints.getPollSettings.initiate())
        .unwrap(),
    ).resolves.toEqual({ event: undefined });
  });

  it('should handle load errors', async () => {
    widgetApi.receiveStateEvents.mockRejectedValue(new Error('Some Error'));

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(pollSettingsApi.endpoints.getPollSettings.initiate())
        .unwrap(),
    ).rejects.toEqual({
      message: 'Could not load poll settings: Some Error',
      name: 'LoadFailed',
    });
  });

  it('should observe poll settings', async () => {
    const store = createStore({ widgetApi });

    store.dispatch(pollSettingsApi.endpoints.getPollSettings.initiate());

    await waitFor(() =>
      expect(
        pollSettingsApi.endpoints.getPollSettings.select()(store.getState())
          .data,
      ).toEqual({ event: undefined }),
    );

    const event = widgetApi.mockSendStateEvent(mockPollSettings());

    await waitFor(() =>
      expect(
        pollSettingsApi.endpoints.getPollSettings.select()(store.getState())
          .data,
      ).toEqual({ event }),
    );
  });
});

describe('patchPollSettings', () => {
  it('should create poll settings', async () => {
    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          pollSettingsApi.endpoints.patchPollSettings.initiate({
            changes: { pollsOrder: ['poll-0'] },
          }),
        )
        .unwrap(),
    ).resolves.toEqual({
      event: expect.objectContaining({
        content: { pollsOrder: ['poll-0'] },
        state_key: '!room-id',
      }),
    });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.poll.settings',
      { pollsOrder: ['poll-0'] },
      { stateKey: '!room-id' },
    );
  });

  it('should update existing poll settings', async () => {
    const store = createStore({ widgetApi });

    widgetApi.mockSendStateEvent(
      mockPollSettings({
        content: {
          pdfButtonDisabledAfter: '2022-09-28T00:00:00Z',
        },
      }),
    );

    await expect(
      store
        .dispatch(
          pollSettingsApi.endpoints.patchPollSettings.initiate({
            changes: { pollsOrder: ['poll-0'] },
          }),
        )
        .unwrap(),
    ).resolves.toEqual({
      event: expect.objectContaining({
        content: {
          pollsOrder: ['poll-0'],
          pdfButtonDisabledAfter: '2022-09-28T00:00:00Z',
        },
        state_key: '!room-id',
      }),
    });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.poll.settings',
      {
        pollsOrder: ['poll-0'],
        pdfButtonDisabledAfter: '2022-09-28T00:00:00Z',
      },
      { stateKey: '!room-id' },
    );
  });

  it('should reject on error', async () => {
    const store = createStore({ widgetApi });

    widgetApi.receiveStateEvents.mockRejectedValue(new Error('Some Error'));

    await expect(
      store
        .dispatch(
          pollSettingsApi.endpoints.patchPollSettings.initiate({
            changes: { pollsOrder: ['poll-0'] },
          }),
        )
        .unwrap(),
    ).rejects.toEqual({
      name: 'UpdateFailed',
      message: 'Could not update poll settings: Some Error',
    });

    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });

  it('should be idempotent', async () => {
    const store = createStore({ widgetApi });

    await store
      .dispatch(
        pollSettingsApi.endpoints.patchPollSettings.initiate({
          changes: {
            pollsOrder: ['poll-1', 'poll-2'],
          },
        }),
      )
      .unwrap();
    await store
      .dispatch(
        pollSettingsApi.endpoints.patchPollSettings.initiate({
          changes: {
            pollsOrder: ['poll-1', 'poll-2'],
          },
        }),
      )
      .unwrap();
  });
});
