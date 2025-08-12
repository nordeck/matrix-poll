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
import axe from 'axe-core';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mockGroup,
  mockPoll,
  mockPowerLevelsEvent,
  mockRoomMember,
} from '../../lib/testUtils';
import { withMarkup } from '../../lib/withMarkup';
import { IPoll, PollType, ResultType } from '../../model';
import { createStore } from '../../store';
import { CreatePollForm } from './CreatePollForm';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => {
  widgetApi = mockWidgetApi();
});

// These tests are quite slow, increasing the timeout to make it work in CI.
vi.setConfig({ testTimeout: 20000 });

describe('<CreatePollForm>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    widgetApi.mockSendStateEvent(
      mockGroup({
        state_key: 'red-party',
        event_id: '$event-id-0',
        content: {
          abbreviation: 'Red Party',
          color: '#ff0000',
          members: {
            '@user-alice:example.com': {
              memberRole: 'delegate',
            },
            '@user-bob:example.com': {
              memberRole: 'delegate',
            },
            '@user-charlie:example.com': {
              memberRole: 'delegate',
            },
            '@user-eric:example.com': {
              memberRole: 'representative',
            },
          },
        },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockGroup({
        event_id: '$event-id-1',
        state_key: 'blue-party',
        content: {
          abbreviation: 'Blue Party',
          color: '#0000ff',
          members: {
            '@user-dameon:example.com': {
              memberRole: 'delegate',
            },
          },
        },
      }),
    );

    widgetApi.mockSendStateEvent(mockRoomMember());
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-bob:example.com',
        event_id: '$event-id-1',
        content: { displayname: 'Bob', avatar_url: undefined },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-charlie:example.com',
        event_id: '$event-id-2',
        content: { displayname: 'Charlie', avatar_url: undefined },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-dameon:example.com',
        event_id: '$event-id-3',
        content: { displayname: 'Dameon', avatar_url: undefined },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-eric:example.com',
        event_id: '$event-id-4',
        content: { displayname: 'Eric', avatar_url: undefined },
      }),
    );

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const store = useMemo(() => createStore({ widgetApi }), []);
      return (
        <WidgetApiMockProvider value={widgetApi}>
          <Provider store={store}>{children}</Provider>
        </WidgetApiMockProvider>
      );
    };
  });

  it('should create a new poll', async () => {
    const onPollChange = vi.fn();

    widgetApi.clearStateEvents();

    render(<CreatePollForm onPollChange={onPollChange} />, {
      wrapper: Wrapper,
    });

    const descriptionTextbox = screen.getByRole('textbox', {
      name: 'Description',
      description: '',
    });
    expect(descriptionTextbox).toHaveValue('');
    await userEvent.type(descriptionTextbox, 'Poll Description');

    const titleTextbox = screen.getByRole('textbox', {
      name: 'Title (required)',
      description: 'A title is required',
    });
    expect(titleTextbox).toHaveValue('');
    await userEvent.type(titleTextbox, 'Poll Title');
    expect(titleTextbox).toHaveAccessibleDescription('');

    const questionTextbox = screen.getByRole('textbox', {
      name: 'Question (required)',
      description: 'A question is required',
    });
    expect(questionTextbox).toHaveValue('');
    await userEvent.type(questionTextbox, 'Poll Question');
    expect(questionTextbox).toHaveAccessibleDescription('');

    const answerTypeRadioGroup = screen.getByRole('radiogroup', {
      name: /answer type/i,
    });
    expect(
      within(answerTypeRadioGroup).getByRole('radio', {
        name: 'Yes | No | Abstain',
      }),
    ).toBeChecked();
    await userEvent.click(
      within(answerTypeRadioGroup).getByRole('radio', { name: 'Yes | No' }),
    );

    const durationSpinbutton = screen.getByRole('spinbutton', {
      name: 'Duration in minutes (required)',
      description: '',
    });
    expect(durationSpinbutton).toHaveValue(1);
    await userEvent.type(durationSpinbutton, '5', {
      initialSelectionStart: 0,
      initialSelectionEnd: 2,
    });

    await userEvent.click(
      screen.getByRole('button', { name: /poll type open/i }),
    );
    const pollTypeListbox = screen.getByRole('listbox', { name: /poll type/i });
    await userEvent.click(
      within(pollTypeListbox).getByRole('option', { name: /by name/i }),
    );

    const liveResultsSwitch = screen.getByRole('checkbox', {
      name: /display live results/i,
    });
    expect(liveResultsSwitch).toBeChecked();
    await userEvent.click(liveResultsSwitch);

    expect(onPollChange).toHaveBeenLastCalledWith({
      title: 'Poll Title',
      question: 'Poll Question',
      description: 'Poll Description',
      pollType: PollType.ByName,
      answers: [
        { id: '1', label: 'Yes' },
        { id: '2', label: 'No' },
      ],
      resultType: ResultType.Invisible,
      duration: 5,
      groups: undefined,
    });
  });

  it('should have not accessibility violations', async () => {
    const { container } = render(<CreatePollForm onPollChange={vi.fn()} />, {
      wrapper: Wrapper,
    });

    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('should edit an existing poll', () => {
    widgetApi.clearStateEvents();

    render(
      <CreatePollForm
        onPollChange={vi.fn()}
        poll={{
          title: 'Poll Title',
          question: 'Poll Question',
          description: 'Poll Description',
          pollType: PollType.ByName,
          answers: [
            { id: '1', label: 'Yes' },
            { id: '2', label: 'No' },
          ],
          resultType: ResultType.Invisible,
          duration: 50000,
          groups: undefined,
        }}
      />,
      { wrapper: Wrapper },
    );

    expect(
      screen.getByRole('textbox', { name: 'Title (required)' }),
    ).toHaveValue('Poll Title');
    expect(
      screen.getByRole('textbox', {
        name: 'Description',
      }),
    ).toHaveValue('Poll Description');
    expect(
      screen.getByRole('textbox', { name: 'Question (required)' }),
    ).toHaveValue('Poll Question');
    const answerTypeRadioGroup = screen.getByRole('radiogroup', {
      name: /answer type/i,
    });
    expect(
      within(answerTypeRadioGroup).getByRole('radio', {
        name: 'Yes | No',
      }),
    ).toBeChecked();
    expect(
      screen.getByRole('spinbutton', {
        name: 'Duration in minutes (required)',
      }),
    ).toHaveValue(50000);
    expect(
      screen.getByRole('button', { name: /poll type by name/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', {
        name: /display live results/i,
      }),
    ).not.toBeChecked();
  });

  it('should handle required fields', async () => {
    const onPollChange = vi.fn();

    widgetApi.clearStateEvents();

    render(
      <CreatePollForm
        onPollChange={onPollChange}
        poll={mockPoll({}).content}
      />,
      { wrapper: Wrapper },
    );

    const titleTextbox = screen.getByRole('textbox', {
      name: 'Title (required)',
    });
    await userEvent.clear(titleTextbox);
    expect(onPollChange).toHaveBeenLastCalledWith(undefined);

    await userEvent.type(titleTextbox, 'Poll Title');
    expect(onPollChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: 'Poll Title' }),
    );

    const questionTextbox = screen.getByRole('textbox', {
      name: 'Question (required)',
    });
    await userEvent.clear(questionTextbox);
    expect(onPollChange).toHaveBeenLastCalledWith(undefined);

    await userEvent.type(questionTextbox, 'Poll Question');
    expect(onPollChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ question: 'Poll Question' }),
    );
  });

  it('should not provide the voting rights configuration, if no groups are present', () => {
    const onPollChange = vi.fn();

    widgetApi.clearStateEvents();

    render(<CreatePollForm onPollChange={onPollChange} />, {
      wrapper: Wrapper,
    });

    expect(
      screen.queryByRole('heading', { name: /Voting persons/i }),
    ).not.toBeInTheDocument();
  });

  it('should list all groups and their delegates', async () => {
    const onPollChange = vi.fn();
    const poll: IPoll = mockPoll({
      content: {
        groups: [
          {
            id: 'red-party',
            eventId: '$event-id-0',
            abbreviation: 'Red Party',
            color: '#ff0000',
            votingRights: {
              '@user-alice:example.com': {
                state: 'active',
              },
              '@user-bob:example.com': {
                state: 'invalid',
              },
              '@user-charlie:example.com': {
                state: 'active',
              },
            },
          },
          {
            id: 'blue-party',
            eventId: '$event-id-1',
            abbreviation: 'Blue Party',
            color: '#0000ff',
            votingRights: {
              '@user-dameon:example.com': {
                state: 'active',
              },
            },
          },
        ],
      },
    }).content;

    render(<CreatePollForm onPollChange={onPollChange} poll={poll} />, {
      wrapper: Wrapper,
    });

    await expect(
      screen.findByRole('region', { name: /voting persons/i }),
    ).resolves.toBeInTheDocument();

    const redPartyList = screen.getByRole('list', {
      name: /red party/i,
    });

    const itemAlice = within(redPartyList).getByRole('listitem', {
      name: /alice/i,
    });
    expect(
      within(itemAlice).getByRole('combobox', {
        name: /attendance/i,
        description: /alice/i,
      }),
    ).toHaveValue('Present');

    const itemBob = within(redPartyList).getByRole('listitem', {
      name: /bob/i,
    });
    expect(
      within(itemBob).getByRole('combobox', {
        name: /attendance/i,
        description: /bob/i,
      }),
    ).toHaveValue('Absent');

    const itemCharlie = within(redPartyList).getByRole('listitem', {
      name: /charlie/i,
    });
    expect(
      within(itemCharlie).getByRole('combobox', {
        name: /attendance/i,
        description: /charlie/i,
      }),
    ).toHaveValue('Present');

    const bluePartyList = screen.getByRole('list', { name: /blue party/i });

    const itemDameon = within(bluePartyList).getByRole('listitem', {
      name: /dameon/i,
    });
    expect(
      within(itemDameon).getByRole('combobox', {
        name: /attendance/i,
        description: /dameon/i,
      }),
    ).toHaveValue('Present');
  });

  it('should set all voting persons to active', async () => {
    const onPollChange = vi.fn();

    render(<CreatePollForm onPollChange={onPollChange} />, {
      wrapper: Wrapper,
    });

    const redPartyList = await screen.findByRole('list', {
      name: /red party/i,
    });

    const itemAlice = within(redPartyList).getByRole('listitem', {
      name: /alice/i,
    });
    expect(
      within(itemAlice).getByRole('combobox', { name: /attendance/i }),
    ).toHaveValue('Present');

    const itemBob = within(redPartyList).getByRole('listitem', {
      name: /bob/i,
    });
    expect(
      within(itemBob).getByRole('combobox', { name: /attendance/i }),
    ).toHaveValue('Present');

    const itemCharlie = within(redPartyList).getByRole('listitem', {
      name: /charlie/i,
    });
    expect(
      within(itemCharlie).getByRole('combobox', { name: /attendance/i }),
    ).toHaveValue('Present');

    const bluePartyList = screen.getByRole('list', { name: /blue party/i });

    const itemDameon = within(bluePartyList).getByRole('listitem', {
      name: /dameon/i,
    });
    expect(
      within(itemDameon).getByRole('combobox', { name: /attendance/i }),
    ).toHaveValue('Present');
  });

  it('should show an empty state if a group has no delegates', async () => {
    widgetApi.clearStateEvents();
    widgetApi.mockSendStateEvent(
      mockGroup({
        event_id: '$event-id-0',
        state_key: 'red-party',
        content: {
          abbreviation: 'Red Party',
          color: '#ff0000',
          members: {},
        },
      }),
    );

    const onPollChange = vi.fn();
    render(<CreatePollForm onPollChange={onPollChange} />, {
      wrapper: Wrapper,
    });

    const redPartyList = await screen.findByRole('list', {
      name: /red party/i,
    });
    expect(
      within(redPartyList).getByRole('listitem', {
        name: 'No delegates have been assigned yet',
      }),
    ).toBeInTheDocument();
  });

  it('should allow to set a user to absent without a representative', async () => {
    const onPollChange = vi.fn();

    render(<CreatePollForm onPollChange={onPollChange} />, {
      wrapper: Wrapper,
    });

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Title (required)' }),
      'My Title',
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Description' }),
      'My Description',
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Question (required)' }),
      'My Question',
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Yes | No' }));

    const redPartyList = await screen.findByRole('list', {
      name: /red party/i,
    });
    const aliceItem = within(redPartyList).getByRole('listitem', {
      name: /alice/i,
    });

    await userEvent.click(
      within(aliceItem).getByRole('combobox', {
        name: /attendance/i,
        expanded: false,
      }),
    );

    const aliceListbox = within(aliceItem).getByRole('listbox');

    expect(
      within(aliceListbox).getByRole('option', {
        name: 'Present',
        selected: true,
      }),
    ).toBeInTheDocument();
    await expect(
      within(aliceListbox).findByRole('option', {
        name: 'Represented by Eric',
        selected: false,
      }),
    ).resolves.toBeInTheDocument();
    expect(
      within(aliceListbox).getByRole('option', {
        name: 'Absent',
        selected: false,
      }),
    ).toBeInTheDocument();

    await userEvent.click(
      within(aliceListbox).getByRole('option', {
        name: 'Absent',
        selected: false,
      }),
    );

    expect(
      within(aliceItem).getByRole('combobox', { name: /attendance/i }),
    ).toHaveValue('Absent');

    expect(onPollChange).toBeCalledWith(
      mockPoll({
        content: {
          groups: [
            {
              id: 'red-party',
              eventId: '$event-id-0',
              abbreviation: 'Red Party',
              color: '#ff0000',
              votingRights: {
                '@user-alice:example.com': {
                  state: 'invalid',
                },
                '@user-bob:example.com': {
                  state: 'active',
                },
                '@user-charlie:example.com': {
                  state: 'active',
                },
              },
            },
            {
              id: 'blue-party',
              eventId: '$event-id-1',
              abbreviation: 'Blue Party',
              color: '#0000ff',
              votingRights: {
                '@user-dameon:example.com': {
                  state: 'active',
                },
              },
            },
          ],
        },
      }).content,
    );
  });

  it('should allow to set a user to absent with a representative', async () => {
    const onPollChange = vi.fn();

    render(<CreatePollForm onPollChange={onPollChange} />, {
      wrapper: Wrapper,
    });

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Title (required)' }),
      'My Title',
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Description' }),
      'My Description',
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Question (required)' }),
      'My Question',
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Yes | No' }));

    const redPartyList = await screen.findByRole('list', {
      name: /red party/i,
    });
    const aliceItem = within(redPartyList).getByRole('listitem', {
      name: /alice/i,
    });

    await userEvent.click(
      within(aliceItem).getByRole('combobox', { expanded: false }),
    );

    const aliceListbox = within(aliceItem).getByRole('listbox');

    await userEvent.click(
      await within(aliceListbox).findByRole('option', {
        name: 'Represented by Eric',
        selected: false,
      }),
    );

    expect(within(aliceItem).getByRole('combobox')).toHaveValue(
      'Represented by Eric',
    );

    expect(onPollChange).toBeCalledWith(
      mockPoll({
        content: {
          groups: [
            {
              id: 'red-party',
              eventId: '$event-id-0',
              abbreviation: 'Red Party',
              color: '#ff0000',
              votingRights: {
                '@user-alice:example.com': {
                  state: 'represented',
                  representedBy: '@user-eric:example.com',
                },
                '@user-bob:example.com': {
                  state: 'active',
                },
                '@user-charlie:example.com': {
                  state: 'active',
                },
              },
            },
            {
              id: 'blue-party',
              eventId: '$event-id-1',
              abbreviation: 'Blue Party',
              color: '#0000ff',
              votingRights: {
                '@user-dameon:example.com': {
                  state: 'active',
                },
              },
            },
          ],
        },
      }).content,
    );
  });

  it('should only allow to use a representative once', async () => {
    const onPollChange = vi.fn();

    render(<CreatePollForm onPollChange={onPollChange} />, {
      wrapper: Wrapper,
    });

    const redPartyList = await screen.findByRole('list', {
      name: /red party/i,
    });
    const aliceItem = within(redPartyList).getByRole('listitem', {
      name: /alice/i,
    });

    await userEvent.click(
      within(aliceItem).getByRole('combobox', { expanded: false }),
    );
    const aliceListbox = within(aliceItem).getByRole('listbox');

    await userEvent.click(
      await within(aliceListbox).findByRole('option', {
        name: 'Represented by Eric',
        selected: false,
      }),
    );

    const bobItem = within(redPartyList).getByRole('listitem', {
      name: /bob/i,
    });
    await userEvent.click(
      within(bobItem).getByRole('combobox', { expanded: false }),
    );
    const bobListbox = within(bobItem).getByRole('listbox');

    expect(
      within(bobListbox)
        .getAllByRole('option')
        .map((n) => n.textContent),
    ).toEqual(['Present', 'Absent']);
  });

  it('should allow to set a user back to present', async () => {
    const onPollChange = vi.fn();

    render(<CreatePollForm onPollChange={onPollChange} />, {
      wrapper: Wrapper,
    });

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Title (required)' }),
      'My Title',
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Description' }),
      'My Description',
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Question (required)' }),
      'My Question',
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Yes | No' }));

    const redPartyList = await screen.findByRole('list', {
      name: /red party/i,
    });
    const aliceItem = within(redPartyList).getByRole('listitem', {
      name: /alice/i,
    });
    await userEvent.click(
      within(aliceItem).getByRole('combobox', { expanded: false }),
    );
    await userEvent.click(
      within(within(aliceItem).getByRole('listbox')).getByRole('option', {
        name: 'Absent',
        selected: false,
      }),
    );

    await userEvent.click(
      within(aliceItem).getByRole('combobox', { expanded: false }),
    );
    await userEvent.click(
      within(within(aliceItem).getByRole('listbox')).getByRole('option', {
        name: 'Present',
        selected: false,
      }),
    );

    expect(within(aliceItem).getByRole('combobox')).toHaveValue('Present');

    expect(onPollChange).toBeCalledWith(mockPoll().content);
  });

  it('should show warning message if a delegate has no more permission to vote', async () => {
    const onPollChange = vi.fn();

    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          events_default: 50,
          users: {
            '@user-alice:example.com': 20,
          },
        },
      }),
    );

    render(<CreatePollForm onPollChange={onPollChange} />, {
      wrapper: Wrapper,
    });

    const redPartyList = await screen.findByRole('list', {
      name: /red party/i,
    });
    const aliceItem = within(redPartyList).getByRole('listitem', {
      name: /alice/i,
    });

    await waitFor(() => {
      expect(
        withMarkup(within(aliceItem).getByText)(
          /Alice has an insufficient power level and will not be able to vote./,
        ),
      ).toBeInTheDocument();
    });
  });

  it('should show warning message if a representative has no more permission to vote', async () => {
    const onPollChange = vi.fn();
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          events_default: 50,
          users: {
            '@user-eric:example.com': 20,
          },
        },
      }),
    );

    render(<CreatePollForm onPollChange={onPollChange} />, {
      wrapper: Wrapper,
    });

    const redPartyList = await screen.findByRole('list', {
      name: /red party/i,
    });
    const aliceItem = within(redPartyList).getByRole('listitem', {
      name: /alice/i,
    });

    await userEvent.click(
      within(aliceItem).getByRole('combobox', { expanded: false }),
    );

    const aliceListbox = within(aliceItem).getByRole('listbox');

    await userEvent.click(
      await within(aliceListbox).findByRole('option', {
        name: 'Represented by Eric',
        selected: false,
      }),
    );

    await waitFor(() => {
      expect(
        withMarkup(within(aliceItem).getByText)(
          /Eric cannot represent Alice because the user has an insufficient power level./,
        ),
      ).toBeInTheDocument();
    });
  });

  it('should update the groups of the poll on load if they are different from the group events', async () => {
    const onPollChange = vi.fn();
    const poll: IPoll = mockPoll({
      content: {
        groups: [
          {
            id: 'red-party',
            eventId: '$event-id-2',
            abbreviation: 'Red Party',
            color: '#ff0000',
            votingRights: {
              '@user-alice:example.com': {
                state: 'active',
              },
              '@user-bob:example.com': {
                state: 'represented',
                representedBy: 'user-hans',
              },
              '@user-charlie:example.com': {
                state: 'active',
              },
            },
          },
          {
            id: 'blue-party',
            eventId: '$event-id-1',
            abbreviation: 'Blue Party',
            color: '#0000ff',
            votingRights: {
              '@user-dameon:example.com': {
                state: 'active',
              },
            },
          },
        ],
      },
    }).content;

    render(<CreatePollForm onPollChange={onPollChange} poll={poll} />, {
      wrapper: Wrapper,
    });

    const redPartyList = await screen.findByRole('list', {
      name: /red party/i,
    });
    const itemBob = within(redPartyList).getByRole('listitem', {
      name: /bob/i,
    });

    expect(
      within(itemBob).getByRole('combobox', { expanded: false }),
    ).toHaveValue('Absent');

    expect(onPollChange).toHaveBeenLastCalledWith(
      mockPoll({
        content: {
          groups: [
            {
              id: 'red-party',
              eventId: '$event-id-0',
              abbreviation: 'Red Party',
              color: '#ff0000',
              votingRights: {
                '@user-alice:example.com': {
                  state: 'active',
                },
                '@user-bob:example.com': {
                  state: 'invalid',
                },
                '@user-charlie:example.com': {
                  state: 'active',
                },
              },
            },
            {
              id: 'blue-party',
              eventId: '$event-id-1',
              abbreviation: 'Blue Party',
              color: '#0000ff',
              votingRights: {
                '@user-dameon:example.com': {
                  state: 'active',
                },
              },
            },
          ],
        },
      }).content,
    );
  });

  it('should convert decimal numbers duration to Whole numbers', async () => {
    const onPollChange = vi.fn();

    widgetApi.clearStateEvents();

    render(<CreatePollForm onPollChange={onPollChange} />, {
      wrapper: Wrapper,
    });

    const durationSpinbutton = screen.getByRole('spinbutton', {
      name: 'Duration in minutes (required)',
      description: '',
    });

    expect(durationSpinbutton).toHaveValue(1);

    await userEvent.type(durationSpinbutton, '5.5', {
      initialSelectionStart: 0,
      initialSelectionEnd: 2,
    });

    expect(durationSpinbutton).toHaveValue(55);
  });
});
