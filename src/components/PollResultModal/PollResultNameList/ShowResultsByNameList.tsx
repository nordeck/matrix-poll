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
import React, { ReactElement } from 'react';
import { usePollResults } from '../../../store';
import { UserResultItem } from './UserResultItem';

export type ShowResultsByNameListProps = {
  isFinished?: boolean;
  pollId: string;
  labelId?: string;
};

export function ShowResultsByNameList({
  isFinished = false,
  pollId,
  labelId,
}: ShowResultsByNameListProps): ReactElement {
  const { data: pollResults } = usePollResults(pollId, {
    includeInvalidVotes: isFinished,
  });

  if (!pollResults) {
    return <React.Fragment />;
  }

  return (
    <List aria-labelledby={labelId} dense>
      {Object.entries(pollResults.results.votes).map(([userId, answerId]) => (
        <UserResultItem
          answerId={answerId}
          key={userId}
          pollResult={pollResults}
          userId={userId}
        />
      ))}
    </List>
  );
}
