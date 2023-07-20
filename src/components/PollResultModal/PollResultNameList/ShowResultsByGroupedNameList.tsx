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

import { List } from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { GroupResult, SelectPollResults, usePollResults } from '../../../store';
import { GroupHeader } from '../../GroupHeader';
import { ListEmptyState } from '../../ListEmptyState';
import { ShowResultsByNameListProps } from './ShowResultsByNameList';
import { UserResultItem } from './UserResultItem';

export function ShowResultsByGroupedNameList({
  isFinished = false,
  pollId,
}: ShowResultsByNameListProps): ReactElement {
  const { data: pollResults } = usePollResults(pollId, {
    includeInvalidVotes: isFinished,
  });

  if (!pollResults || !pollResults.groupedResults) {
    return <React.Fragment />;
  }

  return (
    <>
      {Object.entries(pollResults.groupedResults).map(([groupId, group]) => (
        <GroupedNameList
          group={group}
          key={groupId}
          pollResults={pollResults}
        />
      ))}
    </>
  );
}

function GroupedNameList({
  group,
  pollResults,
}: {
  group: GroupResult;
  pollResults: SelectPollResults;
}) {
  const labelId = useId();
  const { t } = useTranslation();

  return (
    <>
      <GroupHeader group={group} id={labelId} />

      <List aria-labelledby={labelId} dense>
        {Object.entries(group.votes).map(([userId, answerId]) => (
          <UserResultItem
            answerId={answerId}
            key={userId}
            pollResult={pollResults}
            userId={userId}
          />
        ))}

        {Object.entries(group.votes).length === 0 && (
          <ListEmptyState
            message={t(
              'showResultsByGroupedNameList.noVotesWereCast',
              'No votes were cast.',
            )}
          />
        )}
      </List>
    </>
  );
}
