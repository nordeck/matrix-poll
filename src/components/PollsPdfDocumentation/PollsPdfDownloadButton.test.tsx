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
import { createStore } from '../../store';
import { PollsPdfDownloadButton } from './PollsPdfDownloadButton';

// The pdf library doesn't work in test, so we mock pdf generation completely
jest.mock('./pdf', () => ({ createPollPdf: jest.fn() }));

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<PollsPdfDownloadButton/>', () => {
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

    jest.mocked(URL.createObjectURL).mockReturnValue('blob:url');
  });

  it('should render without exploding', () => {
    render(<PollsPdfDownloadButton />, { wrapper: Wrapper });

    expect(
      screen.getByRole('button', { name: 'Generate PDF documentation' })
    ).toBeInTheDocument();
  });

  it('should open dialog', async () => {
    render(<PollsPdfDownloadButton />, { wrapper: Wrapper });

    await userEvent.click(
      screen.getByRole('button', { name: 'Generate PDF documentation' })
    );

    const dialog = screen.getByRole('dialog', { name: 'Download PDF' });

    await userEvent.click(
      await within(dialog).findByRole('link', { name: 'Download' })
    );

    await waitFor(() => {
      expect(dialog).not.toBeInTheDocument();
    });
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<PollsPdfDownloadButton />, {
      wrapper: Wrapper,
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
