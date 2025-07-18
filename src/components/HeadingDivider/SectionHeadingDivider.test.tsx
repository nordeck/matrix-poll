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
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { SectionHeadingDivider } from './SectionHeadingDivider';

describe('<SectionHeadingDivider/>', () => {
  it('should render without exploding', async () => {
    render(<SectionHeadingDivider count={2} title="Polls" />);

    expect(
      screen.getByRole('heading', { level: 3, name: /polls/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should skip the count', async () => {
    render(<SectionHeadingDivider title="Polls" />);

    expect(
      screen.getByRole('heading', { level: 3, name: /polls/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <SectionHeadingDivider count={2} title="Polls" />,
    );

    expect(await axe.run(container)).toHaveNoViolations();
  });
});
