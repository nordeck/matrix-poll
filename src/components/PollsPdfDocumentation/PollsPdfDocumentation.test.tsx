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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { mockPoll, mockPollSettings } from '../../lib/testUtils';
import { PollType } from '../../model';
import { createStore } from '../../store';
import { PollsPdfDocumentation } from './PollsPdfDocumentation';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<PollsPdfDocumentation>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    widgetApi.mockSendStateEvent(
      mockPoll({
        content: {
          pollType: PollType.Open,
          startTime: '2020-01-01T03:33:55Z',
          endTime: '2020-01-01T03:34:55Z',
        },
      })
    );

    widgetApi.mockSendStateEvent(mockPollSettings());

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const store = useMemo(() => createStore({ widgetApi }), []);
      return (
        <WidgetApiMockProvider value={widgetApi}>
          <Provider store={store}>{children}</Provider>
        </WidgetApiMockProvider>
      );
    };
  });

  it('should render without exploding', async () => {
    render(<PollsPdfDocumentation />, { wrapper: Wrapper });

    await expect(
      screen.findByRole('button', { name: 'Generate PDF documentation' })
    ).resolves.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', {
        name: /more settings/i,
        expanded: false,
      }),
      { skipHover: true }
    );

    expect(
      screen.getByRole('heading', { name: /deactivate pdf/i })
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<PollsPdfDocumentation />, {
      wrapper: Wrapper,
    });

    await expect(
      screen.findByRole('button', { name: 'Generate PDF documentation' })
    ).resolves.toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations, with open settings', async () => {
    const { container } = render(<PollsPdfDocumentation />, {
      wrapper: Wrapper,
    });

    await userEvent.click(
      await screen.findByRole('button', {
        name: /more settings/i,
        expanded: false,
      }),
      { skipHover: true }
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
