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

import { useWidgetApi } from '@matrix-widget-toolkit/react';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Divider, Stack } from '@mui/material';
import { ModalButtonKind } from 'matrix-widget-api';
import { ReactElement, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as uuid from 'uuid';
import {
  selectPollsFinished,
  selectPollsUpcoming,
  useGetPollsQuery,
  usePowerLevels,
  useRerenderOnPollStatusChange,
  useUpdatePollMutation,
} from '../../store';
import {
  CancelPollModal,
  PollModalRequestData,
  PollModalResult,
  SubmitPollModal,
} from '../CreatePollModal';
import { PollsListFinished } from '../PollsListFinished';
import { PollsListOngoing } from '../PollsListOngoing';
import { PollsListUpcoming } from '../PollsListUpcoming';
import { PollsPdfDocumentation } from '../PollsPdfDocumentation';

export function PollPanel(): ReactElement {
  const widgetApi = useWidgetApi();
  const { t } = useTranslation();
  const [updatePoll] = useUpdatePollMutation();

  // the change ongoing->finished doesn't trigger a redux state change so we
  // manually trigger a rerender to recompute the selectors.
  useRerenderOnPollStatusChange();

  const { data: pollsState } = useGetPollsQuery();

  const hasFinishedPolls =
    pollsState && selectPollsFinished(pollsState).length > 0;
  const hasUpcomingPolls =
    pollsState && selectPollsUpcoming(pollsState).length > 0;

  const handleCreatePoll = useCallback(async () => {
    const data = await widgetApi.openModal<
      PollModalResult,
      PollModalRequestData
    >('create-poll', t('pollPanel.createPollModal.title', 'Create new poll'), {
      buttons: [
        {
          id: SubmitPollModal,
          kind: ModalButtonKind.Primary,
          label: t('pollPanel.createPollModal.save', 'Save'),
          disabled: true,
        },
        {
          id: CancelPollModal,
          kind: ModalButtonKind.Secondary,
          label: t('pollPanel.createPollModal.cancel', 'Cancel'),
        },
      ],
    });

    if (data) {
      await updatePoll({
        pollId: uuid.v4(),
        content: data.poll,
      }).unwrap();
    }
  }, [t, updatePoll, widgetApi]);

  const { canCreatePoll } = usePowerLevels();

  return (
    <Stack height="100%">
      <Box
        flexGrow="1"
        sx={{
          overflowX: 'hidden',

          // make sure all focusable elements are not
          // displayed behind the sticky headings
          'a[href],area[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),iframe,[tabindex],[contentEditable=true]':
            {
              '&:not([tabindex="-1"])': {
                scrollMarginTop: '50px',
              },
            },
        }}
      >
        {canCreatePoll && <PollsPdfDocumentation />}

        <PollsListOngoing />

        {hasUpcomingPolls && <PollsListUpcoming />}

        {hasFinishedPolls && <PollsListFinished />}
      </Box>

      {canCreatePoll && (
        <Box component="nav" px={2}>
          <Divider />
          <Box maxWidth={327} mx="auto" my={2}>
            <Button
              fullWidth
              onClick={handleCreatePoll}
              startIcon={<AddIcon />}
              variant="contained"
            >
              {t('pollPanel.createPoll', 'Create new poll')}
            </Button>
          </Box>
        </Box>
      )}
    </Stack>
  );
}
