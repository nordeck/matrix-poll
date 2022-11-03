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

import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Stack, Typography } from '@mui/material';
import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { IPoll, ResultType } from '../../model';

type PollCardCanNotVoteContentProps = {
  poll: IPoll;
};

export function PollCardCanNotVoteContent({
  poll,
}: PollCardCanNotVoteContentProps): ReactElement {
  const { t } = useTranslation();

  return (
    <Stack alignItems="center" mt={1} spacing={1} textAlign="center">
      <VisibilityOffIcon sx={{ fontSize: '5em' }} />

      <Typography variant="body1">
        {poll.resultType === ResultType.Visible
          ? t(
              'voteView.resultVisibleAfterFirstVote',
              'You will see the result as soon as a first vote has been cast.'
            )
          : t(
              'voteView.resultIsInvisible',
              'You will see the result when the voting ends.'
            )}
      </Typography>
    </Stack>
  );
}
