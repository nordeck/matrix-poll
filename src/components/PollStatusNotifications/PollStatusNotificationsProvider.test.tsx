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

import { render, screen, within } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ComponentType, PropsWithChildren } from 'react';
import {
  PollStatusNotificationsProvider,
  useNotifications,
} from './PollStatusNotificationsProvider';

afterEach(() => jest.useRealTimers());

describe('<PollStatusNotificationsProvider/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;
  let Component: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    Component = () => {
      const { showNotification } = useNotifications();

      return (
        <>
          <button
            // eslint-disable-next-line react/jsx-no-bind
            onClick={() => showNotification('info', 'First Message')}
          >
            First
          </button>
          <button
            // eslint-disable-next-line react/jsx-no-bind
            onClick={() => showNotification('info', 'Second Message')}
          >
            Second
          </button>
        </>
      );
    };
    Wrapper = ({ children }: PropsWithChildren<{}>) => (
      <PollStatusNotificationsProvider>
        {children}
      </PollStatusNotificationsProvider>
    );
  });

  it('should provide context', () => {
    const { result } = renderHook(useNotifications, { wrapper: Wrapper });

    expect(typeof result.current.showNotification).toMatch('function');
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<Component />, { wrapper: Wrapper });

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations, when displaying notifications', async () => {
    const { container } = render(<Component />, { wrapper: Wrapper });

    const log = screen.getByRole('log');

    // use fake timers to display the message
    jest.useFakeTimers();

    await userEvent.click(screen.getByRole('button', { name: 'First' }), {
      advanceTimers: jest.advanceTimersByTime,
    });
    jest.advanceTimersByTime(1000);

    // use real timers to make axe work
    jest.useRealTimers();

    expect(within(log).getByText('First Message')).toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should inject a new notification container', () => {
    render(<Component />, { wrapper: Wrapper });

    const log = screen.getByRole('log');

    expect(log).toHaveAttribute('aria-atomic', 'false');
    expect(log).toBeEmptyDOMElement();
  });

  it('should add and remove a new notification with a delay', async () => {
    jest.useFakeTimers();

    render(<Component />, { wrapper: Wrapper });

    const log = screen.getByRole('log');

    await userEvent.click(screen.getByRole('button', { name: 'First' }), {
      advanceTimers: jest.advanceTimersByTime,
    });

    expect(log).toBeEmptyDOMElement();

    jest.advanceTimersByTime(1000);

    const message = within(log).getByText('First Message');

    jest.advanceTimersByTime(9000);

    expect(message).not.toBeInTheDocument();
    expect(log).toBeEmptyDOMElement();
  });

  it('should show multiple notifications', async () => {
    jest.useFakeTimers();

    render(<Component />, { wrapper: Wrapper });

    const log = screen.getByRole('log');

    await userEvent.click(screen.getByRole('button', { name: 'First' }), {
      advanceTimers: jest.advanceTimersByTime,
    });
    await userEvent.click(screen.getByRole('button', { name: 'Second' }), {
      advanceTimers: jest.advanceTimersByTime,
    });

    jest.advanceTimersByTime(1000);

    const message1 = within(log).getByText('First Message');
    const message2 = within(log).getByText('Second Message');

    jest.advanceTimersByTime(9000);

    expect(message1).not.toBeInTheDocument();
    expect(message2).not.toBeInTheDocument();
    expect(log).toBeEmptyDOMElement();
  });

  it('should not duplicate existing notifications', async () => {
    jest.useFakeTimers();

    render(<Component />, { wrapper: Wrapper });

    const log = screen.getByRole('log');

    await userEvent.click(screen.getByRole('button', { name: 'First' }), {
      advanceTimers: jest.advanceTimersByTime,
    });
    jest.advanceTimersByTime(500);

    await userEvent.click(screen.getByRole('button', { name: 'First' }), {
      advanceTimers: jest.advanceTimersByTime,
    });
    jest.advanceTimersByTime(1000);

    expect(log.textContent).toBe('First Message');
  });
});
