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

import { StateEvent } from '@matrix-widget-toolkit/api';
import { WidgetApiMockProvider } from '@matrix-widget-toolkit/react';
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { List } from '@mui/material';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mockGroup, mockRoomMember } from '../../../lib/testUtils';
import { GroupContent } from '../../../model';
import { createStore } from '../../../store';
import { GroupCard } from './GroupCard';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<GroupCard/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;
  let group: StateEvent<GroupContent>;

  beforeEach(async () => {
    widgetApi.mockSendStateEvent(mockRoomMember());

    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-bob:example.com',
        event_id: 'id-2',
        content: {
          displayname: 'Bob',
          membership: 'join',
          avatar_url: undefined,
        },
      }),
    );

    group = widgetApi.mockSendStateEvent(
      mockGroup({
        content: {
          members: {
            '@user-alice:example.com': { memberRole: 'delegate' },
            '@user-bob:example.com': { memberRole: 'representative' },
          },
        },
      }),
    );

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const store = useMemo(() => createStore({ widgetApi }), []);
      return (
        <WidgetApiMockProvider value={widgetApi}>
          <Provider store={store}>
            <List>{children}</List>
          </Provider>
        </WidgetApiMockProvider>
      );
    };
  });

  it('should render without exploding', async () => {
    render(<GroupCard group={group.content} groupId={group.state_key} />, {
      wrapper: Wrapper,
    });

    const item = screen.getByRole('listitem', { name: /group 0/i });

    expect(
      within(item).getByRole('heading', { name: /group 0/i, level: 4 }),
    ).toBeInTheDocument();

    expect(
      await within(item).findByRole('button', { name: /more settings/i }),
    ).toBeInTheDocument();
    expect(
      within(item).getByRole('heading', { name: /Participants/i, level: 5 }),
    ).toBeInTheDocument();
    const showParticipantsButton = within(item).getByRole('button', {
      name: /Show Participants list/i,
    });
    await userEvent.click(showParticipantsButton);
    const hideParticipantsButton = within(item).getByRole('button', {
      name: /Hide Participants list/i,
    });
    await userEvent.click(hideParticipantsButton);
  });

  it('should display the list of participants', async () => {
    render(<GroupCard group={group.content} groupId={group.state_key} />, {
      wrapper: Wrapper,
    });

    const item = screen.getByRole('listitem', { name: /group 0/i });

    await userEvent.click(
      within(item).getByRole('button', { name: /Show participants/i }),
    );

    const section = within(item).getByRole('region', {
      name: /participants/i,
    });

    const delegatesList = within(section).getByRole('list', {
      name: /Delegates/i,
    });

    expect(
      within(delegatesList).getByRole('listitem', { name: /Alice/i }),
    ).toBeInTheDocument();

    const representativesList = within(section).getByRole('list', {
      name: /Representatives/i,
    });

    expect(
      within(representativesList).getByRole('listitem', { name: /Bob/i }),
    ).toBeInTheDocument();
  });

  it('should delete the group', async () => {
    render(<GroupCard group={group.content} groupId={group.state_key} />, {
      wrapper: Wrapper,
    });

    const item = screen.getByRole('listitem', { name: /group 0/i });

    await userEvent.click(
      await within(item).findByRole('button', {
        name: /more settings/i,
      }),
    );

    expect(
      within(item).getByRole('button', {
        name: /more settings/i,
        expanded: true,
        hidden: true,
      }),
    ).toBeInTheDocument();

    const menu = screen.getByRole('menu', { name: /more settings/i });

    await userEvent.click(
      within(menu).getByRole('menuitem', { name: /delete group/i }),
    );

    const deleteModal = screen.getByRole('dialog', {
      name: /delete group/i,
    });

    await userEvent.click(
      within(deleteModal).getByRole('button', { name: 'Delete' }),
    );

    await waitFor(() => {
      expect(deleteModal).not.toBeInTheDocument();
    });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.poll.group',
      {},
      { stateKey: 'group-0' },
    );
  });

  it('should cancel the deletion of the group', async () => {
    render(<GroupCard group={group.content} groupId={group.state_key} />, {
      wrapper: Wrapper,
    });

    const item = screen.getByRole('listitem', { name: /group 0/i });

    await userEvent.click(
      await within(item).findByRole('button', {
        name: /more settings/i,
      }),
    );

    expect(
      within(item).getByRole('button', {
        name: /more settings/i,
        expanded: true,
        hidden: true,
      }),
    ).toBeInTheDocument();

    const menu = screen.getByRole('menu', { name: /more settings/i });

    await userEvent.click(
      within(menu).getByRole('menuitem', { name: /delete group/i }),
    );

    const deleteModal = screen.getByRole('dialog', {
      name: /delete group/i,
    });

    await userEvent.click(
      within(deleteModal).getByRole('button', { name: 'Cancel' }),
    );

    await waitFor(() => {
      expect(deleteModal).not.toBeInTheDocument();
    });

    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });

  it('should not update the group if the user aborts the action', async () => {
    render(<GroupCard group={group.content} groupId={group.state_key} />, {
      wrapper: Wrapper,
    });

    const groupListItem = screen.getByRole('listitem', {
      name: 'GROUP 0',
    });

    await userEvent.click(
      await within(groupListItem).findByRole('button', {
        name: 'More settings',
      }),
    );

    const menu = screen.getByRole('menu', { name: /more settings/i });

    await userEvent.click(
      within(menu).getByRole('menuitem', { name: 'Edit group' }),
    );

    await waitFor(() => {
      expect(widgetApi.openModal).toBeCalledWith(
        '/admin/create-group',
        'Edit group',
        {
          buttons: expect.any(Array),
          data: { group: group.content, groupId: 'group-0' },
        },
      );
    });
    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });

  it('should open edit dialog for a group', async () => {
    const newGroup = mockGroup({
      content: {
        abbreviation: 'New Name',
      },
    });

    widgetApi.openModal.mockResolvedValue({
      group: newGroup.content,
    });

    render(<GroupCard group={group.content} groupId={group.state_key} />, {
      wrapper: Wrapper,
    });

    const groupListItem = screen.getByRole('listitem', {
      name: 'GROUP 0',
    });

    await userEvent.click(
      await within(groupListItem).findByRole('button', {
        name: 'More settings',
      }),
    );

    const menu = screen.getByRole('menu', { name: /more settings/i });

    await userEvent.click(
      within(menu).getByRole('menuitem', { name: 'Edit group' }),
    );

    await waitFor(() => {
      expect(widgetApi.openModal).toBeCalledWith(
        '/admin/create-group',
        'Edit group',
        {
          buttons: expect.any(Array),
          data: { group: group.content, groupId: 'group-0' },
        },
      );
    });

    await waitFor(() =>
      expect(widgetApi.sendStateEvent).toBeCalledWith(
        'net.nordeck.poll.group',
        newGroup.content,
        { stateKey: 'group-0' },
      ),
    );
  });
});
