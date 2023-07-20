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
import { axe } from 'jest-axe';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { mockPoll, mockPollSettings } from '../../lib/testUtils';
import { PollType } from '../../model';
import { createStore } from '../../store';
import { PollsPdfDocumentationSettings } from './PollsPdfDocumentationSettings';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

afterEach(() => {
  jest.useRealTimers();
});

describe('<PollsPdfDocumentationSettings>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    widgetApi.mockSendStateEvent(
      mockPoll({
        content: {
          pollType: PollType.Open,
          startTime: '2020-01-01T03:33:55Z',
        },
      }),
    );

    widgetApi.mockSendStateEvent(mockPollSettings());

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const store = useMemo(() => createStore({ widgetApi }), []);
      return <Provider store={store}>{children}</Provider>;
    };
  });

  it('should render without exploding', () => {
    render(<PollsPdfDocumentationSettings />, {
      wrapper: Wrapper,
    });

    const form = screen.getByRole('form', { name: /deactivate pdf/i });
    expect(
      within(form).getByRole('heading', { level: 4, name: /deactivate pdf/i }),
    ).toBeInTheDocument();

    expect(
      within(form).getByRole('spinbutton', {
        name: 'Deactivate after weeks (required)',
        description: '',
      }),
    ).toBeInTheDocument();

    const button = within(form).getByRole('button', {
      name: 'Set deactivation time',
    });
    expect(button).toHaveAttribute('type', 'submit');

    const nowButton = within(form).getByRole('button', {
      name: /deactivate pdf now/i,
    });
    expect(nowButton).toHaveAttribute('type', 'button');
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<PollsPdfDocumentationSettings />, {
      wrapper: Wrapper,
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should render alert', async () => {
    widgetApi.mockSendStateEvent(
      mockPollSettings({
        content: {
          pdfButtonDisabledAfter: '2020-01-14T09:00:00Z',
        },
      }),
    );

    render(<PollsPdfDocumentationSettings />, {
      wrapper: Wrapper,
    });

    const form = screen.getByRole('form', { name: /deactivate pdf/i });

    const alert = await within(form).findByRole('status');
    expect(
      within(alert).getByText(/pdf will be deactivated/i),
    ).toBeInTheDocument();
    expect(
      within(alert).getByText(
        /the download of the pdf document will be deactivated on january 14, 2020(,| at) 9:00 am/i,
      ),
    ).toBeInTheDocument();
  });

  it('should disable PDF download', async () => {
    const userEventAT = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T10:00:00Z'));

    render(<PollsPdfDocumentationSettings />, {
      wrapper: Wrapper,
    });

    const form = screen.getByRole('form', { name: /deactivate pdf/i });

    await userEventAT.click(
      within(form).getByRole('button', { name: /deactivate pdf now/i }),
    );

    const deleteModal = screen.getByRole('dialog', {
      name: /deactivate pdf/i,
    });

    expect(deleteModal).toHaveAccessibleDescription(
      /you are about to deactivate the pdf download/i,
    );

    expect(
      within(deleteModal).getByRole('button', { name: 'Cancel' }),
    ).toBeInTheDocument();

    await userEventAT.click(
      within(deleteModal).getByRole('button', { name: 'Deactivate' }),
    );

    await waitFor(() => {
      expect(deleteModal).not.toBeInTheDocument();
    });

    expect(widgetApi.sendStateEvent).toBeCalledTimes(1);
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.poll.settings',
      { pdfButtonDisabledAfter: '2020-01-01T10:00:00.000Z' },
      { stateKey: '!room-id' },
    );
  });

  it('should set PDF expiration date', async () => {
    const userEventAT = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T10:00:00Z'));

    render(<PollsPdfDocumentationSettings />, {
      wrapper: Wrapper,
    });

    const form = screen.getByRole('form', { name: /deactivate pdf/i });

    const durationInput = within(form).getByRole('spinbutton', {
      name: 'Deactivate after weeks (required)',
    });

    await userEventAT.type(durationInput, '3{enter}', {
      initialSelectionStart: 0,
      initialSelectionEnd: 1,
    });

    const alert = await within(form).findByRole('status');
    expect(
      within(alert).getByText(
        /the download of the pdf document will be deactivated on january 22, 2020(,| at) 10:00 am/i,
      ),
    ).toBeInTheDocument();

    expect(widgetApi.sendStateEvent).toBeCalledTimes(1);
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.poll.settings',
      { pdfButtonDisabledAfter: '2020-01-22T10:00:00.000Z' },
      { stateKey: '!room-id' },
    );
  });

  it('should show an error and disable the button with an invalid negative input', async () => {
    render(<PollsPdfDocumentationSettings />, {
      wrapper: Wrapper,
    });

    const form = screen.getByRole('form', { name: /deactivate pdf/i });

    const durationInput = within(form).getByRole('spinbutton', {
      name: 'Deactivate after weeks (required)',
    });

    await userEvent.type(durationInput, '-', {
      initialSelectionStart: 0,
      initialSelectionEnd: 0,
    });

    expect(durationInput).toHaveValue(-2);

    expect(durationInput).toHaveAccessibleDescription('A duration is required');
    expect(durationInput).toBeInvalid();
    expect(
      within(form).getByRole('button', { name: 'Set deactivation time' }),
    ).toBeDisabled();
  });
});
