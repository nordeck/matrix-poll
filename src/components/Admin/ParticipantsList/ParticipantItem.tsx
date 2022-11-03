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

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ClearIcon from '@mui/icons-material/Clear';
import { IconButton, Tooltip } from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import { t } from 'i18next';
import { ReactElement, useCallback } from 'react';
import { UserListItem } from '../../UserListItem/UserListItem';

type ParticipantItemProps = {
  type: 'representative' | 'delegate';
  memberId: string;
  onRemoveMember?: (participant: string) => void;
  onChangeDelegation?: (
    participant: string,
    type: 'representative' | 'delegate'
  ) => void;
};

export function ParticipantItem({
  type,
  memberId,
  onRemoveMember,
  onChangeDelegation,
}: ParticipantItemProps): ReactElement {
  const popUpContent =
    type === 'delegate'
      ? t('participantItem.changeToRepresentative', 'Change to representative')
      : t('participantItem.changeToDelegate', 'Change to delegate');

  const handleChangeDelegation = useCallback(() => {
    if (onChangeDelegation) {
      onChangeDelegation(memberId, type);
    }
  }, [memberId, onChangeDelegation, type]);

  const handleClickDelete = useCallback(() => {
    if (onRemoveMember) {
      onRemoveMember(memberId);
    }
  }, [memberId, onRemoveMember]);

  const deleteButtonTitle = t('participantItem.deleteButton', 'Remove');

  const titleId = useId();

  return (
    <UserListItem
      ListItemProps={{ disableGutters: true }}
      titleId={titleId}
      userId={memberId}
    >
      {onRemoveMember && onChangeDelegation && (
        <>
          <Tooltip title={popUpContent}>
            <IconButton
              aria-describedby={titleId}
              aria-label={popUpContent}
              onClick={handleChangeDelegation}
            >
              {type === 'delegate' ? (
                <ArrowDownwardIcon />
              ) : (
                <ArrowUpwardIcon />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip title={deleteButtonTitle}>
            <IconButton
              aria-describedby={titleId}
              aria-label={deleteButtonTitle}
              onClick={handleClickDelete}
            >
              <ClearIcon />
            </IconButton>
          </Tooltip>
        </>
      )}
    </UserListItem>
  );
}
