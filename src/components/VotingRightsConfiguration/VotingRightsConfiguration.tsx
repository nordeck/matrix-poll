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

import { Box, Typography } from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ellipsis } from '../../lib/ellipsis';
import { PollGroup } from '../../model/IPoll';
import { HeadingDivider } from '../HeadingDivider';
import { GroupMembersList } from './GroupMembersList';

export const VotingRightsConfiguration = ({
  onGroupsChange,
  groups,
}: {
  onGroupsChange?: (groups: PollGroup[]) => void;
  groups: PollGroup[];
}) => {
  const readOnly = onGroupsChange === undefined;
  const { t } = useTranslation();
  const handleGroupChange = useCallback(
    (group: PollGroup) => {
      if (onGroupsChange) {
        onGroupsChange(groups.map((g) => (g.id === group.id ? group : g)));
      }
    },
    [groups, onGroupsChange]
  );
  const headingId = useId();

  return (
    <Box aria-labelledby={headingId} component="section" flex="1" mt={3}>
      <HeadingDivider>
        <Typography component="h4" id={headingId} sx={ellipsis} variant="h4">
          {t('votingRightsConfiguration.voters', 'Voting persons')}
        </Typography>
      </HeadingDivider>

      {groups.map((group) => (
        <GroupMembersList
          group={group}
          key={group.id}
          onGroupChange={readOnly ? undefined : handleGroupChange}
        />
      ))}
    </Box>
  );
};
