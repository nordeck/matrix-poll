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
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { AnswerTypeField } from './AnswerTypeField';

describe('<AnswerTypeField>', () => {
  it('should render without exploding', () => {
    render(<AnswerTypeField onChange={jest.fn()} value={[]} />);

    const radioGroup = screen.getByRole('radiogroup', { name: 'Answer type' });

    expect(
      within(radioGroup).getByRole('radio', { name: 'Yes | No | Abstain' }),
    ).toBeChecked();
    expect(
      within(radioGroup).getByRole('radio', { name: 'Yes | No' }),
    ).not.toBeChecked();
  });

  it('should have not accessibility violations', async () => {
    const { container } = render(
      <AnswerTypeField onChange={jest.fn()} value={[]} />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should display existing answers', () => {
    render(
      <AnswerTypeField
        onChange={jest.fn()}
        value={[
          {
            id: '1',
            label: 'Yes',
          },
          {
            id: '2',
            label: 'No',
          },
        ]}
      />,
    );

    const radioGroup = screen.getByRole('radiogroup', { name: 'Answer type' });
    expect(
      within(radioGroup).getByRole('radio', { name: 'Yes | No | Abstain' }),
    ).not.toBeChecked();
    expect(
      within(radioGroup).getByRole('radio', { name: 'Yes | No' }),
    ).toBeChecked();
  });

  it('should select a answer', async () => {
    const onChange = jest.fn();
    render(<AnswerTypeField onChange={onChange} value={[]} />);

    const radioGroup = screen.getByRole('radiogroup', { name: 'Answer type' });

    await userEvent.click(
      within(radioGroup).getByRole('radio', { name: 'Yes | No' }),
    );

    expect(onChange).toBeCalledWith([
      {
        id: '1',
        label: 'Yes',
      },
      {
        id: '2',
        label: 'No',
      },
    ]);
  });
});
