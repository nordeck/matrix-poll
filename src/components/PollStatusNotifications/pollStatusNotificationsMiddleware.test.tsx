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
import { waitFor } from '@testing-library/react';
import { Duration } from 'luxon';
import { mockPoll } from '../../lib/testUtils';
import { createStore, pollApi } from '../../store';
import {
  createPollStatusNotificationsMiddleware,
  normalizeDuration,
} from './pollStatusNotificationsMiddleware';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

afterEach(() => jest.useRealTimers());

describe('pollStatusNotificationsMiddleware', () => {
  const showNotification = jest.fn();

  it('should notify if a poll was started', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2022-08-11T09:53:15Z'));

    widgetApi.mockSendStateEvent(mockPoll());

    const middleware = createPollStatusNotificationsMiddleware({
      showNotification,
    });

    const store = createStore({ widgetApi, middlewares: [middleware] });

    // trigger the middleware with a dummy action to load the polls
    store.dispatch({ type: 'initialize' });

    await waitFor(() => {
      expect(
        pollApi.endpoints.getPolls.select()(store.getState()).isSuccess
      ).toBe(true);
    });

    widgetApi.mockSendStateEvent(
      mockPoll({
        content: {
          startTime: '2022-08-11T09:53:00Z',
          endTime: '2022-08-11T09:54:00Z',
        },
      })
    );

    await waitFor(() => {
      expect(showNotification).toBeCalledWith(
        'info',
        'The poll “My Title” was started and ends in 45 seconds.'
      );
    });

    expect(showNotification).toBeCalledTimes(1);
  });

  it('should not notify if a poll was already started', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2022-08-11T09:53:15Z'));

    widgetApi.mockSendStateEvent(
      mockPoll({ content: { startTime: '2022-08-11T09:53:00Z' } })
    );

    const middleware = createPollStatusNotificationsMiddleware({
      showNotification,
    });

    const store = createStore({ widgetApi, middlewares: [middleware] });

    // trigger the middleware with a dummy action to load the polls
    store.dispatch({ type: 'initialize' });

    await waitFor(() => {
      expect(
        pollApi.endpoints.getPolls.select()(store.getState()).isSuccess
      ).toBe(true);
    });

    expect(showNotification).not.toBeCalled();
  });

  it('should notify if a poll reached half its time', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2022-08-11T09:53:15Z'));

    widgetApi.mockSendStateEvent(
      mockPoll({
        content: {
          startTime: '2022-08-11T09:53:00Z',
          endTime: '2022-08-11T09:54:00Z',
        },
      })
    );

    const middleware = createPollStatusNotificationsMiddleware({
      showNotification,
    });

    const store = createStore({ widgetApi, middlewares: [middleware] });

    // trigger the middleware with a dummy action to load the polls
    store.dispatch({ type: 'initialize' });

    await waitFor(() => {
      expect(
        pollApi.endpoints.getPolls.select()(store.getState()).isSuccess
      ).toBe(true);
    });

    jest.advanceTimersByTime(15_000);

    expect(showNotification).toBeCalledWith(
      'info',
      'The poll “My Title” ends in 30 seconds.'
    );
    expect(showNotification).toBeCalledTimes(1);
  });

  it('should notify if a poll reached half when it already runs', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2022-08-11T09:53:30Z'));

    widgetApi.mockSendStateEvent(
      mockPoll({
        content: {
          startTime: '2022-08-11T09:53:00Z',
          endTime: '2022-08-11T09:54:00Z',
        },
      })
    );

    const middleware = createPollStatusNotificationsMiddleware({
      showNotification,
    });

    const store = createStore({ widgetApi, middlewares: [middleware] });

    // trigger the middleware with a dummy action to load the polls
    store.dispatch({ type: 'initialize' });

    await waitFor(() => {
      expect(
        pollApi.endpoints.getPolls.select()(store.getState()).isSuccess
      ).toBe(true);
    });

    expect(showNotification).toBeCalledWith(
      'info',
      'The poll “My Title” ends in 30 seconds.'
    );
    expect(showNotification).toBeCalledTimes(1);
  });

  it('should notify if a poll will end soon', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2022-08-11T09:53:15Z'));

    widgetApi.mockSendStateEvent(
      mockPoll({
        content: {
          startTime: '2022-08-11T09:53:00Z',
          endTime: '2022-08-11T09:54:00Z',
        },
      })
    );

    const middleware = createPollStatusNotificationsMiddleware({
      showNotification,
    });

    const store = createStore({ widgetApi, middlewares: [middleware] });

    // trigger the middleware with a dummy action to load the polls
    store.dispatch({ type: 'initialize' });

    await waitFor(() => {
      expect(
        pollApi.endpoints.getPolls.select()(store.getState()).isSuccess
      ).toBe(true);
    });

    jest.advanceTimersByTime(30_000);

    expect(showNotification).toBeCalledWith(
      'info',
      'The poll “My Title” ends in 15 seconds.'
    );
    expect(showNotification).toBeCalledTimes(2);
  });

  it('should notify if a poll will end soon when it already runs', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2022-08-11T09:53:45Z'));

    widgetApi.mockSendStateEvent(
      mockPoll({
        content: {
          startTime: '2022-08-11T09:53:00Z',
          endTime: '2022-08-11T09:54:00Z',
        },
      })
    );

    const middleware = createPollStatusNotificationsMiddleware({
      showNotification,
    });

    const store = createStore({ widgetApi, middlewares: [middleware] });

    // trigger the middleware with a dummy action to load the polls
    store.dispatch({ type: 'initialize' });

    await waitFor(() => {
      expect(
        pollApi.endpoints.getPolls.select()(store.getState()).isSuccess
      ).toBe(true);
    });

    expect(showNotification).toBeCalledWith(
      'info',
      'The poll “My Title” ends in 15 seconds.'
    );
    expect(showNotification).toBeCalledTimes(1);
  });

  it('should notify if a poll ended', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2022-08-11T09:53:15Z'));

    widgetApi.mockSendStateEvent(
      mockPoll({
        content: {
          startTime: '2022-08-11T09:53:00Z',
          endTime: '2022-08-11T09:54:00Z',
        },
      })
    );

    const middleware = createPollStatusNotificationsMiddleware({
      showNotification,
    });

    const store = createStore({ widgetApi, middlewares: [middleware] });

    // trigger the middleware with a dummy action to load the polls
    store.dispatch({ type: 'initialize' });

    await waitFor(() => {
      expect(
        pollApi.endpoints.getPolls.select()(store.getState()).isSuccess
      ).toBe(true);
    });

    jest.advanceTimersByTime(45_000);

    expect(showNotification).toBeCalledWith(
      'info',
      'The poll “My Title” ended.'
    );
    expect(showNotification).toBeCalledTimes(3);
  });
});

