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
import { groupBy } from 'lodash';
import React, { ReactElement } from 'react';
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

export function PollResultGroupedTable({
  isFinished,
  pollResults,
  'aria-labelledby': ariaLabelledBy,
}: PollResultTableProps): ReactElement {
  const { t } = useTranslation();

  const answerIds: AnswerId[] = isFinished
    ? [...pollResults.poll.content.answers.map((a) => a.id), PollInvalidAnswer]
    : [...pollResults.poll.content.answers.map((a) => a.id)];

  if (!pollResults.groupedResults) {
    return <React.Fragment />;
  }

  const groupedResults = groupBy(
    Object.values(pollResults.groupedResults).flatMap((group) => {
      const votesByAnswer = getVoteAnswerCount(group.votes);
      return answerIds.map((p) => {
        const answerCount = votesByAnswer[p];
        return {
          group: group.abbreviation,
          answer: getAnswerLabel(pollResults.poll, p, { t }),
          value: answerCount ?? 0,
        };
      });
    }),
    (r) => r.answer,
  );

  return (
    <Table aria-labelledby={ariaLabelledBy} size="small">
      <TableHead>
        <TableRow>
          <TableCell>{t('pollResultTable.answer', 'Answer')}</TableCell>
          <TableCell>{t('pollResultTable.group', 'Group')}</TableCell>
          <TableCell align="right">
            {t('pollResultTable.count', 'Count')}
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Object.entries(groupedResults).map(([answer, results], ai) => {
          const totalResult = results.reduce((s, r) => s + r.value, 0);

          return (
            <React.Fragment key={ai}>
              <TableRow>
                <TableCell
                  component="th"
                  rowSpan={results.length + 1}
                  scope="rowgroup"
                  sx={{ verticalAlign: 'initial' }}
                >
                  {answer}
                </TableCell>

                <TableCell component="th" scope="row">
                  {t('pollResultTable.total', 'Total')}
                </TableCell>

                <TableCell
                  align="right"
                  sx={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {totalResult}
                </TableCell>
              </TableRow>

              {results.map((result, gi) => (
                <TableRow key={gi}>
                  <TableCell component="th" scope="row">
                    {result.group}
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {result.value}
                  </TableCell>
                </TableRow>
              ))}
            </React.Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
