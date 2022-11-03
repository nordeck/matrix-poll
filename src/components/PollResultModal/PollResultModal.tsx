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

import CloseIcon from '@mui/icons-material/Close';
import TableViewIcon from '@mui/icons-material/TableView';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import { AriaAttributes, ReactElement, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IPoll } from '../../model';
import { PollResultModalContent } from './PollResultModalContent';

/**
 * Props for the {@link PollResultDetailsModal} component.
 */
type PollResultDetailsModalProps = AriaAttributes & {
  /** the poll object to display */
  poll: IPoll;

  /** the ID of the poll event */
  pollId: string;

  /** the text of the button that opens the dialog*/
  buttonText: string;

  /** if true, the button is disabled and the user can't see the results */
  disabled?: boolean;

  /** if true, it will add the invalid vote to the result  */
  pollIsFinished?: boolean;
};

/**
 * A component that renders a modal with a graphical representation
 * and an optional list of all votes.
 *
 * @param param0 - {@link PollResultDetailsModalProps}
 */
export function PollResultModal({
  pollId,
  poll,
  buttonText,
  disabled = false,
  pollIsFinished = false,
  ...ariaAttributes
}: PollResultDetailsModalProps): ReactElement {
  const { t } = useTranslation();
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();
  const [open, setOpen] = useState(false);

  const handleOpenModal = useCallback(() => {
    setOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      <Button
        {...ariaAttributes}
        disabled={disabled}
        fullWidth
        onClick={handleOpenModal}
        startIcon={<TableViewIcon />}
        variant="outlined"
      >
        {buttonText}
      </Button>

      <Dialog
        aria-describedby={dialogDescriptionId}
        aria-labelledby={dialogTitleId}
        onClose={handleCloseModal}
        open={open}
      >
        <Stack alignItems="center" direction="row">
          <DialogTitle component="h3" id={dialogTitleId} sx={{ flex: 1 }}>
            {poll.title}
          </DialogTitle>
          <Tooltip onClick={handleCloseModal} title={t('close', 'Close')}>
            <IconButton autoFocus sx={{ mr: 3 }}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        <DialogContent sx={{ pt: 0 }}>
          <PollResultModalContent
            descriptionId={dialogDescriptionId}
            isFinished={pollIsFinished}
            poll={poll}
            pollId={pollId}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
