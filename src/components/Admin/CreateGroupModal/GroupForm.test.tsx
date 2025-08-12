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
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mockGroup,
  mockPowerLevelsEvent,
  mockRoomMember,
} from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { GroupForm } from './GroupForm';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<GroupForm/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    widgetApi.mockSendStateEvent(mockRoomMember());
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-bob:example.com',
        content: {
          displayname: 'Bob',
        },
      }),
    );

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const store = useMemo(() => createStore({ widgetApi }), []);
      return <Provider store={store}>{children}</Provider>;
    };
  });

  it('should render without exploding', () => {
    render(<GroupForm onGroupChange={vi.fn()} />, { wrapper: Wrapper });

    expect(
      screen.getByRole('textbox', {
        name: 'Group title (required)',
        description: '',
      }),
    ).toBeInTheDocument();

    const colorElement = screen.getByLabelText('Group color (required)');
    expect(colorElement).toHaveAccessibleDescription('');

    const listDelegates = screen.getByRole('list', { name: /Delegates/i });

    expect(
      within(listDelegates).getByRole('listitem', {
        name: /No delegates have been assigned yet/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('combobox', {
        expanded: false,
        name: /Assign delegate/i,
      }),
    ).toBeInTheDocument();

    const listRepresentatives = screen.getByRole('list', {
      name: /Representatives/i,
    });

    expect(
      within(listRepresentatives).getByRole('listitem', {
        name: /No representatives have been assigned yet/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('combobox', {
        expanded: false,
        name: /Assign representative/i,
      }),
    ).toBeInTheDocument();
  });

  it('should add delegate and representative', async () => {
    render(<GroupForm onGroupChange={vi.fn()} />, { wrapper: Wrapper });

    const listDelegates = screen.getByRole('list', { name: /Delegates: 0/i });

    await userEvent.click(
      screen.getByRole('combobox', {
        expanded: false,
        name: /Assign delegate/i,
      }),
    );

    await userEvent.click(await screen.findByRole('option', { name: /Bob/i }));

    expect(
      within(listDelegates).getByRole('listitem', { name: /Bob/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('list', { name: /Delegates: 1/i }),
    ).toBeInTheDocument();

    const listRepresentatives = screen.getByRole('list', {
      name: /Representatives/i,
    });

    await userEvent.click(
      screen.getByRole('combobox', {
        expanded: false,
        name: /Assign representative/i,
      }),
    );

    await userEvent.click(screen.getByRole('option', { name: /alice/i }));

    expect(
      within(listRepresentatives).getByRole('listitem', { name: /alice/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('list', { name: /Representatives: 1/i }),
    ).toBeInTheDocument();
  });

  it('should ignore user already assigned to other groups', async () => {
    render(<GroupForm onGroupChange={vi.fn()} />, { wrapper: Wrapper });

    await userEvent.click(
      screen.getByRole('combobox', {
        expanded: false,
        name: /Assign delegate/i,
      }),
    );

    await waitFor(() => {
      expect(screen.getAllByRole('option').map((e) => e.textContent)).toEqual([
        'Alice',
        'Bob',
      ]);
    });

    widgetApi.mockSendStateEvent(
      mockGroup({
        state_key: 'group-1',
        content: {
          members: {
            '@user-bob:example.com': { memberRole: 'representative' },
          },
        },
      }),
    );

    await waitFor(() => {
      expect(screen.getAllByRole('option').map((e) => e.textContent)).toEqual([
        'Alice',
      ]);
    });
  });

  it('should ignore user already assigned to the current group', async () => {
    render(<GroupForm onGroupChange={vi.fn()} />, { wrapper: Wrapper });

    await userEvent.click(
      screen.getByRole('combobox', {
        expanded: false,
        name: /Assign delegate/i,
      }),
    );

    await userEvent.click(await screen.findByRole('option', { name: /Bob/i }));

    await userEvent.click(
      screen.getByRole('combobox', {
        expanded: false,
        name: /Assign delegate/i,
      }),
    );

    await waitFor(() => {
      expect(screen.getAllByRole('option').map((e) => e.textContent)).toEqual([
        'Alice',
      ]);
    });
  });

  it('should ignore user that left the room', async () => {
    render(<GroupForm onGroupChange={vi.fn()} />, { wrapper: Wrapper });

    await userEvent.click(
      screen.getByRole('combobox', {
        expanded: false,
        name: /Assign delegate/i,
      }),
    );

    await waitFor(() => {
      expect(screen.getAllByRole('option').map((e) => e.textContent)).toEqual([
        'Alice',
        'Bob',
      ]);
    });

    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-bob:example.com',
        content: {
          membership: 'leave',
          displayname: 'Bob',
        },
      }),
    );

    await waitFor(() => {
      expect(screen.getAllByRole('option').map((e) => e.textContent)).toEqual([
        'Alice',
      ]);
    });
  });

  it('should ignore user with insufficient voting rights', async () => {
    render(<GroupForm onGroupChange={vi.fn()} />, { wrapper: Wrapper });

    await userEvent.click(
      screen.getByRole('combobox', {
        expanded: false,
        name: /Assign delegate/i,
      }),
    );

    await waitFor(() => {
      expect(screen.getAllByRole('option').map((e) => e.textContent)).toEqual([
        'Alice',
        'Bob',
      ]);
    });

    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          users: {
            '@user-bob:example.com': 0,
          },
          events_default: 50,
        },
      }),
    );

    await waitFor(() => {
      expect(screen.getAllByRole('option').map((e) => e.textContent)).toEqual([
        'Alice',
      ]);
    });
  });

  it('should change delegation', async () => {
    render(<GroupForm onGroupChange={vi.fn()} />, { wrapper: Wrapper });

    const listDelegates = screen.getByRole('list', { name: /Delegates: 0/i });

    await userEvent.click(
      screen.getByRole('combobox', {
        expanded: false,
        name: /Assign delegate/i,
      }),
    );

    await userEvent.click(await screen.findByRole('option', { name: /Bob/i }));

    const userDelegate = within(listDelegates).getByRole('listitem', {
      name: /Bob/i,
    });

    await userEvent.click(
      within(userDelegate).getByRole('button', {
        name: /Change to representative/i,
      }),
    );
    expect(userDelegate).not.toBeInTheDocument();

    const listRepresentatives = screen.getByRole('list', {
      name: /Representatives/i,
    });

    const userRepresentative = within(listRepresentatives).getByRole(
      'listitem',
      {
        name: /Bob/i,
      },
    );

    await userEvent.click(
      within(userRepresentative).getByRole('button', {
        name: /Change to delegate/i,
      }),
    );

    expect(userRepresentative).not.toBeInTheDocument();

    expect(
      within(listDelegates).getByRole('listitem', {
        name: /Bob/i,
      }),
    ).toBeInTheDocument();
  });

  it('should remove a user from the delegation or representative list', async () => {
    render(<GroupForm onGroupChange={vi.fn()} />, { wrapper: Wrapper });

    const listDelegates = screen.getByRole('list', { name: /Delegates: 0/i });

    await userEvent.click(
      screen.getByRole('combobox', {
        expanded: false,
        name: /Assign delegate/i,
      }),
    );

    await userEvent.click(await screen.findByRole('option', { name: /Bob/i }));

    const userBob = within(listDelegates).getByRole('listitem', {
      name: /Bob/i,
    });

    await userEvent.click(
      within(userBob).getByRole('button', {
        name: /Remove/i,
      }),
    );

    expect(userBob).not.toBeInTheDocument();

    const listRepresentatives = screen.getByRole('list', {
      name: /Representatives/i,
    });

    await userEvent.click(
      screen.getByRole('combobox', {
        expanded: false,
        name: /Assign representative/i,
      }),
    );

    await userEvent.click(screen.getByRole('option', { name: /alice/i }));

    const userAlice = within(listRepresentatives).getByRole('listitem', {
      name: /alice/i,
    });

    await userEvent.click(
      within(userAlice).getByRole('button', {
        name: /Remove/i,
      }),
    );

    expect(userAlice).not.toBeInTheDocument();
  });

  it('should create group', async () => {
    const onGroupChange = vi.fn();

    render(<GroupForm onGroupChange={onGroupChange} />, { wrapper: Wrapper });

    await userEvent.type(
      screen.getByRole('textbox', {
        name: 'Group title (required)',
      }),
      'Red Party',
    );

    await userEvent.click(
      screen.getByRole('combobox', {
        expanded: false,
        name: /Assign delegate/i,
      }),
    );

    await userEvent.click(
      await screen.findByRole('option', { name: /alice/i }),
    );

    expect(onGroupChange).toHaveBeenLastCalledWith({
      abbreviation: 'Red Party',
      color: '#999999',
      members: {
        '@user-alice:example.com': { memberRole: 'delegate' },
      },
    });
  });

  it('should have not accessibility violations', async () => {
    const { container } = render(<GroupForm onGroupChange={vi.fn()} />, {
      wrapper: Wrapper,
    });

    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('should edit an existing group', () => {
    const onGroupChange = vi.fn();
    const group = mockGroup({
      content: {
        members: {
          '@user-bob:example.com': {
            memberRole: 'delegate',
          },
          '@user-alice:example.com': {
            memberRole: 'representative',
          },
        },
      },
    }).content;

    render(<GroupForm group={group} onGroupChange={onGroupChange} />, {
      wrapper: Wrapper,
    });
    const titleElement = screen.getByRole('textbox', {
      name: 'Group title (required)',
    });

    expect(titleElement).toHaveValue('GROUP 0');

    const colorElement = screen.getByLabelText('Group color (required)');

    expect(colorElement).toHaveValue('#07f556');

    const listDelegates = screen.getByRole('list', { name: /Delegates: 1/i });

    const listRepresentatives = screen.getByRole('list', {
      name: /Representatives: 1/i,
    });

    expect(
      within(listDelegates).getByRole('listitem', { name: /Bob/i }),
    ).toBeInTheDocument();

    expect(
      within(listRepresentatives).getByRole('listitem', { name: /alice/i }),
    ).toBeInTheDocument();
  });

  it('should edit members of the group', async () => {
    const onGroupChange = vi.fn();
    const group = mockGroup({
      content: {
        members: {
          '@user-bob:example.com': {
            memberRole: 'delegate',
          },
          '@user-alice:example.com': {
            memberRole: 'representative',
          },
        },
      },
    }).content;

    render(<GroupForm group={group} onGroupChange={onGroupChange} />, {
      wrapper: Wrapper,
    });

    const listDelegates = screen.getByRole('list', { name: /Delegates: 1/i });

    const userBob = within(listDelegates).getByRole('listitem', {
      name: /Bob/i,
    });

    await userEvent.click(
      within(userBob).getByRole('button', {
        name: /Remove/i,
      }),
    );

    await userEvent.click(
      screen.getByRole('combobox', {
        expanded: false,
        name: /Assign delegate/i,
      }),
    );

    await expect(
      screen.findByRole('option', { name: /Bob/i }),
    ).resolves.toBeInTheDocument();
  });

  it('should return undefined for an invalid group', async () => {
    const onGroupChange = vi.fn();

    render(<GroupForm onGroupChange={onGroupChange} />, { wrapper: Wrapper });

    const titleField = screen.getByRole('textbox', {
      name: 'Group title (required)',
      description: '',
    });

    await userEvent.type(titleField, 'A title');
    expect(titleField).toHaveAccessibleDescription('');
    expect(titleField).toBeValid();
    expect(onGroupChange).toHaveBeenLastCalledWith(expect.anything());

    await userEvent.clear(titleField);

    expect(titleField).toHaveAccessibleDescription('A title is required');
    expect(titleField).toBeInvalid();
    expect(onGroupChange).toHaveBeenLastCalledWith(undefined);

    const colorElement = screen.getByLabelText('Group color (required)');
    expect(colorElement).toHaveAccessibleDescription('');

    // we can't test the color element type because it can't be empty
  });
});
