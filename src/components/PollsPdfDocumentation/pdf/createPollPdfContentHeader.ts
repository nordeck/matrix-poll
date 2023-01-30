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

import { t } from 'i18next';
import { Content } from 'pdfmake/interfaces';
import { formatPollDate } from '../../../lib/formatPollDate';
import { getAnswerLabel } from '../../../lib/getAnswerLabel';
import { getPollTypeLabel } from '../../../lib/getPollTypeLabel';
import {
  AnswerId,
  getVoteAnswerCount,
  PollInvalidAnswer,
  SelectPollResults,
} from '../../../store';

export function createPollPdfContentHeader(
  pollIndex: number,
  pollResult: SelectPollResults
): Content {
  const pollTypeTitle = getPollTypeLabel(pollResult, t);

  const participantCount = pollResult.votingRights.length ?? 0;

  const voteCount = Object.values(pollResult.results.votes ?? {}).filter(
    (vote) => vote !== PollInvalidAnswer
  ).length;

  const answerIds: AnswerId[] = [
    ...pollResult.poll.content.answers.map((a) => a.id),
    PollInvalidAnswer,
  ];
  const votesByAnswer = getVoteAnswerCount(pollResult.results.votes);

  return [
    {
      style: 'tableExample',
      color: '#444',
      table: {
        widths: ['65%', '35%'],
        headerRows: 1,
        body: [
          [
            {
              text: `${pollIndex + 1} - ${pollResult.poll.content.title}`,
              style: 'tableHeader',
              fillColor: '#aaa',
              alignment: 'left',
            },
            {
              text: `${pollTypeTitle}`,
              style: 'tableHeader',
              fillColor: '#aaa',
              alignment: 'center',
            },
          ],
          [
            [
              {
                text: t(
                  'createPollPdfContentHeader.general',
                  'General information'
                ),
                alignment: 'left',
                decoration: 'underline',
                lineHeight: 1,
                margin: [0, 2],
              },
              {
                text: formatPollDate(
                  pollResult.poll.content.startTime,
                  pollResult.poll.content.endTime
                ),
                alignment: 'left',
                lineHeight: 1.5,
              },
              {
                text: t(
                  'createPollPdfContentHeader.votingInformation',
                  'Voting information'
                ),
                alignment: 'left',
                decoration: 'underline',
                lineHeight: 1,
                margin: [0, 2],
              },
              {
                ul: [
                  {
                    text: t(
                      'createPollPdfContentHeader.eligibleMembers',
                      'Voting persons: {{count}}',
                      { count: participantCount }
                    ),
                    alignment: 'left',
                  },
                ],
                style: 'list',
              },
            ],
            [
              [
                {
                  text: `${t(
                    'createPollPdfContentHeader.totalVotingResult',
                    'Total voting result'
                  )}`,
                  alignment: 'left',
                  decoration: 'underline',
                  margin: [0, 2],
                },
                {
                  text: t(
                    'createPollPdfContentHeader.castVotes',
                    'Cast votes: {{count}}',
                    { count: voteCount }
                  ),
                  alignment: 'left',
                  margin: [0, 2],
                },
                answerIds.map((id) => {
                  const answerCount = votesByAnswer[id] ?? 0;
                  return {
                    ul: [
                      {
                        text: `${getAnswerLabel(pollResult.poll, id, {
                          t,
                        })}: ${answerCount}`,
                        alignment: 'left',
                      },
                    ],
                    style: 'list',
                  };
                }),
              ],
            ],
          ],
          [
            {
              text: t('createPollPdfContentHeader.description', 'Description'),
              colSpan: 2,
              border: [true, false, true, false],
              decoration: 'underline',
            },
          ],
          [
            {
              text: pollResult.poll.content.description,
              colSpan: 2,
              border: [true, false, true, true],
              margin: [0, 3],
            },
          ],
          [
            {
              text: t('createPollPdfContentHeader.question', 'Voting question'),
              colSpan: 2,
              border: [true, false, true, false],
              decoration: 'underline',
            },
          ],
          [
            {
              text: pollResult.poll.content.question,
              style: 'tableHeader',
              colSpan: 2,
              bold: true,
              fontSize: 14,
              alignment: 'left',
              border: [true, false, true, true],
              margin: [0, 3],
            },
          ],
        ],
      },
    },
  ];
}
