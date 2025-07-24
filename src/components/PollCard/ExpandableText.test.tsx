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

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LinesEllipsis from 'react-lines-ellipsis';
import { afterEach, describe, expect, it, Mock, vi } from 'vitest';
import { ExpandableText } from './ExpandableText';

vi.mock('react-lines-ellipsis', async (importOriginal) => ({
  ...(await importOriginal()),
  default: vi.fn(),
}));

describe('ExpandableText', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should render without exploding', () => {
    (LinesEllipsis as Mock).mockImplementation(({ text }) => text);

    render(<ExpandableText text="A short text" />);

    expect(screen.getByText(/A short text/)).toBeInTheDocument();
  });

  it('should show ellipsis, collapse, and expand', async () => {
    (LinesEllipsis as Mock).mockImplementation(({ ellipsis }) => ellipsis);

    render(<ExpandableText text="A short text" />);

    expect(screen.queryByText(/A short text/)).not.toBeInTheDocument();
    expect(screen.getByText('...')).toBeInTheDocument();

    const readMoreButton = screen.getByRole('button', {
      name: /read more/i,
      expanded: false,
    });
    expect(readMoreButton).toBeInTheDocument();

    // expand
    await userEvent.click(readMoreButton);

    expect(screen.getByText(/A short text/)).toBeInTheDocument();
    expect(screen.queryByText('...')).not.toBeInTheDocument();

    const readLessButton = screen.getByRole('button', {
      name: /read less/i,
      expanded: true,
    });
    expect(readLessButton).toBeInTheDocument();

    // collapse
    await userEvent.click(readLessButton);

    expect(screen.queryByText(/A short text/)).not.toBeInTheDocument();
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
