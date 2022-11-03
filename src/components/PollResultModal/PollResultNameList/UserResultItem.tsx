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

import { Typography } from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import { useTranslation } from 'react-i18next';
import { getAnswerLabel } from '../../../lib/getAnswerLabel';
import { AnswerId, SelectPollResults } from '../../../store';
import { UserListItem } from '../../UserListItem';

type UserResultItemProps = {
  userId: string;
  pollResult: SelectPollResults;
  answerId: AnswerId | undefined;
};

export function UserResultItem({
  userId,
  pollResult,
  answerId,
}: UserResultItemProps) {
  const { t } = useTranslation();
  const descriptionId = useId();

  return (
    <UserListItem
      ListItemProps={{ 'aria-describedby': descriptionId }}
      userId={userId}
    >
      <Typography id={descriptionId}>
        {getAnswerLabel(pollResult.poll, answerId, { t })}
      </Typography>
    </UserListItem>
  );
}
