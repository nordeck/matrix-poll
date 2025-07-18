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
import { DateTime } from 'luxon';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  mockPoll,
  mockPollStart,
  mockPowerLevelsEvent,
  mockRoomMember,
  mockVote,
} from '../../lib/testUtils';
import { PollType, ResultType } from '../../model';
import { createStore } from '../../store';
import { PollsListOngoing } from './PollsListOngoing';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi({ userId: '@user-charlie' })));

describe('<PollsListOngoing>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    widgetApi.mockSendStateEvent(mockPowerLevelsEvent());

    widgetApi.mockSendStateEvent(mockRoomMember());
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-bob',
        event_id: '$event-id-1',
        content: { displayname: 'Bob', avatar_url: undefined },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-charlie',
        event_id: '$event-id-2',
        content: { displayname: 'charlie', avatar_url: undefined },
      }),
    );

    widgetApi.mockSendRoomEvent(mockPollStart());
    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-open-visible',
        content: {
          title: 'Test poll open and visible',
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
          startEventId: '$start-event-id',
        },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-byName-visible',
        event_id: '$event-id-1',
        content: {
          title: 'Test poll by name and visible',
          pollType: PollType.ByName,
          resultType: ResultType.Visible,
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
        },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-secret-visible',
        event_id: '$event-id-2',
        content: {
          title: 'Test poll secret and visible',
          pollType: PollType.Secret,
          resultType: ResultType.Visible,
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
        },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-open-invisible',
        event_id: '$event-id-3',
        content: {
          title: 'Test poll open and invisible',
          pollType: PollType.Open,
          resultType: ResultType.Invisible,
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
        },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-secret-invisible',
        event_id: '$event-id-4',
        content: {
          title: 'Test poll secret and invisible',
          pollType: PollType.Secret,
          resultType: ResultType.Invisible,
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
        },
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

  it('should have no accessibility violations', async () => {
    const { container } = render(<PollsListOngoing />, {
      wrapper: Wrapper,
    });

    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('should have an accessible description that refers to the poll title', async () => {
    render(<PollsListOngoing />, { wrapper: Wrapper });

    const activePollList = await screen.findByRole('list', {
      name: /active polls/i,
    });
    const activePollListItem = within(activePollList).getByRole('listitem', {
      name: 'Test poll open and visible',
    });

    widgetApi.mockSendRoomEvent(
      mockVote({
        content: {
          pollId: 'poll-open-visible',
          answerId: '1',
        },
        origin_server_ts: Date.now(),
      }),
    );

    expect(
      within(activePollListItem).getByRole('button', {
        name: 'More settings',
        description: 'Test poll open and visible',
      }),
    ).toBeInTheDocument();

    await expect(
      within(activePollListItem).findByRole('button', {
        name: 'See live result',
        description: 'Test poll open and visible',
      }),
    ).resolves.toBeInTheDocument();
  });

  it('should show the no running polls message', async () => {
    widgetApi.clearStateEvents({ type: 'net.nordeck.poll' });

    render(<PollsListOngoing />, { wrapper: Wrapper });

    const list = await screen.findByRole('list', { name: /active polls/i });

    expect(
      within(list).getByRole('listitem', {
        name: /there are no active polls/i,
      }),
    ).toBeInTheDocument();
  });

  it('should show the header of polls list', () => {
    render(<PollsListOngoing />, {
      wrapper: Wrapper,
    });

    expect(
      screen.getByRole('heading', { level: 3, name: /active Polls/i }),
    ).toBeInTheDocument();
  });

  it('should show List of polls', async () => {
    render(<PollsListOngoing />, { wrapper: Wrapper });
    const pollsList = await screen.findByRole('list', {
      name: /active polls/i,
    });

    expect(
      within(pollsList).getByRole('listitem', {
        name: 'Test poll open and visible',
      }),
    ).toBeInTheDocument();
    expect(
      within(pollsList).getByRole('listitem', {
        name: 'Test poll by name and visible',
      }),
    ).toBeInTheDocument();
    expect(
      within(pollsList).getByRole('listitem', {
        name: 'Test poll secret and visible',
      }),
    ).toBeInTheDocument();
    expect(
      within(pollsList).getByRole('listitem', {
        name: 'Test poll open and invisible',
      }),
    ).toBeInTheDocument();
    expect(
      within(pollsList).getByRole('listitem', {
        name: 'Test poll secret and invisible',
      }),
    ).toBeInTheDocument();
  });

  it('should show a content (header, countdown, question and description) of a poll', async () => {
    widgetApi.clearStateEvents({ type: 'net.nordeck.poll' });
    widgetApi.mockSendStateEvent(
      mockPoll({
        content: {
          startTime: new Date().toISOString(),
          endTime: DateTime.now().plus({ minute: 1 }).toISO(),
        },
      }),
    );

    render(<PollsListOngoing />, { wrapper: Wrapper });

    const pollsList = await screen.findByRole('list', {
      name: /active polls/i,
    });
    const pollItem = within(pollsList).getByRole('listitem', {
      name: 'My Title',
    });

    // poll title
    expect(within(pollItem).getByText(/My Title/i)).toBeInTheDocument();

    // poll icon type
    expect(
      within(pollItem).getByRole('listitem', { name: /Open/i }),
    ).toBeInTheDocument();
    expect(
      within(pollItem).getByRole('listitem', { name: /4 voters/i }),
    ).toBeInTheDocument();
    expect(
      within(pollItem).getByRole('listitem', { name: /0 voting persons/i }),
    ).toBeInTheDocument();

    // poll question
    expect(within(pollItem).getByText(/My Question/i)).toBeInTheDocument();

    // poll description
    expect(within(pollItem).getByText(/My Description/i)).toBeInTheDocument();

    // poll timer
    expect(within(pollItem).getByText(/ends in [\d]+/i)).toBeInTheDocument();
  });

  it('should show vote form and live result button if the poll is open, the user can vote and someone has voted', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: { events_default: 0, users_default: 100, state_default: 100 },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        origin_server_ts: new Date().getTime(),
        content: { pollId: 'poll-open-visible' },
      }),
    );

    render(<PollsListOngoing />, { wrapper: Wrapper });

    const pollsList = await screen.findByRole('list', {
      name: /active polls/i,
    });
    const pollItem = within(pollsList).getByRole('listitem', {
      name: 'Test poll open and visible',
    });

    expect(
      within(pollItem).getByRole('button', { name: /See Live Result/i }),
    ).toBeInTheDocument();

    expect(
      within(pollItem).getByRole('button', { name: /vote/i }),
    ).toBeInTheDocument();
  });

  it('should show vote form and no live result button if the poll is open, the user can vote and no one has voted', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: { events_default: 0, users_default: 100, state_default: 100 },
      }),
    );

    render(<PollsListOngoing />, { wrapper: Wrapper });

    const pollsList = await screen.findByRole('list', {
      name: /active polls/i,
    });
    const pollItem = within(pollsList).getByRole('listitem', {
      name: 'Test poll open and visible',
    });

    expect(
      within(pollItem).queryByRole('button', { name: /See Live Result/i }),
    ).not.toBeInTheDocument();

    expect(
      within(pollItem).getByRole('button', { name: /vote/i }),
    ).toBeInTheDocument();
  });

  it('should show vote form and no live result button if the poll type is secret and the user can vote', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: { events_default: 0, users_default: 100, state_default: 100 },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        origin_server_ts: new Date().getTime(),
        content: { pollId: 'poll-secret-visible' },
      }),
    );

    render(<PollsListOngoing />, { wrapper: Wrapper });

    const pollsList = await screen.findByRole('list', {
      name: /active polls/i,
    });
    const pollItem = within(pollsList).getByRole('listitem', {
      name: 'Test poll secret and visible',
    });

    expect(
      within(pollItem).queryByRole('button', { name: /See Live Result/i }),
    ).not.toBeInTheDocument();

    expect(
      within(pollItem).getByRole('button', { name: /vote/i }),
    ).toBeInTheDocument();
  });

  it('should show and submit vote form if the poll is open and user can vote', async () => {
    render(<PollsListOngoing />, { wrapper: Wrapper });

    const pollsList = await screen.findByRole('list', {
      name: /active polls/i,
    });
    const pollItem = within(pollsList).getByRole('listitem', {
      name: 'Test poll open and visible',
    });

    const radioGroup = within(pollItem).getByRole('radiogroup', {
      name: /answer/i,
    });
    expect(radioGroup).toHaveAccessibleDescription('My Question');

    const yesAnswer = within(radioGroup).getByRole('radio', { name: /yes/i });
    const noAnswer = within(radioGroup).getByRole('radio', { name: /no/i });

    expect(yesAnswer).not.toBeChecked();
    expect(noAnswer).not.toBeChecked();

    await userEvent.click(noAnswer);

    expect(yesAnswer).not.toBeChecked();
    expect(noAnswer).toBeChecked();

    await userEvent.click(yesAnswer);

    expect(yesAnswer).toBeChecked();
    expect(noAnswer).not.toBeChecked();

    const voteButton = within(pollItem).getByRole('button', { name: /vote/i });
    expect(voteButton).toHaveAccessibleDescription('My Question');
    await userEvent.click(voteButton);

    expect(widgetApi.sendRoomEvent).toBeCalledWith('net.nordeck.poll.vote', {
      pollId: 'poll-open-visible',
      answerId: '1',
      'm.relates_to': {
        event_id: '$start-event-id',
        rel_type: 'm.reference',
      },
    });
  });

  it('should show after voting view and live result button if the poll is open and the user has voted', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: { events_default: 0, users_default: 100, state_default: 100 },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        origin_server_ts: new Date().getTime(),
        sender: '@user-charlie',
        content: { answerId: '2', pollId: 'poll-open-visible' },
      }),
    );

    render(<PollsListOngoing />, { wrapper: Wrapper });

    const pollsList = await screen.findByRole('list', {
      name: /active polls/i,
    });
    const pollItem = within(pollsList).getByRole('listitem', {
      name: 'Test poll open and visible',
    });

    expect(within(pollItem).getByText(/Your Answer:/i)).toBeInTheDocument();

    expect(within(pollItem).getByText(/No/i)).toBeInTheDocument();

    expect(
      within(pollItem).getByRole('button', { name: /See Live Result/i }),
    ).toBeInTheDocument();
  });

  it('should show after voting view and disabled live result button if the poll is secret and the user has voted', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: { events_default: 0, users_default: 100, state_default: 100 },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        origin_server_ts: new Date().getTime(),
        content: { pollId: 'poll-secret-visible' },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        origin_server_ts: new Date().getTime(),
        sender: '@user-charlie',
        content: { answerId: '2', pollId: 'poll-secret-visible' },
      }),
    );

    render(<PollsListOngoing />, { wrapper: Wrapper });

    const pollsList = await screen.findByRole('list', {
      name: /active polls/i,
    });
    const pollItem = within(pollsList).getByRole('listitem', {
      name: 'Test poll secret and visible',
    });

    expect(within(pollItem).getByText(/Your Answer:/i)).toBeInTheDocument();

    expect(within(pollItem).getByText(/No/i)).toBeInTheDocument();

    expect(
      within(pollItem).getByRole('button', { name: /See Live Result/i }),
    ).toBeDisabled();
  });

  it('should show live result button if the poll is open, visible, the user is a guest and someone has voted', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: { users_default: 0, events_default: 50, state_default: 100 },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        origin_server_ts: new Date().getTime(),
        content: { pollId: 'poll-open-visible' },
      }),
    );

    render(<PollsListOngoing />, { wrapper: Wrapper });

    const pollsList = await screen.findByRole('list', {
      name: /active polls/i,
    });
    const pollItem = within(pollsList).getByRole('listitem', {
      name: 'Test poll open and visible',
    });
    expect(
      within(pollItem).queryByRole('button', { name: /vote/i }),
    ).not.toBeInTheDocument();

    expect(
      within(pollItem).queryByText(
        /You will see the result when the voting ends./i,
      ),
    ).not.toBeInTheDocument();

    expect(
      within(pollItem).getByRole('button', { name: /See Live Result/i }),
    ).toBeInTheDocument();
  });

  it('should show live result button if the poll is open, visible, the user is a guest and no one has voted', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: { users_default: 0, events_default: 50, state_default: 100 },
      }),
    );

    render(<PollsListOngoing />, { wrapper: Wrapper });

    const pollsList = await screen.findByRole('list', {
      name: /active polls/i,
    });
    const pollItem = within(pollsList).getByRole('listitem', {
      name: 'Test poll open and visible',
    });

    expect(
      within(pollItem).queryByRole('button', { name: /vote/i }),
    ).not.toBeInTheDocument();

    expect(
      within(pollItem).getByText(
        /You will see the result as soon as a first vote has been cast./i,
      ),
    ).toBeInTheDocument();

    expect(
      within(pollItem).queryByRole('button', { name: /See Live Result/i }),
    ).not.toBeInTheDocument();
  });

  it('should show live result button if the poll is open, invisible, the user is a guest and no one has voted', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: { users_default: 0, events_default: 50, state_default: 100 },
      }),
    );

    render(<PollsListOngoing />, { wrapper: Wrapper });

    const pollsList = await screen.findByRole('list', {
      name: /active polls/i,
    });
    const pollItem = within(pollsList).getByRole('listitem', {
      name: 'Test poll open and invisible',
    });

    expect(
      within(pollItem).queryByRole('button', { name: /vote/i }),
    ).not.toBeInTheDocument();

    expect(
      within(pollItem).getByText(
        /You will see the result when the voting ends./i,
      ),
    ).toBeInTheDocument();

    expect(
      within(pollItem).queryByRole('button', { name: /See Live Result/i }),
    ).not.toBeInTheDocument();
  });

  it('should show live result button if the poll is open, invisible, the user is a guest and someone has voted', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: { users_default: 0, events_default: 50 },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        origin_server_ts: new Date().getTime(),
        content: { pollId: 'poll-secret-invisible' },
      }),
    );

    render(<PollsListOngoing />, { wrapper: Wrapper });

    const pollsList = await screen.findByRole('list', {
      name: /active polls/i,
    });
    const pollItem = within(pollsList).getByRole('listitem', {
      name: 'Test poll secret and invisible',
    });

    expect(
      within(pollItem).queryByRole('button', { name: /vote/i }),
    ).not.toBeInTheDocument();

    expect(
      within(pollItem).getByText(
        /You will see the result when the voting ends./i,
      ),
    ).toBeInTheDocument();

    expect(
      within(pollItem).queryByRole('button', { name: /See Live Result/i }),
    ).not.toBeInTheDocument();
  });

  it('should show live result button if the poll is secret, visible, the user is a guest and someone has voted', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: { users_default: 0, events_default: 50 },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        origin_server_ts: new Date().getTime(),
        content: { pollId: 'poll-secret-visible' },
      }),
    );

    render(<PollsListOngoing />, { wrapper: Wrapper });

    const pollsList = await screen.findByRole('list', {
      name: /active polls/i,
    });
    const pollItem = within(pollsList).getByRole('listitem', {
      name: 'Test poll secret and visible',
    });

    expect(
      within(pollItem).queryByRole('button', { name: /vote/i }),
    ).not.toBeInTheDocument();

    expect(
      within(pollItem).getByText(
        /You will see the result as soon as a first vote has been cast./i,
      ),
    ).toBeInTheDocument();

    expect(
      within(pollItem).queryByRole('button', { name: /See Live Result/i }),
    ).not.toBeInTheDocument();
  });

  it('should show live result button if the user can create a poll, the poll is open, invisible and someone has voted', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: { users_default: 100, events_default: 50, state_default: 100 },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        origin_server_ts: new Date().getTime(),
        sender: '@user-charlie',
        content: { answerId: '1', pollId: 'poll-open-invisible' },
      }),
    );

    render(<PollsListOngoing />, { wrapper: Wrapper });

    const pollsList = await screen.findByRole('list', {
      name: /active polls/i,
    });
    const pollItem = within(pollsList).getByRole('listitem', {
      name: 'Test poll open and invisible',
    });

    expect(
      within(pollItem).queryByRole('button', { name: /vote/i }),
    ).not.toBeInTheDocument();

    expect(
      within(pollItem).queryByText(
        /You will see the result when the voting ends./i,
      ),
    ).not.toBeInTheDocument();

    expect(
      within(pollItem).getByRole('button', { name: /See Live Result/i }),
    ).not.toBeDisabled();
  });

  it('should show live result button if the user can not create poll, the poll is open, invisible and someone has voted', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: { users_default: 50, events_default: 50, state_default: 100 },
      }),
    );
    widgetApi.mockSendRoomEvent(
      mockVote({
        origin_server_ts: new Date().getTime(),
        sender: '@user-charlie',
        content: { answerId: '1', pollId: 'poll-open-invisible' },
      }),
    );

    render(<PollsListOngoing />, { wrapper: Wrapper });

    const pollsList = await screen.findByRole('list', {
      name: /active polls/i,
    });
    const pollItem = within(pollsList).getByRole('listitem', {
      name: 'Test poll open and invisible',
    });

    expect(
      within(pollItem).queryByRole('button', { name: /vote/i }),
    ).not.toBeInTheDocument();

    expect(within(pollItem).getByText(/yes/i)).toBeInTheDocument();

    expect(
      within(pollItem).getByRole('button', { name: /See Live Result/i }),
    ).toBeDisabled();
  });

  it('should show a loading state', async () => {
    widgetApi.readEventRelations.mockReturnValue(new Promise(() => {}));
    render(<PollsListOngoing />, { wrapper: Wrapper });

    const activePollList = await screen.findByRole('list', {
      name: /active polls/i,
    });
    const activePollListItem = within(activePollList).getByRole('listitem', {
      name: 'Test poll open and visible',
    });

    expect(
      within(activePollListItem).getByTestId('votesLoadingPollOngoing'),
    ).toBeInTheDocument();
  });

  it('should show an error message when votes failed to load', async () => {
    widgetApi.readEventRelations.mockRejectedValue(new Error('Some Error'));
    render(<PollsListOngoing />, { wrapper: Wrapper });

    const activePollList = await screen.findByRole('list', {
      name: /active polls/i,
    });
    const activePollListItem = within(activePollList).getByRole('listitem', {
      name: 'Test poll open and visible',
    });

    const alert = await within(activePollListItem).findByRole('status');
    expect(
      within(alert).getByText('Data could not be loaded.'),
    ).toBeInTheDocument();

    expect(
      within(activePollListItem).queryByRole('button', {
        name: 'See live result',
        description: 'Test poll open and visible',
      }),
    ).not.toBeInTheDocument();
  });

  it('should show end poll now dialog and confirm stopping', async () => {
    render(<PollsListOngoing />, { wrapper: Wrapper });

    const activePollList = await screen.findByRole('list', {
      name: /active polls/i,
    });
    const activePollListItem = within(activePollList).getByRole('listitem', {
      name: 'Test poll open and visible',
    });

    await userEvent.click(
      within(activePollListItem).getByRole('button', { name: 'More settings' }),
    );

    const menu = screen.getByRole('menu', { name: 'More settings' });

    await userEvent.click(
      within(menu).getByRole('menuitem', { name: 'End poll now' }),
    );

    const dialog = screen.getByRole('dialog', {
      name: 'End poll now',
      description:
        'Are you sure you want to end the poll “Test poll open and visible”? All existing votes will be registered and no further voting will be possible.',
    });
    expect(
      within(dialog).getByText(
        'Are you sure you want to end the poll “Test poll open and visible”? All existing votes will be registered and no further voting will be possible.',
      ),
    ).toBeInTheDocument();

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'End now' }),
    );

    await waitFor(() => {
      expect(dialog).not.toBeInTheDocument();
    });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.poll',
      mockPoll({
        state_key: 'poll-open-visible',
        content: {
          title: 'Test poll open and visible',
          startTime: expect.any(String),
          endTime: expect.any(String),
          startEventId: '$start-event-id',
        },
      }).content,
      { stateKey: 'poll-open-visible' },
    );

    await waitFor(() => {
      expect(activePollListItem).not.toBeInTheDocument();
    });
  });

  it('should show end poll now dialog and cancel stopping', async () => {
    render(<PollsListOngoing />, { wrapper: Wrapper });

    const activePollList = await screen.findByRole('list', {
      name: /active polls/i,
    });
    const activePollListItem = within(activePollList).getByRole('listitem', {
      name: 'Test poll open and visible',
    });

    await userEvent.click(
      within(activePollListItem).getByRole('button', { name: 'More settings' }),
    );

    const menu = screen.getByRole('menu', { name: 'More settings' });

    await userEvent.click(
      within(menu).getByRole('menuitem', { name: 'End poll now' }),
    );

    const dialog = screen.getByRole('dialog', {
      name: 'End poll now',
      description:
        'Are you sure you want to end the poll “Test poll open and visible”? All existing votes will be registered and no further voting will be possible.',
    });
    expect(
      within(dialog).getByText(
        'Are you sure you want to end the poll “Test poll open and visible”? All existing votes will be registered and no further voting will be possible.',
      ),
    ).toBeInTheDocument();

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Cancel' }),
    );

    expect(widgetApi.sendStateEvent).not.toBeCalled();
    expect(activePollListItem).toBeInTheDocument();
  });

  it('should hide the option to end polls now for non-moderators', async () => {
    render(<PollsListOngoing />, { wrapper: Wrapper });

    const activePollList = await screen.findByRole('list', {
      name: /active polls/i,
    });
    const activePollListItem = within(activePollList).getByRole('listitem', {
      name: 'Test poll open and visible',
    });

    const moreSettingsButton = within(activePollListItem).getByRole('button', {
      name: 'More settings',
    });

    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({ content: { users_default: 0 } }),
    );

    await waitFor(() => {
      expect(moreSettingsButton).not.toBeInTheDocument();
    });
  });
});
