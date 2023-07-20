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

import CloseIcon from '@mui/icons-material/Close';
import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { PollsPdfDialogContent } from './PollsPdfDialogContent';

// Load the wrapper component lazily. This makes sure that we don't load the
// full PDF code if no PDFs are generated.
const PollsPdfDialogWrapper = React.lazy(
  () => import('./PollsPdfDialogWrapper'),
);

export function PollsPdfDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  const dialogTitleId = useId();
  const dialogDescriptionId = useId();

  return (
    <Dialog
      aria-describedby={dialogDescriptionId}
      aria-labelledby={dialogTitleId}
      onClose={onClose}
      open={open}
    >
      <Stack alignItems="baseline" direction="row">
        <DialogTitle component="h3" id={dialogTitleId} sx={{ flex: 1 }}>
          {t('pollsPdfDialog.title', 'Download PDF')}
        </DialogTitle>
        <Tooltip onClick={onClose} title={t('pollsPdfDialog.close', 'Close')}>
          <IconButton autoFocus sx={{ mr: 3 }}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <DialogContent sx={{ pt: 0 }}>
        <DialogContentText id={dialogDescriptionId}>
          {t(
            'pollsPdfDialog.description',
            'The PDF documentation is being generated and can be downloaded once it is ready.',
          )}
        </DialogContentText>

        <Suspense
          fallback={<PollsPdfDialogContent loading onClose={onClose} />}
        >
          <PollsPdfDialogWrapper onClose={onClose} />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
