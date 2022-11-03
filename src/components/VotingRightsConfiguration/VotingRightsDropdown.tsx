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
  Autocomplete,
  AutocompleteRenderInputParams,
  Box,
  InputAdornment,
  TextField,
} from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import { isEqual } from 'lodash';
import { HTMLAttributes, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PollGroup, VotingRight } from '../../model';
import {
  selectPollGroup,
  useGetPollGroupsQuery,
  useUserDetails,
} from '../../store';
import {
  getVotingRightLabel,
  VotingRightIcon,
  VotingRightView,
} from './VotingRightView';

export const VotingRightDropdown = ({
  delegateId,
  group,
  votingRight,
  onVotingRightChange,
  'aria-describedby': ariaDescribedBy,
}: {
  delegateId: string;
  group: PollGroup;
  votingRight: VotingRight;
  onVotingRightChange: (userId: string, votingRight: VotingRight) => void;
  'aria-describedby'?: string;
}) => {
  const { t } = useTranslation();
  const { getUserDisplayName } = useUserDetails();
  const { data: groupEvents } = useGetPollGroupsQuery();

  const options = useMemo(() => {
    const groupEvent = groupEvents
      ? selectPollGroup(groupEvents, group.id)
      : undefined;
    const groupMembers = Object.entries(groupEvent?.content?.members ?? {}).map(
      ([id, content]) => ({
        id,
        content,
      })
    );
    const representatives = groupMembers
      .filter((m) => m.content.memberRole === 'representative')
      .map((m) => m.id);
    const availableRepresentatives = representatives.filter(
      (representativeId) => {
        const ownVotingRight = group.votingRights[delegateId];
        if (
          ownVotingRight &&
          ownVotingRight.state === 'represented' &&
          representativeId === ownVotingRight.representedBy
        ) {
          return true;
        }

        return !Object.values(group.votingRights).some(
          (v) =>
            v &&
            v.state === 'represented' &&
            v.representedBy === representativeId
        );
      }
    );

    return [
      {
        state: 'active',
      },
      ...availableRepresentatives.map((representativeId) => ({
        state: 'represented',
        representedBy: representativeId,
      })),
      {
        state: 'invalid',
      },
    ] as VotingRight[];
  }, [delegateId, group.id, group.votingRights, groupEvents]);

  const getOptionLabel = useCallback(
    (option: VotingRight) => getVotingRightLabel(option, t, getUserDisplayName),
    [getUserDisplayName, t]
  );

  const handleOnChange = useCallback(
    (_, value: VotingRight) => onVotingRightChange(delegateId, value),
    [delegateId, onVotingRightChange]
  );

  const renderInput = useCallback(
    (props: AutocompleteRenderInputParams) => (
      <TextField
        {...props}
        InputProps={{
          ...props.InputProps,
          startAdornment: (
            <InputAdornment position="start" sx={{ ml: 1 }}>
              <VotingRightIcon votingRight={votingRight} />
            </InputAdornment>
          ),
          'aria-describedby': ariaDescribedBy,
        }}
        label={t('pollForm.attendance', 'Attendance')}
      />
    ),
    [ariaDescribedBy, t, votingRight]
  );

  const renderOption = useCallback(
    (props: HTMLAttributes<HTMLLIElement>, option: VotingRight) => (
      <Box component="li" {...props}>
        <VotingRightView votingRight={option} />
      </Box>
    ),
    []
  );

  const id = useId();

  return (
    <Autocomplete
      disableClearable
      disablePortal
      getOptionLabel={getOptionLabel}
      id={id}
      isOptionEqualToValue={isEqual}
      onChange={handleOnChange}
      openText={t('votingRightsDropdown.selectOpen', 'Open')}
      options={options}
      renderInput={renderInput}
      renderOption={renderOption}
      sx={{ width: '50%' }}
      value={votingRight}
    />
  );
};
