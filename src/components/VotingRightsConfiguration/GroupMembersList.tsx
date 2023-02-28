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

import { Alert, AlertTitle, List } from '@mui/material';
import React, { useCallback, useId } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { PollGroup, VotingRight } from '../../model/IPoll';
import { usePowerLevels, useUserDetails } from '../../store';
import { GroupHeader } from '../GroupHeader';
import { ListEmptyState } from '../ListEmptyState';
import { UserListItem } from '../UserListItem';
import { DisplayNameWordBreak } from './DisplayNameWordBreak';
import { VotingRightDropdown } from './VotingRightsDropdown';
import { VotingRightView } from './VotingRightView';

export const GroupMembersList = ({
  group,
  onGroupChange,
}: {
  group: PollGroup;
  onGroupChange?: (group: PollGroup) => void;
}) => {
  const readOnly = onGroupChange === undefined;
  const { t } = useTranslation();
  const delegates = Object.keys(group.votingRights);
  const headingId = useId();

  const setVotingRight = useCallback(
    (userId: string, votingRight: VotingRight) => {
      if (onGroupChange) {
        onGroupChange({
          ...group,
          votingRights: {
            ...group.votingRights,
            [userId]: votingRight,
          },
        });
      }
    },
    [group, onGroupChange]
  );

  return (
    <>
      <GroupHeader group={group} id={headingId} />

      <List aria-labelledby={headingId} dense disablePadding>
        {delegates.map((delegateId) => (
          <GroupMemberItem
            delegateId={delegateId}
            group={group}
            key={delegateId}
            onVotingRightChange={setVotingRight}
            readOnly={readOnly}
          />
        ))}

        {delegates.length === 0 && (
          <ListEmptyState
            message={t(
              'pollForm.noDelegate',
              'No delegates have been assigned yet'
            )}
          />
        )}
      </List>
    </>
  );
};

export const GroupMemberItem = ({
  delegateId,
  group,
  readOnly,
  onVotingRightChange,
}: {
  delegateId: string;
  group: PollGroup;
  readOnly: boolean;
  onVotingRightChange: (userId: string, votingRight: VotingRight) => void;
}) => {
  const { t } = useTranslation();
  const ownVotingRight = group.votingRights[delegateId] ?? {
    state: 'active',
  };
  const { getUserDisplayName } = useUserDetails();

  const delegate = group.votingRights[delegateId];
  const { canCreateVote } = usePowerLevels({
    userId:
      delegate?.state === 'represented' ? delegate?.representedBy : delegateId,
  });
  const titleId = useId();

  return (
    <React.Fragment key={delegateId}>
      <UserListItem
        ListItemProps={{ disableGutters: true, sx: { flexWrap: 'wrap' } }}
        titleId={titleId}
        userId={delegateId}
      >
        {readOnly ? (
          <VotingRightView votingRight={ownVotingRight} />
        ) : (
          <VotingRightDropdown
            aria-describedby={titleId}
            delegateId={delegateId}
            group={group}
            onVotingRightChange={onVotingRightChange}
            votingRight={ownVotingRight}
          />
        )}

        {/* delegate has no power level to vote */}
        {delegate?.state === 'active' && !canCreateVote && (
          <Alert role="status" severity="warning" sx={{ mt: 1 }}>
            <AlertTitle>
              {t(
                'userHasNoPermissionMessage.title',
                'Insufficient power level'
              )}
            </AlertTitle>

            <Trans i18nKey="userHasNoPermissionMessage.delegateHasNoPermission">
              <DisplayNameWordBreak>
                {{ delegate: getUserDisplayName(delegateId) }}
              </DisplayNameWordBreak>{' '}
              has an insufficient power level and will not be able to vote.
            </Trans>
          </Alert>
        )}

        {/* representative has no power level to vote */}
        {delegate?.state === 'represented' && !canCreateVote && (
          <Alert role="status" severity="warning" sx={{ mt: 1 }}>
            <AlertTitle>
              {t(
                'userHasNoPermissionMessage.title',
                'Insufficient power level'
              )}
            </AlertTitle>

            <Trans i18nKey="userHasNoPermissionMessage.representativeHasNoPermission">
              <DisplayNameWordBreak>
                {{
                  representative: getUserDisplayName(delegate.representedBy),
                }}
              </DisplayNameWordBreak>{' '}
              cannot represent{' '}
              <DisplayNameWordBreak>
                {{ delegate: getUserDisplayName(delegateId) }}
              </DisplayNameWordBreak>{' '}
              because the user has an insufficient power level.
            </Trans>
          </Alert>
        )}
      </UserListItem>
    </React.Fragment>
  );
};
