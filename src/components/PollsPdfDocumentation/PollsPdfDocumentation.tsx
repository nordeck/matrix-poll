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

import { getEnvironment } from '@matrix-widget-toolkit/mui';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import { Box, Collapse, Stack, ToggleButton, Tooltip } from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { selectPollsFinished, useGetPollsQuery } from '../../store';
import { SectionHeadingDivider } from '../HeadingDivider';
import { PollsPdfDocumentationSettings } from './PollsPdfDocumentationSettings';
import { PollsPdfDownloadButton } from './PollsPdfDownloadButton';
import { useCanDownloadPdf } from './useCanDownloadPdf';

export const PollsPdfDocumentation = () => {
  const { t } = useTranslation();
  const [moreSettings, setMoreSettings] = useState(false);
  const showDeactivateSection =
    getEnvironment('REACT_APP_POLL_SHOW_DEACTIVATE_PDF', 'true') === 'true';
  const { data: canDownloadPdf, isLoading: isPollSettingsLoading } =
    useCanDownloadPdf();
  const { data: pollsState } = useGetPollsQuery();
  const aPollHasStartedAndEnds = pollsState
    ? selectPollsFinished(pollsState).length > 0
    : false;

  const handleToggleMoreSettings = useCallback(
    () => setMoreSettings((v) => !v),
    [],
  );

  const headingId = useId();
  const moreSettingsId = useId();

  if (!aPollHasStartedAndEnds || !canDownloadPdf || isPollSettingsLoading) {
    return <></>;
  }

  return (
    <Stack aria-labelledby={headingId} component="section">
      <SectionHeadingDivider
        id={headingId}
        title={t('pollsPdfDocumentation.documentation', 'Documentation')}
      />

      <Box m={2}>
        <Box maxWidth={327} mx="auto">
          <Stack direction="row" gap={1}>
            <PollsPdfDownloadButton />

            {showDeactivateSection && (
              <Tooltip
                title={t('pollsPdfDocumentation.moreSetting', 'More settings')}
              >
                <ToggleButton
                  aria-controls={moreSettings ? moreSettingsId : undefined}
                  aria-expanded={moreSettings}
                  color="primary"
                  onClick={handleToggleMoreSettings}
                  selected={moreSettings}
                  value="more"
                >
                  <SettingsApplicationsIcon />
                </ToggleButton>
              </Tooltip>
            )}
          </Stack>

          <Collapse in={moreSettings} mountOnEnter unmountOnExit>
            <Box id={moreSettingsId} mt={2}>
              <PollsPdfDocumentationSettings />
            </Box>
          </Collapse>
        </Box>
      </Box>
    </Stack>
  );
};
