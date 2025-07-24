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
import { mockGroup } from '../../lib/testUtils';
import { GroupAvatar } from './GroupAvatar';

describe('<GroupAvatar/>', () => {
  it('should not explode', () => {
    render(<GroupAvatar group={mockGroup().content} />);

    expect(screen.getByTestId('avatarGROUP 0')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('should have not accessibility violations', async () => {
    const { container } = render(<GroupAvatar group={mockGroup().content} />);

    expect(await axe.run(container)).toHaveNoViolations();
  });
});
