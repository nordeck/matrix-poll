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

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { PollsPdfDialogContent } from './PollsPdfDialogContent';

describe('<PollsPdfDialogContent>', () => {
  const onClose = jest.fn();

  it('should provide download button', async () => {
    render(
      <PollsPdfDialogContent
        onClose={onClose}
        value={{ url: 'https://example.com/test.pdf', roomName: 'My Room' }}
      />
    );

    const downloadButton = screen.getByRole('link', {
      name: 'Download',
      description: /not accessible/i,
    });

    expect(downloadButton).toBeEnabled();
    expect(downloadButton).toHaveAttribute(
      'href',
      'https://example.com/test.pdf'
    );
    expect(downloadButton).toHaveAttribute('download', 'My Room.pdf');

    await userEvent.click(downloadButton);

    expect(onClose).toBeCalled();
  });

  it('should show loading indicator', () => {
    render(<PollsPdfDialogContent loading onClose={onClose} />);

    expect(
      screen.getByRole('button', {
        name: 'Download',
      })
    ).toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.getByRole('progressbar', { name: 'Download' })
    ).toBeInTheDocument();
  });

  it('should show error', () => {
    render(<PollsPdfDialogContent error onClose={onClose} />);

    expect(
      screen.getByRole('button', {
        name: 'Download',
      })
    ).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Something went wrong while generating the PDF documentation.'
    );
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <PollsPdfDialogContent
        onClose={onClose}
        value={{ url: 'https://example.com/test.pdf', roomName: 'My Room' }}
      />
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations while loading', async () => {
    const { container } = render(
      <PollsPdfDialogContent loading onClose={onClose} />
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should have no accessibility violations on error', async () => {
    const { container } = render(
      <PollsPdfDialogContent error onClose={onClose} />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
