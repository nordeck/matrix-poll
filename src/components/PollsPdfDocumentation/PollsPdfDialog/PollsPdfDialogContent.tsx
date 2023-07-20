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

import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { LoadingButton } from '@mui/lab';
import { Alert, Tooltip, Typography } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import useId from '@mui/utils/useId';
import { useTranslation } from 'react-i18next';

export function PollsPdfDialogContent({
  loading,
  value,
  error,
  onClose,
}: {
  loading?: boolean;
  error?: boolean;
  value?: { url: string; roomName: string };
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const descriptionId = useId();
  const description = t(
    'pollsPdfDownloadButton.tooltip',
    'The provided PDF is currently not accessible and can not be read using a screen reader.',
  );

  return (
    <>
      {error && (
        <Alert role="status" severity="error" sx={{ my: 2 }}>
          {t(
            'pollsPdfDialog.error',
            'Something went wrong while generating the PDF documentation.',
          )}
        </Alert>
      )}

      <Typography aria-hidden id={descriptionId} sx={visuallyHidden}>
        {description}
      </Typography>
      <Tooltip
        describeChild
        title={
          // This fragment is intentional, so that the tooltip doesn't apply the
          // description as a title to the link. Instead we want the text inside
          // the link to be the accessible name.
          <>{description}</>
        }
      >
        <LoadingButton
          aria-describedby={descriptionId}
          component="a"
          disabled={error}
          download={value ? `${value.roomName}.pdf` : undefined}
          fullWidth
          href={value?.url}
          loading={(loading || !value) && !error}
          loadingPosition="start"
          onClick={onClose}
          startIcon={<FileDownloadIcon />}
          sx={{ my: 1 }}
          target="_blank"
          variant="outlined"
        >
          {t('pollsPdfDialog.download', 'Download')}
        </LoadingButton>
      </Tooltip>
    </>
  );
}
