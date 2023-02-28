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

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { DispatchWithoutAction, useId } from 'react';
import { useTranslation } from 'react-i18next';

type ConfirmDeleteDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmTitle: string;
  onCancel: DispatchWithoutAction;
  onConfirm: DispatchWithoutAction;
};

export function ConfirmDeleteDialog({
  open,
  title,
  description,
  confirmTitle,
  onCancel,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const { t } = useTranslation();

  const dialogTitleId = useId();
  const dialogDescriptionId = useId();

  return (
    <Dialog
      aria-describedby={dialogDescriptionId}
      aria-labelledby={dialogTitleId}
      onClose={onCancel}
      open={open}
    >
      <DialogTitle component="h3" id={dialogTitleId}>
        {title}
      </DialogTitle>

      <DialogContent>
        <DialogContentText id={dialogDescriptionId}>
          {description}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button autoFocus onClick={onCancel} variant="outlined">
          {t('cancel', 'Cancel')}
        </Button>
        <Button color="error" onClick={onConfirm} variant="contained">
          {confirmTitle}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
