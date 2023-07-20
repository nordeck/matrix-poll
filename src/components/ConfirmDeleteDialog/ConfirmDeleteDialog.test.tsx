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
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';

describe('<ConfirmDeleteDialog/>', () => {
  const onCancel = jest.fn();
  const onConfirm = jest.fn();

  it('should render without exploding', () => {
    render(
      <ConfirmDeleteDialog
        confirmTitle="Confirm"
        description="The description of the modal"
        onCancel={onCancel}
        onConfirm={onConfirm}
        open={false}
        title="Confirm the deletion"
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should open a confirm dialog if opened', async () => {
    render(
      <ConfirmDeleteDialog
        confirmTitle="Confirm"
        description="The description of the modal"
        onCancel={onCancel}
        onConfirm={onConfirm}
        open
        title="Confirm the deletion"
      />,
    );

    const deleteModal = screen.getByRole('dialog', {
      name: /confirm the deletion/i,
    });

    expect(
      within(deleteModal).getByText(/confirm the deletion/i),
    ).toBeInTheDocument();

    expect(deleteModal).toHaveAccessibleDescription(
      /the description of the modal/i,
    );

    expect(
      within(deleteModal).getByText(/the description of the modal/i),
    ).toBeInTheDocument();

    await userEvent.click(
      within(deleteModal).getByRole('button', { name: 'Confirm' }),
    );

    expect(onConfirm).toBeCalledTimes(1);
    expect(onCancel).not.toBeCalled();
  });

  it('should do nothing if the user cancels the deletion', async () => {
    render(
      <ConfirmDeleteDialog
        confirmTitle="Confirm"
        description="The description of the modal"
        onCancel={onCancel}
        onConfirm={onConfirm}
        open
        title="Confirm the deletion"
      />,
    );

    const deleteModal = screen.getByRole('dialog', {
      name: /confirm the deletion/i,
    });

    expect(
      within(deleteModal).getByText(/confirm the deletion/i),
    ).toBeInTheDocument();

    expect(deleteModal).toHaveAccessibleDescription(
      /the description of the modal/i,
    );

    expect(
      within(deleteModal).getByText(/the description of the modal/i),
    ).toBeInTheDocument();

    await userEvent.click(
      within(deleteModal).getByRole('button', { name: 'Cancel' }),
    );

    expect(onConfirm).not.toBeCalled();
    expect(onCancel).toBeCalledTimes(1);
  });
});
