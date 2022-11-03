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

import { WidgetApiMockProvider } from '@matrix-widget-toolkit/react';
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import {
  mockGroup,
  mockPowerLevelsEvent,
  mockRoomMember,
} from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { GroupModalResult } from '../CreateGroupModal';
import { AdminPanel } from './AdminPanel';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<AdminPanel/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    widgetApi.mockSendStateEvent(mockRoomMember());

    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: 'user-bob',
        event_id: 'id-2',
        content: {
          displayname: 'Bob',
          membership: 'join',
          avatar_url: undefined,
        },
      })
    );

    widgetApi.mockSendStateEvent(
      mockGroup({
        content: {
          members: {
            'user-alice': { memberRole: 'delegate' },
            'user-bob': { memberRole: 'representative' },
          },
        },
      })
    );

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const store = useMemo(() => createStore({ widgetApi }), []);
      return (
        <Provider store={store}>
          <WidgetApiMockProvider value={widgetApi}>
            {children}
          </WidgetApiMockProvider>
        </Provider>
      );
    };
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<AdminPanel />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('list', { name: /groups/i })
    ).resolves.toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should render without exploding', async () => {
    render(<AdminPanel />, { wrapper: Wrapper });

    const list = await screen.findByRole('list', { name: /groups/i });
    const item = within(list).getByRole('listitem', {
      name: /group 0/i,
    });

    expect(
      within(item).getByRole('heading', { name: /group 0/i, level: 4 })
    ).toBeInTheDocument();

    await expect(
      within(item).findByRole('button', {
        name: /more settings/i,
        description: 'GROUP 0',
      })
    ).resolves.toBeInTheDocument();

    const nav = screen.getByRole('navigation');

    expect(
      within(nav).getByRole('button', { name: /create new group/i })
    ).toBeInTheDocument();
  });

  it('should render empty group notice', async () => {
    widgetApi.clearStateEvents();

    render(<AdminPanel />, { wrapper: Wrapper });

    const list = await screen.findByRole('list', { name: /groups/i });

    expect(
      within(list).getByRole('listitem', {
        name: /you have to create a group first/i,
      })
    ).toBeInTheDocument();
  });

  it('should render empty group notice for non-moderators', async () => {
    widgetApi.clearStateEvents();
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: { users_default: 0 },
      })
    );

    render(<AdminPanel />, { wrapper: Wrapper });

    const list = await screen.findByRole('list', { name: /groups/i });

    expect(
      within(list).getByRole('listitem', {
        name: /an admin has to create a group first/i,
      })
    ).toBeInTheDocument();
  });

  it('should delete the group', async () => {
    render(<AdminPanel />, { wrapper: Wrapper });

    const list = await screen.findByRole('list', { name: /groups/i });
    const item = within(list).getByRole('listitem', {
      name: /group 0/i,
    });

    await userEvent.click(
      await within(item).findByRole('button', { name: /more settings/i })
    );

    const menu = screen.getByRole('menu', { name: /more settings/i });

    await userEvent.click(
      within(menu).getByRole('menuitem', { name: /delete group/i })
    );

    const deleteModal = screen.getByRole('dialog', {
      name: /delete group/i,
    });

    await userEvent.click(
      within(deleteModal).getByRole('button', { name: 'Delete' })
    );

    await waitFor(() => {
      expect(deleteModal).not.toBeInTheDocument();
    });

    expect(item).not.toBeInTheDocument();
  });

  it('should skip the group creation if the user aborts the action', async () => {
    render(<AdminPanel />, { wrapper: Wrapper });

    const nav = await screen.findByRole('navigation');

    await userEvent.click(
      within(nav).getByRole('button', { name: /create new group/i })
    );

    expect(widgetApi.openModal).toBeCalledWith(
      '/admin/create-group',
      'Create new group',
      {
        buttons: [
          {
            disabled: true,
            id: 'net.nordeck.create.group.submit',
            kind: 'm.primary',
            label: 'Save',
          },
          {
            id: 'net.nordeck.create.group.cancel',
            kind: 'm.secondary',
            label: 'Cancel',
          },
        ],
      }
    );

    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });

  it('should create a new group', async () => {
    widgetApi.openModal.mockResolvedValue({
      group: mockGroup().content,
    } as GroupModalResult);

    render(<AdminPanel />, { wrapper: Wrapper });

    const nav = await screen.findByRole('navigation');

    await userEvent.click(
      within(nav).getByRole('button', { name: /create new group/i })
    );

    expect(widgetApi.openModal).toBeCalledWith(
      '/admin/create-group',
      'Create new group',
      {
        buttons: [
          {
            disabled: true,
            id: 'net.nordeck.create.group.submit',
            kind: 'm.primary',
            label: 'Save',
          },
          {
            id: 'net.nordeck.create.group.cancel',
            kind: 'm.secondary',
            label: 'Cancel',
          },
        ],
      }
    );

    await waitFor(() => {
      expect(widgetApi.sendStateEvent).toBeCalledWith(
        'net.nordeck.poll.group',
        { abbreviation: 'GROUP 0', color: '#07f556', members: {} },
        { stateKey: expect.any(String) }
      );
    });
  });

  it('should not be able to create a group as a guest', () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: { users_default: 0 },
      })
    );

    render(<AdminPanel />, { wrapper: Wrapper });

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
