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

import { List, ListSubheader } from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import { ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ListEmptyState } from '../../ListEmptyState';
import { ParticipantItem } from './ParticipantItem';

type ParticipantsListProps = {
  type: 'representative' | 'delegate';
  members: string[];
  onRemoveMember?: (participant: string) => void;
  onChangeDelegation?: (
    participant: string,
    type: 'representative' | 'delegate',
  ) => void;
};

export function ParticipantsList({
  type,
  members,
  onRemoveMember,
  onChangeDelegation,
}: ParticipantsListProps): ReactElement {
  const { t } = useTranslation();
  const groupTitleId = useId();

  const { title, emptyState } = useMemo(() => {
    if (type === 'delegate') {
      return {
        title: t('participantsList.delegate', 'Delegates: {{count}}', {
          count: members.length,
        }),
        emptyState: t(
          'participantsList.noDelegate',
          'No delegates have been assigned yet.',
        ),
      };
    }

    return {
      title: t(
        'participantsList.representative',
        'Representatives: {{count}}',
        { count: members.length },
      ),
      emptyState: t(
        'participantsList.noRepresentative',
        'No representatives have been assigned yet.',
      ),
    };
  }, [members.length, t, type]);

  return (
    <List
      aria-labelledby={groupTitleId}
      dense
      subheader={
        <ListSubheader
          aria-hidden="true"
          disableGutters
          disableSticky
          id={groupTitleId}
        >
          {title}
        </ListSubheader>
      }
    >
      {members.length > 0 ? (
        members.map((m) => (
          <ParticipantItem
            key={m}
            memberId={m}
            onChangeDelegation={onChangeDelegation}
            onRemoveMember={onRemoveMember}
            type={type}
          />
        ))
      ) : (
        <ListEmptyState message={emptyState} />
      )}
    </List>
  );
}
