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
  Alert,
  AlertTitle,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { isEqual } from 'lodash';
import { useCallback, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IPoll } from '../../model';
import {
  selectPollGroups,
  useGetPollGroupsQuery,
  useGetPowerLevelsQuery,
  usePollResults,
} from '../../store';
import { PollCard } from '../PollCard';
import {
  getCanViewResults,
  PollCardVoteFormAnswers,
} from '../PollsListOngoing';
import { LivePollResultModal } from '../PollsListOngoing/LivePollResultModal';
import { TimeDistance } from '../TimeDistance';
import {
  syncPollGroupsWithRoomGroups,
  userPermissionHasChange,
  VotingRightsConfiguration,
} from '../VotingRightsConfiguration';

export type StartPollButtonProps = {
  onStart: () => void;
  poll: IPoll;
  pollId: string;
  'aria-describedby'?: string;
};

export const StartPollButton = ({
  onStart,
  poll,
  pollId,
  'aria-describedby': ariaDescribedBy,
}: StartPollButtonProps) => {
  const { t } = useTranslation();
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();
  const questionId = useId();
  const [open, setOpen] = useState(false);
  const { data: groupEvents } = useGetPollGroupsQuery();

  const { data: pollResults } = usePollResults(pollId, {
    includeInvalidVotes: true,
  });
  const hasVoters = pollResults && pollResults.votingRights.length > 0;

  const { data: powerLevel } = useGetPowerLevelsQuery();
  const groupsHaveConflicts = useMemo(() => {
    if (!groupEvents) {
      return false;
    }

    const expectedGroups = syncPollGroupsWithRoomGroups(
      poll.groups ?? [],
      selectPollGroups(groupEvents)
    );

    return !isEqual(expectedGroups, poll.groups ?? []);
  }, [groupEvents, poll]);

  const handleOpenModal = useCallback(() => {
    setOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setOpen(false);
  }, []);

  const handleStartPollClick = useCallback(() => {
    setOpen(false);
    onStart();
  }, [onStart]);

  return (
    <>
      <Button
        aria-describedby={ariaDescribedBy}
        fullWidth
        onClick={handleOpenModal}
        variant="contained"
      >
        {t('startPollButton.start', 'Start')}
      </Button>

      <Dialog
        aria-describedby={dialogDescriptionId}
        aria-labelledby={dialogTitleId}
        onClose={handleCloseModal}
        open={open}
      >
        <DialogTitle component="h3" id={dialogTitleId}>
          {t('startPollButton.startPoll', 'Start poll')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id={dialogDescriptionId}>
            {t(
              'startPollButton.message',
              'Are you sure you want to start the poll?'
            )}
          </DialogContentText>

          {groupsHaveConflicts && (
            <Alert role="status" severity="warning" sx={{ my: 2 }}>
              <AlertTitle>
                {t(
                  'startPollButton.conflictMessage.title',
                  'Changes in the groups detected.'
                )}
              </AlertTitle>

              {t(
                'startPollButton.conflictMessage.description',
                'Please edit the poll to resolve conflict.'
              )}
            </Alert>
          )}

          {userPermissionHasChange(poll.groups, powerLevel?.event?.content) &&
            !groupsHaveConflicts && (
              <Alert role="status" severity="warning" sx={{ my: 2 }}>
                <AlertTitle>
                  {t(
                    'startPollButton.changePermissionMessage.title',
                    'This poll contains users with an insufficient power level.'
                  )}
                </AlertTitle>

                {t(
                  'startPollButton.changePermissionMessage.description',
                  'Adjust the power level or remove the users from the poll.'
                )}
              </Alert>
            )}

          {!hasVoters && (
            <Alert role="status" severity="warning" sx={{ my: 2 }}>
              <AlertTitle>
                {t(
                  'startPollButton.addVoters.title',
                  'This poll has no voters.'
                )}
              </AlertTitle>

              {t(
                'startPollButton.addVoters.description',
                'Please add voters to the poll.'
              )}
            </Alert>
          )}

          <Box maxWidth={327} mt={2} mx="auto" position="relative">
            <PollCard
              headerInfos={
                <TimeDistance
                  fallbackDuration={poll.duration}
                  sx={{ top: '40px' }}
                />
              }
              poll={poll}
              pollId={pollId}
              questionId={questionId}
            >
              <PollCardVoteFormAnswers
                answers={poll.answers}
                aria-describedby={questionId}
              />

              {getCanViewResults({ canCreatePoll: false, poll }) && (
                <LivePollResultModal
                  canViewResults={false}
                  poll={poll}
                  pollId={pollId}
                />
              )}
            </PollCard>
          </Box>

          {poll.groups && <VotingRightsConfiguration groups={poll.groups} />}
        </DialogContent>

        <DialogActions>
          <Button autoFocus onClick={handleCloseModal} variant="outlined">
            {t('startPollButton.cancelButton', 'Cancel')}
          </Button>
          <Button onClick={handleStartPollClick} variant="contained">
            {t('startPollButton.confirmButton', 'Start')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
