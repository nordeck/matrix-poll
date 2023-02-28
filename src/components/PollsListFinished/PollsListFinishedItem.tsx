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
import CheckIcon from '@mui/icons-material/Check';
import { Alert, Skeleton } from '@mui/material';
import { Fragment, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { formatPollDate } from '../../lib/formatPollDate';
import { IPoll } from '../../model';
import { usePollResults } from '../../store';
import { PollCard } from '../PollCard';
import { PollResultModal } from '../PollResultModal';
import { PollsListItem } from '../PollsListContainer';

type PollsListFinishedItemProps = {
  poll: StateEvent<IPoll>;
};

export const PollsListFinishedItem = ({ poll }: PollsListFinishedItemProps) => {
  const { t } = useTranslation();
  const titleId = useId();

  const { isLoading: isLoadingPollResults, isError: isErrorPollResults } =
    usePollResults(poll.state_key);

  return (
    <PollsListItem aria-labelledby={titleId}>
      <PollCard
        extra={
          <Fragment>
            {isLoadingPollResults ? (
              <Skeleton
                data-testid="votesLoadingPollFinished"
                height={36}
                tabIndex={0}
                variant="rectangular"
              />
            ) : isErrorPollResults ? (
              <Alert role="status" severity="error">
                {t('pollsListFinishedItem.error', 'Data could not be loaded.')}
              </Alert>
            ) : (
              <PollResultModal
                aria-describedby={titleId}
                buttonText={t('resultViewDetails.seeResult', 'See result')}
                poll={poll.content}
                pollId={poll.state_key}
                pollIsFinished
              />
            )}
          </Fragment>
        }
        header={<CheckIcon color="primary" />}
        headerMeta={formatPollDate(
          poll.content.startTime,
          poll.content.endTime
        )}
        poll={poll.content}
        pollId={poll.state_key}
        showVotes
        titleId={titleId}
      ></PollCard>
    </PollsListItem>
  );
};
