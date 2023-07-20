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
import TimerOffIcon from '@mui/icons-material/TimerOff';
import { Alert, Skeleton, Tooltip } from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import { Fragment, ReactElement, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IPoll } from '../../model';
import { usePowerLevels, useStopPollMutation } from '../../store';
import { ConfirmDeleteDialog } from '../ConfirmDeleteDialog';
import { MenuButton, MenuButtonItem } from '../MenuButton';
import { PollCard } from '../PollCard';
import { PollsListItem } from '../PollsListContainer';
import { TimeDistance } from '../TimeDistance';
import { LivePollResultModal } from './LivePollResultModal';
import { PollCardCanNotVoteContent } from './PollCardCanNotVoteContent';
import { PollCardVotedContent } from './PollCardVotedContent';
import { PollCardVoteFormContent } from './PollCardVoteFormContent';
import { usePollStatus } from './usePollStatus';

type PollsListOngoingItemProps = {
  poll: StateEvent<IPoll>;
  'aria-describedby'?: string;
};

function PollMenuOngoingPoll({
  poll,
  'aria-describedby': ariaDescribedBy,
}: PollsListOngoingItemProps): ReactElement {
  const { t } = useTranslation();
  const [stopPoll] = useStopPollMutation();

  const [openStopConfirm, setOpenStopConfirm] = useState(false);

  const handleClickOpenStopConfirm = useCallback(() => {
    setOpenStopConfirm(true);
  }, []);

  const handleCloseStopConfirm = useCallback(() => {
    setOpenStopConfirm(false);
  }, []);

  const handleClickStopConfirm = useCallback(() => {
    stopPoll({ pollId: poll.state_key });
    handleCloseStopConfirm();
  }, [handleCloseStopConfirm, poll.state_key, stopPoll]);

  return (
    <>
      <MenuButton
        aria-describedby={ariaDescribedBy}
        buttonLabel={t('pollsListOnGoingItem.moreSettings', 'More settings')}
      >
        <MenuButtonItem
          icon={<TimerOffIcon />}
          onClick={handleClickOpenStopConfirm}
        >
          {t('pollsListOnGoingItem.stopPoll', 'End poll now')}
        </MenuButtonItem>
      </MenuButton>

      <ConfirmDeleteDialog
        confirmTitle={t(
          'pollsListOnGoingItem.dropdownItemStopPoll.confirmButton',
          'End now',
        )}
        description={t(
          'pollsListOnGoingItem.dropdownItemStopPoll.message',
          'Are you sure you want to end the poll “{{title}}”? All existing votes will be registered and no further voting will be possible.',
          { title: poll.content.title },
        )}
        onCancel={handleCloseStopConfirm}
        onConfirm={handleClickStopConfirm}
        open={openStopConfirm}
        title={t(
          'pollsListOnGoingItem.dropdownItemStopPoll.endPollNow',
          'End poll now',
        )}
      />
    </>
  );
}

export const PollsListOngoingItem = ({ poll }: PollsListOngoingItemProps) => {
  const { t } = useTranslation();
  const { canCreatePoll } = usePowerLevels();

  const {
    data: { hasVoted, canViewResults, pollHasResults, canVote } = {},
    isLoading,
    isError,
  } = usePollStatus(poll.state_key);

  const showLiveResultTooltip = hasVoted && !canViewResults;
  const showLiveResult =
    (hasVoted && canViewResults) || (pollHasResults && canViewResults);

  const titleId = useId();
  const questionId = useId();

  const tooltipText = t(
    'resultVoteView.resultIsInvisible',
    'You will see the result when the voting ends.',
  );

  return (
    <PollsListItem aria-labelledby={titleId}>
      <PollCard
        extra={
          showLiveResultTooltip ? (
            <Tooltip describeChild title={tooltipText}>
              <div>
                <LivePollResultModal
                  canViewResults={canViewResults}
                  poll={poll.content}
                  pollId={poll.state_key}
                />
              </div>
            </Tooltip>
          ) : showLiveResult ? (
            <LivePollResultModal
              aria-describedby={titleId}
              canViewResults={canViewResults}
              poll={poll.content}
              pollId={poll.state_key}
            />
          ) : null
        }
        header={
          canCreatePoll && (
            <PollMenuOngoingPoll aria-describedby={titleId} poll={poll} />
          )
        }
        headerInfos={
          poll.content.startTime &&
          poll.content.endTime && (
            <TimeDistance
              endTime={poll.content.endTime}
              fallbackDuration={poll.content.duration}
              startTime={poll.content.startTime}
              sx={{ marginTop: '-20px' }}
            />
          )
        }
        poll={poll.content}
        pollId={poll.state_key}
        questionId={questionId}
        showVotes
        titleId={titleId}
      >
        {isLoading ? (
          <Skeleton
            data-testid="votesLoadingPollOngoing"
            height={140}
            sx={{ my: 2 }}
            variant="rectangular"
          />
        ) : isError ? (
          <Alert role="status" severity="error" sx={{ my: 2 }}>
            {t('pollsListOngoing.error', 'Data could not be loaded.')}
          </Alert>
        ) : hasVoted ? (
          <PollCardVotedContent pollId={poll.state_key} />
        ) : canVote ? (
          <PollCardVoteFormContent
            poll={poll.content}
            pollId={poll.state_key}
            questionId={questionId}
          />
        ) : pollHasResults && canViewResults ? (
          <Fragment />
        ) : (
          <PollCardCanNotVoteContent poll={poll.content} />
        )}
      </PollCard>
    </PollsListItem>
  );
};
