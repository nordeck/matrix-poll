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
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { PollsListContainer } from './PollsListContainer';
import { PollsListItem } from './PollsListItem';

describe('<PollsListContainer/>', () => {
  it('should render without exploding', async () => {
    render(
      <>
        <h1 id="heading">Polls</h1>
        <PollsListContainer aria-labelledby="heading">
          <PollsListItem aria-labelledby="poll-1">
            <div id="poll-1">Poll 1</div>
          </PollsListItem>
          <PollsListItem aria-labelledby="poll-2">
            <div id="poll-2">Poll 2</div>
          </PollsListItem>
        </PollsListContainer>
      </>,
    );

    const list = screen.getByRole('list', { name: /polls/i });

    expect(
      within(list).getByRole('listitem', { name: /poll 1/i }),
    ).toBeInTheDocument();
    expect(
      within(list).getByRole('listitem', { name: /poll 2/i }),
    ).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <PollsListContainer>
        <PollsListItem>
          <div>Poll 1</div>
        </PollsListItem>
        <PollsListItem>
          <div>Poll 2</div>
        </PollsListItem>
      </PollsListContainer>,
    );

    expect(await axe.run(container)).toHaveNoViolations();
  });
});
