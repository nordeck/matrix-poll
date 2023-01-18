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

import { StateEvent } from '@matrix-widget-toolkit/api';
import { useWidgetApi } from '@matrix-widget-toolkit/react';
import DeleteIcon from '@mui/icons-material/Delete';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import EditIcon from '@mui/icons-material/Edit';
import { IconButton, Stack, Typography } from '@mui/material';
import { unstable_useId as useId, visuallyHidden } from '@mui/utils';
import { ModalButtonKind } from 'matrix-widget-api';
import { ReactElement, useCallback, useState } from 'react';
import { DraggableProvided } from 'react-beautiful-dnd';
import { useTranslation } from 'react-i18next';
import { IPoll } from '../../model';
import {
  useDeletePollMutation,
  usePowerLevels,
  useStartPollMutation,
  useUpdatePollMutation,
} from '../../store';
import { ConfirmDeleteDialog } from '../ConfirmDeleteDialog';
import {
  CancelPollModal,
  PollModalRequestData,
  PollModalResult,
  SubmitPollModal,
} from '../CreatePollModal';
import { MenuButton, MenuButtonItem } from '../MenuButton';
import { PollCard } from '../PollCard';
import { PollsListItem } from '../PollsListContainer';
import { StartPollButton } from './StartPollButton';

type PollsListUpcomingItemProps = {
  poll: StateEvent<IPoll>;
  provided?: DraggableProvided;
  'aria-describedby'?: string;
};

function PollMenuUpcomingPoll({
  poll,
  'aria-describedby': ariaDescribedBy,
}: PollsListUpcomingItemProps): ReactElement {
  const { t } = useTranslation();
  const widgetApi = useWidgetApi();
  const [updatePoll] = useUpdatePollMutation();
  const [deletePoll] = useDeletePollMutation();

  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  const handleClickOpenDeleteConfirm = useCallback(() => {
    setOpenDeleteConfirm(true);
  }, []);

  const handleCloseDeleteConfirm = useCallback(() => {
    setOpenDeleteConfirm(false);
  }, []);

  const handleClickDeleteConfirm = useCallback(() => {
    handleCloseDeleteConfirm();
    deletePoll({ pollId: poll.state_key });
  }, [deletePoll, handleCloseDeleteConfirm, poll.state_key]);

  const handleClickEditPoll = useCallback(async () => {
    const pollData = await widgetApi.openModal<
      PollModalResult,
      PollModalRequestData
    >(
      'create-poll',
      t('pollsListUpcomingItem.editPollModal.title', 'Edit poll'),
      {
        buttons: [
          {
            id: SubmitPollModal,
            kind: ModalButtonKind.Primary,
            label: t('pollsListUpcomingItem.editPollModal.save', 'Save'),
            disabled: true,
          },
          {
            id: CancelPollModal,
            kind: ModalButtonKind.Secondary,
            label: t('pollsListUpcomingItem.editPollModal.cancel', 'Cancel'),
          },
        ],
        data: { poll: poll.content },
      }
    );

    if (pollData) {
      await updatePoll({
        pollId: poll.state_key,
        content: pollData.poll,
      }).unwrap();
    }
  }, [widgetApi, t, poll.content, poll.state_key, updatePoll]);

  return (
    <>
      <MenuButton
        aria-describedby={ariaDescribedBy}
        buttonLabel={t('pollsListUpcomingItem.moreSettings', 'More settings')}
      >
        <MenuButtonItem icon={<EditIcon />} onClick={handleClickEditPoll}>
          {t('pollsListUpcomingItem.editPoll', 'Edit poll')}
        </MenuButtonItem>

        <MenuButtonItem
          color="error.main"
          icon={<DeleteIcon />}
          onClick={handleClickOpenDeleteConfirm}
        >
          {t(
            'pollsListUpcomingItem.dropdownItemDeletePoll.deletePoll',
            'Delete poll'
          )}
        </MenuButtonItem>
      </MenuButton>

      <ConfirmDeleteDialog
        confirmTitle={t(
          'pollsListUpcomingItem.dropdownItemDeletePoll.confirmButton',
          'Delete'
        )}
        description={t('pollsListUpcomingItem.dropdownItemDeletePoll.message', {
          title: poll.content.title,
          defaultValue: 'Are you sure you want to delete the poll “{{title}}”?',
        })}
        onCancel={handleCloseDeleteConfirm}
        onConfirm={handleClickDeleteConfirm}
        open={openDeleteConfirm}
        title={t(
          'pollsListUpcomingItem.dropdownItemDeletePoll.deletePoll',
          'Delete poll'
        )}
      />
    </>
  );
}

export const PollsListUpcomingItem = ({
  poll,
  provided,
}: PollsListUpcomingItemProps) => {
  const { t } = useTranslation();
  const { canCreatePoll } = usePowerLevels();
  const [startPoll] = useStartPollMutation();

  const handleStartPollClick = useCallback(() => {
    startPoll({ pollId: poll.state_key });
  }, [poll.state_key, startPoll]);

  const titleId = useId();
  const reorderInstructionsId = useId();

  return (
    <PollsListItem
      {...provided?.draggableProps}
      aria-labelledby={titleId}
      ref={provided?.innerRef}
    >
      <PollCard
        extra={
          canCreatePoll && (
            <StartPollButton
              aria-describedby={titleId}
              onStart={handleStartPollClick}
              poll={poll.content}
              pollId={poll.state_key}
            />
          )
        }
        header={
          canCreatePoll && (
            <Stack direction="row">
              <IconButton
                component="div"
                {...provided?.dragHandleProps}
                aria-describedby={`${titleId} ${reorderInstructionsId}`}
                aria-label={t('pollsListUpcomingItem.drag', 'Reorder polls')}
              >
                <Typography id={reorderInstructionsId} sx={visuallyHidden}>
                  {/* When concatenating multiple texts with aria-describedby,
                    we have to take care outself that the screen reader does a
                    break when reading them. Therefore the next text starts with
                    a full stop. */}
                  {t(
                    'pollsListUpcomingItem.dragInstructions',
                    '. Press space bar to start a drag. When dragging you can use the arrow keys to move the item around and escape to cancel. Ensure your screen reader is in focus mode or forms mode.'
                  )}
                </Typography>
                <DragHandleIcon />
              </IconButton>

              <PollMenuUpcomingPoll aria-describedby={titleId} poll={poll} />
            </Stack>
          )
        }
        poll={poll.content}
        pollId={poll.state_key}
        titleId={titleId}
      />
    </PollsListItem>
  );
};
