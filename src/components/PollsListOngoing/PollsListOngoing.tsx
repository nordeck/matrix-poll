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

import { Box, Stack } from '@mui/material';
import { ReactElement, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { selectPollsOngoing, useGetPollsQuery } from '../../store';
import { SectionHeadingDivider } from '../HeadingDivider';
import { ListEmptyState } from '../ListEmptyState';
import { PollCardSkeleton } from '../PollCard';
import { PollsListContainer } from '../PollsListContainer';
import { PollsListOngoingItem } from './PollsListOngoingItem';

export function PollsListOngoing(): ReactElement {
  const { t } = useTranslation();

  const { data: pollsState, isLoading } = useGetPollsQuery();
  const polls = pollsState ? selectPollsOngoing(pollsState) : undefined;

  const headingId = useId();

  return (
    <Stack>
      <SectionHeadingDivider
        count={polls?.length ?? 0}
        id={headingId}
        title={t('pollPanel.ongoingPolls', 'Active polls')}
      />

      <Box m={2}>
        <Box maxWidth={327} mx="auto">
          {isLoading && <PollCardSkeleton />}

          {polls && (
            <PollsListContainer aria-labelledby={headingId}>
              {polls.map((poll) => (
                <PollsListOngoingItem key={poll.state_key} poll={poll} />
              ))}

              {polls.length === 0 && (
                <ListEmptyState
                  message={t('pollPanel.noPolls', 'There are no active polls.')}
                />
              )}
            </PollsListContainer>
          )}
        </Box>
      </Box>
    </Stack>
  );
}
