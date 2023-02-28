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

import SaveIcon from '@mui/icons-material/Save';
import {
  Alert,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import { ChangeEvent, FormEvent, useCallback, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ellipsis } from '../../lib/ellipsis';
import {
  useGetPollSettingsQuery,
  usePatchPollSettingsMutation,
} from '../../store';
import { ConfirmDeleteDialog } from '../ConfirmDeleteDialog';

export const PollsPdfDocumentationSettings = () => {
  const { t } = useTranslation();
  const { data: pollSettings } = useGetPollSettingsQuery();
  const [patchPollSettings] = usePatchPollSettingsMutation();

  const [duration, setDuration] = useState(2);

  const [open, setOpen] = useState(false);

  const handleChangeDuration = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setDuration(parseInt(e.target.value)),
    [setDuration]
  );

  const onOpenCallback = useCallback(() => setOpen(true), [setOpen]);
  const onCloseCallback = useCallback(() => setOpen(false), [setOpen]);

  const handleDisablePdfButton = useCallback(async () => {
    await patchPollSettings({
      changes: {
        pdfButtonDisabledAfter: new Date().toISOString(),
      },
    }).unwrap();

    onCloseCallback();
  }, [onCloseCallback, patchPollSettings]);

  const durationError = isNaN(duration) || duration <= 0;

  const handleUpdateDuration = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (!durationError) {
        const now = new Date();
        now.setDate(now.getDate() + duration * 7);

        await patchPollSettings({
          changes: {
            pdfButtonDisabledAfter: now.toISOString(),
          },
        }).unwrap();
      }
    },
    [duration, durationError, patchPollSettings]
  );

  const titleId = useId();
  const durationId = useId();

  return (
    <Card
      aria-labelledby={titleId}
      component="form"
      onSubmit={handleUpdateDuration}
      variant="outlined"
    >
      <CardHeader
        title={t('pollsPdfDocumentation.title', 'Deactivate PDF')}
        titleTypographyProps={{
          id: titleId,
          sx: ellipsis,
          component: 'h4',
        }}
      />

      <CardContent sx={{ pt: 0 }}>
        {pollSettings?.event?.content.pdfButtonDisabledAfter && (
          <Alert role="status" severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>
              {t(
                'pollsPdfDocumentation.pdfDeactivatedTitle',
                'PDF will be deactivated'
              )}
            </AlertTitle>

            {t(
              'pollsPdfDocumentation.pdfDeactivatedMessage',
              'The download of the PDF document will be deactivated on {{date, datetime}}.',
              {
                date: new Date(
                  pollSettings.event.content.pdfButtonDisabledAfter
                ),
                formatParams: {
                  date: {
                    hour: 'numeric',
                    minute: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    day: 'numeric',
                  },
                },
              }
            )}
          </Alert>
        )}

        <Stack alignItems="start" direction="row" gap={1}>
          <TextField
            // don't use the required property of the text field because we don't
            // want it to add a asterisk (*) to the title.
            InputProps={{ required: true }}
            error={durationError}
            fullWidth
            helperText={
              durationError &&
              t(
                'pollsPdfDocumentation.durationHelperText',
                'A duration is required'
              )
            }
            id={durationId}
            inputProps={{
              inputMode: 'numeric',
              type: 'number',
              min: 1,
            }}
            label={t(
              'pollsPdfDocumentation.duration',
              'Deactivate after weeks (required)'
            )}
            margin="dense"
            onChange={handleChangeDuration}
            value={duration}
          />

          <Tooltip
            title={t(
              'pollsPdfDocumentation.deactivate',
              'Set deactivation time'
            )}
          >
            <Button
              disabled={durationError}
              sx={{ mt: '9px' }}
              type="submit"
              variant="contained"
            >
              <SaveIcon />
            </Button>
          </Tooltip>
        </Stack>

        <Button
          color="error"
          fullWidth
          onClick={onOpenCallback}
          type="button"
          variant="contained"
        >
          {t('pollsPdfDocumentation.deactivatePdfNow', 'Deactivate PDF now')}
        </Button>

        <ConfirmDeleteDialog
          confirmTitle={t(
            'pollsPdfDocumentation.closingConfirmButton',
            'Deactivate'
          )}
          description={t(
            'pollsPdfDocumentation.closingMessage',
            'You are about to deactivate the PDF download. Are you sure?'
          )}
          onCancel={onCloseCallback}
          onConfirm={handleDisablePdfButton}
          open={open}
          title={t(
            'pollsPdfDocumentation.closingDialogHeader',
            'Deactivate PDF'
          )}
        />
      </CardContent>
    </Card>
  );
};
