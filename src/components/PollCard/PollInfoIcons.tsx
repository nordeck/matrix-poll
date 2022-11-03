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

import BadgeIcon from '@mui/icons-material/Badge';
import InventoryIcon from '@mui/icons-material/Inventory';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PeopleIcon from '@mui/icons-material/People';
import { Skeleton, Stack, Tooltip, Typography } from '@mui/material';
import { unstable_useId as useId, visuallyHidden } from '@mui/utils';
import { Fragment, ReactElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { getPollTypeLabel } from '../../lib/getPollTypeLabel';
import { PollType } from '../../model';
import { PollInvalidAnswer, usePollResults } from '../../store';

interface IInfosIconsProps {
  pollId: string;
  showVotes: boolean;
}

type InfosIconProps = {
  icon: ReactElement;
  label: string;
  children?: ReactNode;
};

function getPollTypeIcon(pollType: string) {
  if (pollType === PollType.Open) {
    return <LockOpenIcon fontSize="inherit" />;
  }

  if (pollType === PollType.Secret) {
    return <LockIcon fontSize="inherit" />;
  }

  return <BadgeIcon fontSize="inherit" />;
}

function InfoIcon({ icon, label, children }: InfosIconProps) {
  const labelId = useId();
  return (
    <Tooltip title={label}>
      <Stack
        alignItems="center"
        aria-labelledby={labelId}
        component="li"
        direction="row"
        gap={0.5}
      >
        {icon}{' '}
        {children !== undefined && <span aria-hidden="true">{children}</span>}
        <Typography id={labelId} sx={visuallyHidden}>
          {label}
        </Typography>
      </Stack>
    </Tooltip>
  );
}

export const PollInfoIcons = ({ pollId, showVotes }: IInfosIconsProps) => {
  const { t } = useTranslation();

  // load base data
  const { data: pollResults } = usePollResults(pollId, {
    includeInvalidVotes: true,
    // a new optional parameter that tells the hook that is should ignore the isLoading and isError flag of the vote loading when returning.
    skipLoadingVotes: true,
  });

  // load results including votes
  const {
    data: pollResultsWithVotes,
    isLoading: isPollResultsLoading,
    isError: isPollResultsError,
  } = usePollResults(pollId, {
    includeInvalidVotes: true,
  });

  if (!pollResults) {
    return <Fragment />;
  }

  const participantCount =
    pollResultsWithVotes?.votingRights.length ??
    pollResults.votingRights.length;

  const voteCount = pollResultsWithVotes
    ? Object.values(pollResultsWithVotes.results.votes).filter(
        (vote) => vote !== PollInvalidAnswer
      ).length
    : 0;

  const userLabel = t('infosIcons.users', '{{count}} voters', {
    count: participantCount,
  });
  const castVoteLabel = t('infosIcons.castVotes', '{{count}} voting persons', {
    count: voteCount,
  });
  const castVoteLabelLoading = t(
    'infosIcons.castVotes_loading',
    'Votes loading'
  );
  const pollTypeLabel = getPollTypeLabel(pollResults, t);

  return (
    <Stack
      alignItems="center"
      aria-label={t('infosIcons.title', 'Poll Details')}
      component="ul"
      direction="row"
      divider={
        <Typography aria-hidden="true" color="text.secondary" component="li">
          |
        </Typography>
      }
      m={0}
      pl={0}
      spacing={1}
      sx={{
        li: {
          listStyleType: 'none',
        },
      }}
    >
      <InfoIcon
        icon={getPollTypeIcon(pollResults.poll.content.pollType)}
        label={pollTypeLabel}
      />

      <InfoIcon icon={<PeopleIcon fontSize="inherit" />} label={userLabel}>
        {participantCount}
      </InfoIcon>

      {showVotes && !isPollResultsError && (
        <InfoIcon
          icon={<InventoryIcon fontSize="inherit" />}
          label={isPollResultsLoading ? castVoteLabelLoading : castVoteLabel}
        >
          {isPollResultsLoading ? (
            <Skeleton variant="rectangular" width="1em" />
          ) : (
            voteCount
          )}
        </InfoIcon>
      )}
    </Stack>
  );
};
