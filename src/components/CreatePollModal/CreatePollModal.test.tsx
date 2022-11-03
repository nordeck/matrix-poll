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
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { Subject } from 'rxjs';
import { mockPoll } from '../../lib/testUtils';
import { createStore } from '../../store';
import { CreatePollModal } from './CreatePollModal';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<CreatePollModal>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const store = useMemo(() => createStore({ widgetApi }), []);
      return (
        <WidgetApiMockProvider value={widgetApi}>
          <Provider store={store}>{children}</Provider>
        </WidgetApiMockProvider>
      );
    };
  });

  it('should create a poll on submit', async () => {
    const subject = new Subject<string>();
    widgetApi.observeModalButtons.mockReturnValue(subject.asObservable());

    render(<CreatePollModal />, { wrapper: Wrapper });

    await userEvent.type(
      screen.getByRole('textbox', { name: /title/i }),
      'Poll Title'
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: /question/i }),
      'Poll Question'
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Yes | No' }));

    subject.next('net.nordeck.poll.submit');

    await waitFor(() => {
      expect(widgetApi.closeModal).toBeCalledWith({
        poll: mockPoll({
          content: {
            title: 'Poll Title',
            description: '',
            question: 'Poll Question',
            groups: undefined,
          },
        }).content,
      });
    });
  });

  it('should disable submission if input is invalid', async () => {
    render(<CreatePollModal />, { wrapper: Wrapper });

    await userEvent.type(
      screen.getByRole('textbox', { name: /title/i }),
      'Poll Title'
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: /question/i }),
      'Poll Question'
    );

    expect(widgetApi.setModalButtonEnabled).toHaveBeenLastCalledWith(
      'net.nordeck.poll.submit',
      true
    );

    // should disable button when required fields are missing
    await userEvent.clear(screen.getByRole('textbox', { name: /title/i }));

    expect(widgetApi.setModalButtonEnabled).toHaveBeenLastCalledWith(
      'net.nordeck.poll.submit',
      false
    );
  });

  it('should abort the dialog when the cancel button is clicked', async () => {
    const subject = new Subject<string>();
    widgetApi.observeModalButtons.mockReturnValue(subject.asObservable());

    render(<CreatePollModal />, { wrapper: Wrapper });

    subject.next('net.nordeck.poll.cancel');

    await waitFor(() => {
      expect(widgetApi.closeModal).toBeCalledWith();
    });
  });
});