describe('normalizeDuration', () => {
  it.each`
    duration                                    | expected
    ${10 * 1000}                                | ${'10 seconds'}
    ${10 * 1000 + 15}                           | ${'10 seconds'}
    ${10 * 1000 + 750}                          | ${'11 seconds'}
    ${59 * 1000}                                | ${'59 seconds'}
    ${60 * 1000}                                | ${'1 minute'}
    ${90 * 1000}                                | ${'1 minute and 30 seconds'}
    ${120 * 1000}                               | ${'2 minutes'}
    ${35 * 60 * 1000 + 7 * 1000}                | ${'35 minutes and 7 seconds'}
    ${59 * 60 * 1000 + 59 * 1000}               | ${'59 minutes and 59 seconds'}
    ${1 * 60 * 60 * 1000}                       | ${'1 hour'}
    ${2 * 60 * 60 * 1000}                       | ${'2 hours'}
    ${3 * 60 * 60 * 1000 + 14 * 60 * 1000}      | ${'3 hours and 14 minutes'}
    ${3 * 60 * 60 * 1000 + 14 * 60 * 1000 + 15} | ${'3 hours and 14 minutes'}
    ${24 * 60 * 60 * 1000}                      | ${'24 hours'}
    ${24 * 60 * 60 * 1000 + 15 * 1000}          | ${'24 hours'}
  `(
    'should normalizeDuration $duration milliseconds',
    ({ duration, expected }) => {
      expect(
        normalizeDuration(Duration.fromMillis(duration)).toHuman({
          listStyle: 'long',
        })
      ).toEqual(expected);
    }
  );
});
