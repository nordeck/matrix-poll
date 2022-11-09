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

import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import PersonIcon from '@mui/icons-material/Person';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import WarningIcon from '@mui/icons-material/Warning';
import { Stack } from '@mui/material';
import { TFunction } from 'i18next';
import { Trans, useTranslation } from 'react-i18next';
import { VotingRight } from '../../model';
import { usePowerLevels, useUserDetails } from '../../store';
import { DisplayNameWordBreak } from './DisplayNameWordBreak';

export const VotingRightView = ({
  votingRight,
}: {
  votingRight: VotingRight;
}) => {
  const { t } = useTranslation();
  const { getUserDisplayName } = useUserDetails();

  return (
    <Stack alignItems="center" direction="row" gap={1}>
      <VotingRightIcon votingRight={votingRight} />

      <span>
        {votingRight.state === 'invalid' && t('pollForm.absent', 'Absent')}

        {votingRight.state === 'represented' && (
          <Trans i18nKey="pollForm.delegatedToComponent">
            Represented by{' '}
            <DisplayNameWordBreak>
              {{ name: getUserDisplayName(votingRight.representedBy) }}
            </DisplayNameWordBreak>
          </Trans>
        )}

        {votingRight.state === 'active' &&
          t('pollForm.delegatePresent', 'Present')}
      </span>
    </Stack>
  );
};

export function getVotingRightLabel(
  votingRight: VotingRight,
  t: TFunction,
  getUserDisplayName: (userId: string) => string
) {
  if (votingRight.state === 'invalid') {
    return t('pollForm.absent', 'Absent');
  } else if (votingRight.state === 'represented') {
    return t('pollForm.delegatedTo', 'Represented by {{name}}', {
      name: getUserDisplayName(votingRight.representedBy),
    });
  } else {
    return t('pollForm.delegatePresent', 'Present');
  }
}

export function VotingRightIcon({ votingRight }: { votingRight: VotingRight }) {
  const { canCreateVote } = usePowerLevels({
    userId:
      votingRight.state === 'represented'
        ? votingRight.representedBy
        : undefined,
  });

  if (votingRight.state === 'invalid') {
    return <PersonOffIcon />;
  } else if (votingRight.state === 'represented') {
    if (!canCreateVote) {
      return <WarningIcon color="error" />;
    }

    return <PeopleAltIcon />;
  } else {
    return <PersonIcon />;
  }
}
