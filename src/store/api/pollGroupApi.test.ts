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
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mockGroup } from '../../lib/testUtils';
import { MemberContent } from '../../model';
import { createStore } from '../store';
import { pollGroupApi } from './pollGroupApi';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('getPollGroups', () => {
  it('should return poll groups', async () => {
    const event0 = widgetApi.mockSendStateEvent(mockGroup());
    const event1 = widgetApi.mockSendStateEvent(
      mockGroup({ state_key: 'group-1', content: { abbreviation: 'Group 1' } }),
    );

    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(pollGroupApi.endpoints.getPollGroups.initiate()).unwrap(),
    ).resolves.toEqual({
      ids: [event0.state_key, event1.state_key],
      entities: {
        [event0.state_key]: event0,
        [event1.state_key]: event1,
      },
    });
  });

  it('should migrate old poll groups', async () => {
    const event0 = widgetApi.mockSendStateEvent(mockGroup());
    const event1 = widgetApi.mockSendStateEvent(
      mockGroup({
        state_key: 'group-1',
        content: {
          abbreviation: 'Group 1',
          members: {
            '@user-alice:example.com': {} as MemberContent,
          },
        },
      }),
    );

    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(pollGroupApi.endpoints.getPollGroups.initiate()).unwrap(),
    ).resolves.toEqual({
      ids: [event0.state_key, event1.state_key],
      entities: {
        [event0.state_key]: event0,
        [event1.state_key]: expect.objectContaining({
          content: {
            abbreviation: 'Group 1',
            color: '#07f556',
            members: {
              '@user-alice:example.com': { memberRole: 'delegate' },
            },
          },
        }),
      },
    });
  });

  it('should handle load errors', async () => {
    widgetApi.receiveStateEvents.mockRejectedValue(new Error('Some Error'));

    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(pollGroupApi.endpoints.getPollGroups.initiate()).unwrap(),
    ).rejects.toEqual({
      message: 'Could not load poll groups: Some Error',
      name: 'LoadFailed',
    });
  });

  it('should observe poll groups', async () => {
    const store = createStore({ widgetApi });

    store.dispatch(pollGroupApi.endpoints.getPollGroups.initiate());

    await waitFor(() =>
      expect(
        pollGroupApi.endpoints.getPollGroups.select()(store.getState()).data,
      ).toEqual({ ids: [], entities: {} }),
    );

    const event = widgetApi.mockSendStateEvent(mockGroup());

    await waitFor(() =>
      expect(
        pollGroupApi.endpoints.getPollGroups.select()(store.getState()).data,
      ).toEqual({
        ids: [event.state_key],
        entities: { [event.state_key]: event },
      }),
    );
  });

  it('should observe deletion of poll groups', async () => {
    const store = createStore({ widgetApi });
    const event = widgetApi.mockSendStateEvent(mockGroup());

    store.dispatch(pollGroupApi.endpoints.getPollGroups.initiate());

    await waitFor(() =>
      expect(
        pollGroupApi.endpoints.getPollGroups.select()(store.getState()).data,
      ).toEqual({
        ids: [event.state_key],
        entities: { [event.state_key]: event },
      }),
    );

    // Delete poll group
    widgetApi.mockSendStateEvent({
      type: 'net.nordeck.poll.group',
      sender: '@user-id:example.com',
      content: {},
      state_key: 'group-0',
      origin_server_ts: 0,
      event_id: '$event-id-0',
      room_id: '!room-id:example.com',
    });

    await waitFor(() =>
      expect(
        pollGroupApi.endpoints.getPollGroups.select()(store.getState()).data,
      ).toEqual({ ids: [], entities: {} }),
    );
  });
});

describe('updatePollGroup', () => {
  it('should create poll group', async () => {
    const store = createStore({ widgetApi });
    const group = mockGroup().content;

    await expect(
      store
        .dispatch(
          pollGroupApi.endpoints.updatePollGroup.initiate({
            groupId: 'group-0',
            content: group,
          }),
        )
        .unwrap(),
    ).resolves.toEqual({});

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.poll.group',
      group,
      { stateKey: 'group-0' },
    );
  });

  it('should update existing poll group', async () => {
    const store = createStore({ widgetApi });

    widgetApi.mockSendStateEvent(mockGroup());

    const group = mockGroup({
      content: {
        abbreviation: 'New Name',
      },
    }).content;

    await expect(
      store
        .dispatch(
          pollGroupApi.endpoints.updatePollGroup.initiate({
            groupId: 'group-0',
            content: group,
          }),
        )
        .unwrap(),
    ).resolves.toEqual({});

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.poll.group',
      group,
      { stateKey: 'group-0' },
    );
  });

  it('should reject on error', async () => {
    const store = createStore({ widgetApi });

    widgetApi.receiveStateEvents.mockRejectedValue(new Error('Some Error'));

    await expect(
      store
        .dispatch(
          pollGroupApi.endpoints.updatePollGroup.initiate({
            groupId: 'group-0',
            content: mockGroup().content,
          }),
        )
        .unwrap(),
    ).rejects.toEqual({
      name: 'UpdateFailed',
      message: 'Could not update poll group: Some Error',
    });

    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });

  it('should be idempotent', async () => {
    const store = createStore({ widgetApi });
    const group = mockGroup().content;

    await store
      .dispatch(
        pollGroupApi.endpoints.updatePollGroup.initiate({
          groupId: 'group-0',
          content: group,
        }),
      )
      .unwrap();
    await store
      .dispatch(
        pollGroupApi.endpoints.updatePollGroup.initiate({
          groupId: 'group-0',
          content: group,
        }),
      )
      .unwrap();
  });
});

describe('deletePollGroup', () => {
  it('should delete poll group', async () => {
    const store = createStore({ widgetApi });

    widgetApi.mockSendStateEvent(mockGroup());

    await expect(
      store
        .dispatch(
          pollGroupApi.endpoints.deletePollGroup.initiate({
            groupId: 'group-0',
          }),
        )
        .unwrap(),
    ).resolves.toEqual({});

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.poll.group',
      {},
      { stateKey: 'group-0' },
    );
  });

  it('should reject on error', async () => {
    const store = createStore({ widgetApi });

    widgetApi.receiveStateEvents.mockRejectedValue(new Error('Some Error'));

    await expect(
      store
        .dispatch(
          pollGroupApi.endpoints.deletePollGroup.initiate({
            groupId: 'group-0',
          }),
        )
        .unwrap(),
    ).rejects.toEqual({
      name: 'UpdateFailed',
      message: 'Could not delete poll group: Some Error',
    });

    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });

  it('should be idempotent', async () => {
    const store = createStore({ widgetApi });

    widgetApi.mockSendStateEvent(mockGroup());

    await store
      .dispatch(
        pollGroupApi.endpoints.deletePollGroup.initiate({
          groupId: 'group-0',
        }),
      )
      .unwrap();
    await store
      .dispatch(
        pollGroupApi.endpoints.deletePollGroup.initiate({
          groupId: 'group-0',
        }),
      )
      .unwrap();
  });
});
