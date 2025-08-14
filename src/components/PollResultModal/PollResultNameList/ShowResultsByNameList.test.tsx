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
import { render, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mockPoll, mockRoomMember, mockVote } from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { ShowResultsByNameList } from './ShowResultsByNameList';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<ShowResultsByNameList/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-0',
        content: {
          startTime: new Date().toISOString(),
          groups: undefined,
        },
      }),
    );

    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-alice:example.com',
        content: { displayname: 'Alice' },
      }),
    );
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-bob:example.com',
        content: { displayname: 'Bob' },
      }),
    );

    widgetApi.mockSendRoomEvent(
      mockVote({
        sender: '@user-alice:example.com',
        origin_server_ts: Date.now(),
        content: {
          pollId: 'poll-0',
          answerId: '1',
        },
      }),
    );

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const store = useMemo(() => createStore({ widgetApi }), []);
      return <Provider store={store}>{children}</Provider>;
    };
  });

  it('should not explode if poll does not exist', () => {
    const { container } = render(
      <ShowResultsByNameList pollId="another-poll" />,
      { wrapper: Wrapper },
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <>
        <span id="label">Voting persons</span>
        <ShowResultsByNameList labelId="label" pollId="poll-0" />
      </>,
      { wrapper: Wrapper },
    );

    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('should render the poll results', async () => {
    render(
      <>
        <span id="label">Voting persons</span>
        <ShowResultsByNameList labelId="label" pollId="poll-0" />
      </>,
      { wrapper: Wrapper },
    );

    const list = await screen.findByRole('list', { name: /Voting persons/i });
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);

    const aliceListItem = within(list).getByRole('listitem', {
      name: /alice/i,
    });
    within(aliceListItem).getByText(/alice/i);
    within(aliceListItem).getByText(/yes/i);
  });

  it('should render invalid votes if finished', async () => {
    render(
      <>
        <span id="label">Voting persons</span>
        <ShowResultsByNameList isFinished labelId="label" pollId="poll-0" />
      </>,
      { wrapper: Wrapper },
    );

    const list = await screen.findByRole('list', { name: /Voting persons/i });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);

    const aliceListItem = within(list).getByRole('listitem', {
      name: /alice/i,
    });
    within(aliceListItem).getByText(/alice/i);
    within(aliceListItem).getByText(/yes/i);

    const bobListItem = within(list).getByRole('listitem', { name: /bob/i });
    within(bobListItem).getByText(/bob/i);
    within(bobListItem).getByText(/invalid/i);
  });
});
