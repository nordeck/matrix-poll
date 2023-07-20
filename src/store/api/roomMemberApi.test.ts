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
import { waitFor } from '@testing-library/react';
import { mockRoomMember } from '../../lib/testUtils';
import { createStore } from '../store';
import { roomMemberApi, selectActiveRoomMembers } from './roomMemberApi';

jest.mock('@matrix-widget-toolkit/mui', () => ({
  ...jest.requireActual('@matrix-widget-toolkit/mui'),
  getEnvironment: jest.fn(),
}));

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => {
  widgetApi = mockWidgetApi();

  jest.mocked(getEnvironment).mockReturnValue('');
});

describe('getRoomMembers', () => {
  it('should return room members', async () => {
    widgetApi.mockSendStateEvent(mockRoomMember());
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-bob',
        content: {
          displayname: 'Bob',
          avatar_url: undefined,
        },
      }),
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(roomMemberApi.endpoints.getRoomMembers.initiate())
        .unwrap(),
    ).resolves.toEqual({
      ids: ['@user-alice', '@user-bob'],
      entities: {
        '@user-alice': expect.objectContaining({
          state_key: '@user-alice',
          content: {
            avatar_url: 'mxc://alice.png',
            membership: 'join',
            displayname: 'Alice',
          },
        }),
        '@user-bob': expect.objectContaining({
          state_key: '@user-bob',
          content: {
            membership: 'join',
            displayname: 'Bob',
            avatar_url: undefined,
          },
        }),
      },
    });
  });

  it('should handle load errors', async () => {
    widgetApi.receiveStateEvents.mockRejectedValue(new Error('Some Error'));

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(roomMemberApi.endpoints.getRoomMembers.initiate())
        .unwrap(),
    ).rejects.toEqual({
      message: 'Could not load room members: Some Error',
      name: 'LoadFailed',
    });
  });

  it('should observe room members', async () => {
    widgetApi.mockSendStateEvent(mockRoomMember());

    const store = createStore({ widgetApi });

    store.dispatch(roomMemberApi.endpoints.getRoomMembers.initiate());

    await waitFor(() =>
      expect(
        roomMemberApi.endpoints.getRoomMembers.select()(store.getState()).data,
      ).toEqual(expect.objectContaining({ ids: ['@user-alice'] })),
    );

    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-bob',
        content: {
          displayname: 'Bob',
        },
      }),
    );

    await waitFor(() =>
      expect(
        roomMemberApi.endpoints.getRoomMembers.select()(store.getState()).data,
      ).toEqual(expect.objectContaining({ ids: ['@user-alice', '@user-bob'] })),
    );
  });
});

describe('selectActiveRoomMembers', () => {
  it('should include users that are join and invite', () => {
    const joinUser = mockRoomMember({
      state_key: '@join-user',
      content: {
        membership: 'join',
      },
    });
    const inviteUser = mockRoomMember({
      state_key: '@invite-user',
      content: {
        membership: 'invite',
      },
    });
    const leaveUser = mockRoomMember({
      state_key: '@leave-user',
      content: {
        membership: 'leave',
      },
    });
    const knockUser = mockRoomMember({
      state_key: '@knock-user',
      content: {
        membership: 'knock',
      },
    });
    const banUser = mockRoomMember({
      state_key: '@ban-user',
      content: {
        membership: 'ban',
      },
    });

    expect(
      selectActiveRoomMembers({
        entities: {
          [joinUser.state_key]: joinUser,
          [inviteUser.state_key]: inviteUser,
          [leaveUser.state_key]: leaveUser,
          [knockUser.state_key]: knockUser,
          [banUser.state_key]: banUser,
        },
        ids: [
          joinUser.state_key,
          inviteUser.state_key,
          leaveUser.state_key,
          knockUser.state_key,
          banUser.state_key,
        ],
      }),
    ).toEqual([joinUser, inviteUser]);
  });

  it('should exclude users that are ignored', () => {
    jest.mocked(getEnvironment).mockReturnValue('@other-user,@invite-user');

    const joinUser = mockRoomMember({
      state_key: '@join-user',
      content: {
        membership: 'join',
      },
    });
    const inviteUser = mockRoomMember({
      state_key: '@invite-user',
      content: {
        membership: 'invite',
      },
    });

    expect(
      selectActiveRoomMembers({
        entities: {
          [joinUser.state_key]: joinUser,
          [inviteUser.state_key]: inviteUser,
        },
        ids: [joinUser.state_key, inviteUser.state_key],
      }),
    ).toEqual([joinUser]);

    expect(getEnvironment).toHaveBeenCalledWith(
      'REACT_APP_IGNORE_USER_IDS',
      '',
    );
  });
});
