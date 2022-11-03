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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { getAnswerLabel } from '../../../lib/getAnswerLabel';
import {
  AnswerId,
  getVoteAnswerCount,
  PollInvalidAnswer,
  SelectPollResults,
} from '../../../store';

export type PollResultTableProps = {
  pollResults: SelectPollResults;
  isFinished?: boolean;
  'aria-labelledby'?: string;
};

export function PollResultTable({
  isFinished,
  pollResults,
  'aria-labelledby': ariaLabelledBy,
}: PollResultTableProps): ReactElement {
  const { t } = useTranslation();

  const answerIds: AnswerId[] = isFinished
    ? [...pollResults.poll.content.answers.map((a) => a.id), PollInvalidAnswer]
    : [...pollResults.poll.content.answers.map((a) => a.id)];
  const votesByAnswer = getVoteAnswerCount(pollResults.results.votes);

  return (
    <Table aria-labelledby={ariaLabelledBy} size="small">
      <TableHead>
        <TableRow>
          <TableCell>{t('pollResultTable.answer', 'Answer')}</TableCell>
          <TableCell align="right">
            {t('pollResultTable.count', 'Count')}
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {answerIds.map((answerId, key) => (
          <TableRow key={key}>
            <TableCell component="th" scope="row">
              {getAnswerLabel(pollResults.poll, answerId, { t })}
            </TableCell>
            <TableCell
              align="right"
              sx={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {votesByAnswer[answerId] ?? 0}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
