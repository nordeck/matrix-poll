/*
 * Copyright 2023 Nordeck IT + Consulting GmbH
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
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { createStore } from '../../../store';
import { PollsPdfDialog } from './PollsPdfDialog';

// The pdf library doesn't work in test, so we mock pdf generation completely
jest.mock('../pdf', () => ({ createPollPdf: jest.fn() }));

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<PollsPdfDialog>', () => {
  const onClose = jest.fn();
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

  it('should have no accessibility violations', async () => {
    const { container } = render(<PollsPdfDialog onClose={onClose} open />, {
      wrapper: Wrapper,
    });

    const dialog = screen.getByRole('dialog', { name: 'Download PDF' });

    await expect(
      within(dialog).findByRole('link', { name: 'Download' })
    ).resolves.toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should render without exploding', async () => {
    render(<PollsPdfDialog onClose={onClose} open />, {
      wrapper: Wrapper,
    });

    const dialog = screen.getByRole('dialog', {
      name: 'Download PDF',
      description:
        'The PDF documentation is being generated and can be downloaded once it is ready.',
    });

    await expect(
      within(dialog).findByRole('link', { name: 'Download' })
    ).resolves.toBeInTheDocument();
  });

  it('should close dialog', async () => {
    render(<PollsPdfDialog onClose={onClose} open />, {
      wrapper: Wrapper,
    });

    const dialog = screen.getByRole('dialog', { name: 'Download PDF' });

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Close' })
    );

    expect(onClose).toBeCalled();
  });

  it('should close on download', async () => {
    render(<PollsPdfDialog onClose={onClose} open />, {
      wrapper: Wrapper,
    });

    const dialog = screen.getByRole('dialog', { name: 'Download PDF' });
    const downloadLink = await within(dialog).findByRole('link', {
      name: 'Download',
    });

    await userEvent.click(downloadLink, { skipHover: true });

    expect(onClose).toBeCalled();
  });
});
