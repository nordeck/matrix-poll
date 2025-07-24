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
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mockRoomMember } from '../../../lib/testUtils';
import { createStore } from '../../../store';
import { CreateGroupModal } from './CreateGroupModal';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<CreateGroupModal>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    widgetApi.mockSendStateEvent(mockRoomMember());
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: 'user-bob',
        event_id: 'event-id-1',
        content: { displayname: 'Bob', avatar_url: undefined },
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
    const { container } = render(<CreateGroupModal />, { wrapper: Wrapper });

    expect(await axe.run(container)).toHaveNoViolations();
  });

  it('should create a group', async () => {
    const subject = new Subject<string>();
    widgetApi.observeModalButtons.mockReturnValue(subject.asObservable());

    render(<CreateGroupModal />, { wrapper: Wrapper });

    await userEvent.type(
      screen.getByRole('textbox', { name: /group title/i }),
      'My Group',
    );

    await userEvent.click(
      screen.getByRole('combobox', {
        expanded: false,
        name: /Assign delegate/i,
      }),
    );
    await userEvent.click(await screen.findByRole('option', { name: /bob/i }));

    expect(widgetApi.setModalButtonEnabled).toHaveBeenLastCalledWith(
      'net.nordeck.create.group.submit',
      true,
    );

    subject.next('net.nordeck.create.group.submit');

    await waitFor(() => {
      expect(widgetApi.closeModal).toBeCalledWith({
        group: {
          abbreviation: 'My Group',
          color: '#999999',
          members: {
            'user-bob': {
              memberRole: 'delegate',
            },
          },
        },
      });
    });
  });

  it('should disable submit button if group is invalid', async () => {
    const subject = new Subject<string>();
    widgetApi.observeModalButtons.mockReturnValue(subject.asObservable());

    render(<CreateGroupModal />, { wrapper: Wrapper });

    expect(widgetApi.setModalButtonEnabled).toHaveBeenLastCalledWith(
      'net.nordeck.create.group.submit',
      false,
    );

    const textBox = screen.getByRole('textbox', { name: /group title/i });

    await userEvent.type(textBox, 'My Group');

    expect(widgetApi.setModalButtonEnabled).toHaveBeenLastCalledWith(
      'net.nordeck.create.group.submit',
      true,
    );

    await userEvent.clear(textBox);

    expect(widgetApi.setModalButtonEnabled).toHaveBeenLastCalledWith(
      'net.nordeck.create.group.submit',
      false,
    );
  });

  it('should abort the dialog when the cancel button is clicked', async () => {
    const subject = new Subject<string>();
    widgetApi.observeModalButtons.mockReturnValue(subject.asObservable());

    render(<CreateGroupModal />, { wrapper: Wrapper });

    subject.next('net.nordeck.create.group.cancel');

    await waitFor(() => {
      expect(widgetApi.closeModal).toBeCalledWith();
    });
  });
});
