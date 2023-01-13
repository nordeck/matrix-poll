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
import { mockGroup, mockPoll, mockPowerLevelsEvent } from '../../lib/testUtils';
import { withMarkup } from '../../lib/withMarkup';
import { createStore } from '../../store';
import { PollModalResult } from '../CreatePollModal';
import { PollsListUpcoming } from './PollsListUpcoming';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<PollsListUpcoming>', () => {
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
            '@user-alice': {
              memberRole: 'delegate',
            },
            '@user-bob': {
              memberRole: 'delegate',
            },
            '@user-charlie': {
              memberRole: 'delegate',
            },
            '@user-eric': {
              memberRole: 'representative',
            },
          },
        },
      })
    );
    widgetApi.mockSendStateEvent(
      mockGroup({
        event_id: '$event-id-1',
        state_key: 'blue-party',
        content: {
          abbreviation: 'Blue Party',
          color: '#0000ff',
          members: {
            '@user-dameon': {
              memberRole: 'delegate',
            },
          },
        },
      })
    );

    widgetApi.mockSendStateEvent(mockPoll());
    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-1',
        content: {
          title: 'My Other Title',
          question: 'My Other Question',
          description: 'My Other Description',
          groups: undefined,
        },
      })
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

  it('should have no accessibility violations', async () => {
    const { container } = render(<PollsListUpcoming />, { wrapper: Wrapper });

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have an accessible description that refers to the poll title', async () => {
    render(<PollsListUpcoming />, { wrapper: Wrapper });

    const notStartedPollList = screen.getByRole('list', {
      name: /not started polls/i,
    });
    const notStartedPollListItem = await within(notStartedPollList).findByRole(
      'listitem',
      { name: 'My Title' }
    );

    expect(
      within(notStartedPollListItem).getByRole('button', {
        name: 'More settings',
        description: 'My Title',
      })
    ).toBeInTheDocument();

    expect(
      within(notStartedPollListItem).getByRole('button', {
        name: 'Start',
        description: 'My Title',
      })
    ).toBeInTheDocument();
  });

  it('should list all upcoming polls', async () => {
    render(<PollsListUpcoming />, { wrapper: Wrapper });

    expect(
      screen.getByRole('heading', { level: 3, name: /not started polls/i })
    ).toBeInTheDocument();
    await expect(screen.findByText('2')).resolves.toBeInTheDocument();

    const pollList = screen.getByRole('list', { name: /not started polls/i });
    expect(
      within(pollList).getByRole('listitem', { name: 'My Title' })
    ).toBeInTheDocument();
    expect(
      within(pollList).getByRole('listitem', { name: 'My Other Title' })
    ).toBeInTheDocument();
  });

  it('should show readonly list for non-moderators', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({ content: { users_default: 0 } })
    );

    render(<PollsListUpcoming />, { wrapper: Wrapper });

    const pollList = screen.getByRole('list', { name: /not started polls/i });
    const pollListItem = await within(pollList).findByRole('listitem', {
      name: 'My Title',
    });

    expect(
      within(pollListItem).queryByRole('button', { name: 'Start' })
    ).not.toBeInTheDocument();
    expect(
      within(pollListItem).queryByRole('listbox', { name: 'More settings' })
    ).not.toBeInTheDocument();
  });

  it('should show start poll dialog and confirm start', async () => {
    render(<PollsListUpcoming />, { wrapper: Wrapper });

    const pollList = screen.getByRole('list', { name: /not started polls/i });
    const pollListItem = await within(pollList).findByRole('listitem', {
      name: 'My Title',
    });

    await userEvent.click(
      within(pollListItem).getByRole('button', { name: 'Start' })
    );

    const dialog = screen.getByRole('dialog', { name: 'Start poll' });

    expect(
      within(dialog).getByText('Are you sure you want to start the poll?')
    ).toBeInTheDocument();

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Start' })
    );

    await waitFor(() => expect(dialog).not.toBeInTheDocument(), {
      timeout: 2000,
    });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.poll',
      mockPoll({
        content: {
          startEventId: expect.any(String),
          startTime: expect.any(String),
          endTime: expect.any(String),
        },
      }).content,
      { stateKey: 'poll-0' }
    );
  });

  it('should show start poll dialog containing a summary of the poll', async () => {
    render(<PollsListUpcoming />, { wrapper: Wrapper });

    const pollList = screen.getByRole('list', { name: /not started polls/i });
    const pollListItem = await within(pollList).findByRole('listitem', {
      name: 'My Other Title',
    });

    await userEvent.click(
      within(pollListItem).getByRole('button', { name: 'Start' })
    );

    const dialog = screen.getByRole('dialog', { name: 'Start poll' });

    expect(
      within(dialog).getByText('Are you sure you want to start the poll?')
    ).toBeInTheDocument();

    expect(within(dialog).getByText('My Other Title')).toBeInTheDocument();
    expect(
      within(dialog).getByText('My Other Description')
    ).toBeInTheDocument();
    expect(within(dialog).getByText('My Other Question')).toBeInTheDocument();
    expect(within(dialog).getByText('Ends in 01:00')).toBeInTheDocument();

    const radioGroup = within(dialog).getByRole('radiogroup', {
      name: 'Answer',
    });
    expect(radioGroup).toHaveAccessibleDescription('My Other Question');
    expect(
      within(radioGroup).getByRole('radio', { name: 'Yes' })
    ).toBeInTheDocument();
    expect(
      within(radioGroup).getByRole('radio', { name: 'No' })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'See live result' })
    ).toBeInTheDocument();
  });

  it('should show start poll dialog containing a summary of the poll with voting rights', async () => {
    render(<PollsListUpcoming />, { wrapper: Wrapper });

    const pollList = screen.getByRole('list', { name: /not started polls/i });
    const pollListItem = await within(pollList).findByRole('listitem', {
      name: 'My Title',
    });

    await userEvent.click(
      within(pollListItem).getByRole('button', { name: 'Start' })
    );

    const dialog = screen.getByRole('dialog', { name: 'Start poll' });

    expect(
      within(dialog).getByText('Are you sure you want to start the poll?')
    ).toBeInTheDocument();

    const redPartyList = within(dialog).getByRole('list', {
      name: 'Red Party',
    });

    expect(
      within(redPartyList).getByRole('listitem', { name: '@user-alice' })
    ).toHaveTextContent(/Present/);
    expect(
      within(redPartyList).getByRole('listitem', { name: '@user-bob' })
    ).toHaveTextContent(/Present/);
    expect(
      within(redPartyList).getByRole('listitem', { name: '@user-charlie' })
    ).toHaveTextContent(/Present/);

    const bluePartyList = within(dialog).getByRole('list', {
      name: 'Blue Party',
    });

    expect(
      within(bluePartyList).getByRole('listitem', { name: '@user-dameon' })
    ).toHaveTextContent(/Present/);

    await waitFor(() => {
      expect(
        within(dialog).queryByText(/Changes in the groups/i)
      ).not.toBeInTheDocument();
    });
  });

  it('should show start poll dialog with a warning if the groups in the room and the groups of the poll conflict', async () => {
    // No groups results in a conflict
    widgetApi.clearStateEvents({ type: 'net.nordeck.poll.group' });

    render(<PollsListUpcoming />, { wrapper: Wrapper });

    const pollList = screen.getByRole('list', { name: /not started polls/i });
    const pollListItem = await within(pollList).findByRole('listitem', {
      name: 'My Title',
    });

    await userEvent.click(
      within(pollListItem).getByRole('button', { name: 'Start' })
    );

    const dialog = screen.getByRole('dialog', { name: 'Start poll' });

    expect(
      within(dialog).getByText('Are you sure you want to start the poll?')
    ).toBeInTheDocument();

    expect(
      within(dialog).getByText(/Changes in the groups/i)
    ).toBeInTheDocument();
  });

  it('should show start poll dialog with a warning if a user of a group has no permission to vote', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          events_default: 50,
          users: {
            '@user-alice': 20,
          },
        },
      })
    );

    render(<PollsListUpcoming />, { wrapper: Wrapper });

    const pollList = screen.getByRole('list', { name: /not started polls/i });
    const pollListItem = await within(pollList).findByRole('listitem', {
      name: 'My Title',
    });

    await userEvent.click(
      within(pollListItem).getByRole('button', { name: 'Start' })
    );

    const dialog = screen.getByRole('dialog', { name: 'Start poll' });

    await waitFor(() => {
      const aliceItem = within(dialog).getByRole('listitem', {
        name: '@user-alice',
      });

      expect(
        withMarkup(within(aliceItem).getByText)(
          /user-alice has an insufficient power level and will not be able to vote./
        )
      ).toBeInTheDocument();
    });
  });

  it('should show start poll dialog with a error if there is no voters', async () => {
    widgetApi.clearStateEvents({ type: 'net.nordeck.poll' });
    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-1',
        content: {
          title: 'My Title',
          question: 'My Question',
          description: 'My Description',
          groups: [
            {
              id: 'red-party',
              eventId: '$event-id-0',
              abbreviation: 'Red Party',
              color: '#ff0000',
              votingRights: {},
            },
            {
              id: 'blue-party',
              eventId: '$event-id-1',
              abbreviation: 'Blue Party',
              color: '#0000ff',
              votingRights: {},
            },
          ],
        },
      })
    );

    render(<PollsListUpcoming />, { wrapper: Wrapper });

    const pollList = screen.getByRole('list', { name: /not started polls/i });
    const pollListItem = await within(pollList).findByRole('listitem', {
      name: 'My Title',
    });

    await userEvent.click(
      within(pollListItem).getByRole('button', { name: 'Start' })
    );

    const dialog = screen.getByRole('dialog', { name: 'Start poll' });

    const alert = within(dialog).getByRole('status');
    expect(
      within(alert).getByText('This poll has no voters.')
    ).toBeInTheDocument();
    expect(
      within(alert).getByText('Please add voters to the poll.')
    ).toBeInTheDocument();
  });

  it('should show start poll dialog with a error if there is just absent and represented voters', async () => {
    widgetApi.clearStateEvents({ type: 'net.nordeck.poll' });
    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-1',
        content: {
          title: 'My Title',
          question: 'My Question',
          description: 'My Description',
          groups: [
            {
              id: 'red-party',
              eventId: '$event-id-0',
              abbreviation: 'Red Party',
              color: '#ff0000',
              votingRights: {},
            },
            {
              id: 'blue-party',
              eventId: '$event-id-1',
              abbreviation: 'Blue Party',
              color: '#0000ff',
              votingRights: {
                '@user-charlie': {
                  state: 'represented',
                  representedBy: '@user-bob',
                },
                '@user-bob': {
                  state: 'invalid',
                },
              },
            },
          ],
        },
      })
    );

    render(<PollsListUpcoming />, { wrapper: Wrapper });

    const pollList = screen.getByRole('list', { name: /not started polls/i });
    const pollListItem = await within(pollList).findByRole('listitem', {
      name: 'My Title',
    });

    await userEvent.click(
      within(pollListItem).getByRole('button', { name: 'Start' })
    );

    const dialog = screen.getByRole('dialog', { name: 'Start poll' });

    const alert = within(dialog).getByRole('status');
    expect(
      within(alert).getByText('This poll has no voters.')
    ).toBeInTheDocument();
    expect(
      within(alert).getByText('Please add voters to the poll.')
    ).toBeInTheDocument();
  });

  it('should show start poll dialog and cancel start', async () => {
    render(<PollsListUpcoming />, { wrapper: Wrapper });

    const pollList = screen.getByRole('list', { name: /not started polls/i });
    const pollListItem = await within(pollList).findByRole('listitem', {
      name: 'My Title',
    });

    await userEvent.click(
      within(pollListItem).getByRole('button', { name: 'Start' })
    );

    const dialog = screen.getByRole('dialog', { name: 'Start poll' });

    expect(
      within(dialog).getByText('Are you sure you want to start the poll?')
    ).toBeInTheDocument();

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Cancel' })
    );

    await waitFor(() => expect(dialog).not.toBeInTheDocument(), {
      timeout: 2000,
    });
    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });

  it('should open edit dialog for a poll', async () => {
    widgetApi.openModal.mockResolvedValue({
      poll: mockPoll({ content: { title: 'New Title' } }).content,
    } as PollModalResult);

    render(<PollsListUpcoming />, { wrapper: Wrapper });

    const pollList = screen.getByRole('list', { name: /not started polls/i });
    const pollListItem = await within(pollList).findByRole('listitem', {
      name: 'My Title',
    });

    await userEvent.click(
      within(pollListItem).getByRole('button', { name: 'More settings' })
    );

    const menu = screen.getByRole('menu', { name: /more settings/i });

    await userEvent.click(
      within(menu).getByRole('menuitem', { name: 'Edit poll' })
    );

    await waitFor(() => {
      expect(widgetApi.openModal).toBeCalledWith('create-poll', 'Edit poll', {
        buttons: expect.any(Array),
        data: { poll: mockPoll().content },
      });
    });

    expect(
      within(pollList).getByRole('listitem', { name: 'New Title' })
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(widgetApi.sendStateEvent).toBeCalledWith(
        'net.nordeck.poll',
        mockPoll({ content: { title: 'New Title' } }).content,
        { stateKey: 'poll-0' }
      )
    );
  });

  it('should not update the poll if the user aborts the action', async () => {
    render(<PollsListUpcoming />, { wrapper: Wrapper });

    const pollList = screen.getByRole('list', { name: /not started polls/i });
    const pollListItem = await within(pollList).findByRole('listitem', {
      name: 'My Title',
    });

    await userEvent.click(
      within(pollListItem).getByRole('button', { name: 'More settings' })
    );

    const menu = screen.getByRole('menu', { name: /more settings/i });

    await userEvent.click(
      within(menu).getByRole('menuitem', { name: 'Edit poll' })
    );

    await waitFor(() => {
      expect(widgetApi.openModal).toBeCalledWith('create-poll', 'Edit poll', {
        buttons: expect.any(Array),
        data: { poll: mockPoll().content },
      });
    });

    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });

  it('should show delete poll dialog and confirm deletion', async () => {
    render(<PollsListUpcoming />, { wrapper: Wrapper });

    const pollList = screen.getByRole('list', { name: /not started polls/i });
    const pollListItem = await within(pollList).findByRole('listitem', {
      name: 'My Title',
    });

    await userEvent.click(
      within(pollListItem).getByRole('button', {
        name: 'More settings',
      })
    );

    const menu = screen.getByRole('menu', { name: /more settings/i });

    await userEvent.click(
      within(menu).getByRole('menuitem', { name: 'Delete poll' })
    );

    const dialog = screen.getByRole('dialog', { name: 'Delete poll' });

    expect(dialog).toHaveAccessibleDescription(
      'Are you sure you want to delete the poll “My Title”?'
    );
    expect(
      within(dialog).getByText(
        'Are you sure you want to delete the poll “My Title”?'
      )
    ).toBeInTheDocument();

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Delete' })
    );

    await waitFor(() => {
      expect(dialog).not.toBeInTheDocument();
    });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.poll',
      {},
      { stateKey: 'poll-0' }
    );
  });

  it('should show delete poll dialog and cancel deletion', async () => {
    render(<PollsListUpcoming />, { wrapper: Wrapper });

    const pollList = screen.getByRole('list', { name: /not started polls/i });
    const pollListItem = await within(pollList).findByRole('listitem', {
      name: 'My Title',
    });

    await userEvent.click(
      within(pollListItem).getByRole('button', { name: 'More settings' })
    );

    const menu = screen.getByRole('menu', { name: /more settings/i });

    await userEvent.click(
      within(menu).getByRole('menuitem', { name: 'Delete poll' })
    );

    const dialog = screen.getByRole('dialog', { name: 'Delete poll' });

    expect(dialog).toHaveAccessibleDescription(
      'Are you sure you want to delete the poll “My Title”?'
    );
    expect(
      within(dialog).getByText(
        'Are you sure you want to delete the poll “My Title”?'
      )
    ).toBeInTheDocument();

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Cancel' })
    );

    await waitFor(() => {
      expect(dialog).not.toBeInTheDocument();
    });

    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });
});
