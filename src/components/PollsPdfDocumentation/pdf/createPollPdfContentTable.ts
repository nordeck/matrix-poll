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
import { Content, ContentTable, TableCell } from 'pdfmake/interfaces';
import { getAnswerLabel } from '../../../lib/getAnswerLabel';
import { PollType } from '../../../model';
import {
  AnswerId,
  getVoteAnswerCount,
  GroupResult,
  PollInvalidAnswer,
  SelectPollResults,
  Votes,
} from '../../../store';

export function createPollPdfContentTable(
  pollResult: SelectPollResults,
  getUserDisplayName: (userId: string) => string
): Content {
  const answerIds: AnswerId[] = [
    ...pollResult.poll.content.answers.map((a) => a.id),
    PollInvalidAnswer,
  ];

  switch (pollResult.poll.content.pollType) {
    case PollType.ByName:
      if (pollResult.groupedResults) {
        return [
          Object.values(pollResult.groupedResults).map((group) =>
            generateTable({
              answerIds,
              body: [
                generateGroupRowHeader({
                  pollResult,
                  group,
                  answerIds,
                }),
                ...generateUserRows({
                  votes: group.votes,
                  answerIds,
                  getUserDisplayName,
                }),
              ],
            })
          ),
        ];
      }

      return [
        generateTable({
          answerIds,
          body: [
            generateRowHeader({
              pollResult,
              answerIds,
            }),
            ...generateUserRows({
              votes: pollResult.results.votes,
              answerIds,
              getUserDisplayName,
            }),
          ],
        }),
      ];

    case PollType.Open:
      if (pollResult.groupedResults) {
        return [
          [
            Object.values(pollResult.groupedResults).map((group) =>
              generateTable({
                answerIds,
                body: [
                  generateGroupRowHeader({
                    pollResult,
                    group,
                    answerIds,
                  }),
                ],
              })
            ),
          ],
        ];
      }

      return [];

    case PollType.Secret:
      return [];
  }
}

// to give the table columns fix size. we have for now just tow option 4 or 5
// columns and this function give the columns a suitable size depending on the
// answer size
function columnsSizeValue(answerCount: number): string[] {
  if (answerCount === 3) {
    return ['66%', '10%', '10%', '14%'];
  } else {
    return ['56%', '9%', '9%', '14%', '12%'];
  }
}

function generateTable(opts: {
  answerIds: AnswerId[];
  body: TableCell[][];
}): ContentTable {
  return {
    table: {
      widths: [...columnsSizeValue(opts.answerIds.length)],
      headerRows: 1,
      heights: 18,
      body: opts.body,
    },
  };
}

function generateRowHeader({
  pollResult,
  answerIds,
}: {
  pollResult: SelectPollResults;
  answerIds: AnswerId[];
}): TableCell[] {
  const votesByAnswer = getVoteAnswerCount(pollResult.results.votes);

  return [
    {
      text: '',
      fillColor: 'white',
      style: {
        alignment: 'left',
        bold: true,
        fontSize: 13,
        margin: [0, 5, 0, 0],
      },
      color: 'black',
    },
    ...answerIds.map((id) => {
      const label = getAnswerLabel(pollResult.poll, id, { t });
      const count = votesByAnswer[id] ?? 0;
      return {
        fillColor: 'white',
        color: 'black',
        style: 'tableHeader',
        type: 'none',
        text: `${label}\n${count}`,
      };
    }),
  ];
}

function generateGroupRowHeader({
  pollResult,
  group,
  answerIds,
}: {
  pollResult: SelectPollResults;
  group: GroupResult;
  answerIds: AnswerId[];
}): TableCell[] {
  const votesByAnswer = getVoteAnswerCount(group.votes);

  const radius = 15;
  const fontSize = 13;

  return [
    {
      columns: [
        {
          width: radius * 2 + 3,
          canvas: [
            {
              type: 'ellipse',
              x: radius,
              y: radius,
              color: group.color,
              r1: radius,
              r2: radius,
            },
          ],
        },
        {
          text: group.abbreviation,
          relativePosition: {
            y: radius - fontSize / 1.8,
          },
          style: {
            alignment: 'left',
            bold: true,
            fontSize,
          },
        },
      ],
    },
    ...answerIds.map((id) => {
      const label = getAnswerLabel(pollResult.poll, id, { t });
      const count = votesByAnswer[id] ?? 0;
      return {
        style: 'tableHeader',
        type: 'none',
        text: `${label}\n${count}`,
      };
    }),
  ];
}

// to separate the name and add break line if the name was to long
export function addBreakLineToTheName(name: string, answerIdsLength: number) {
  let userName;
  if (answerIdsLength === 3) {
    userName = name.match(/.{1,45}/g);
  } else {
    userName = name.match(/.{1,40}/g);
  }
  return userName?.join('\n');
}

function generateUserRows({
  votes,
  answerIds,
  getUserDisplayName,
}: {
  votes: Votes;
  answerIds: AnswerId[];
  getUserDisplayName: (userId: string) => string;
}): TableCell[][] {
  if (Object.entries(votes).length === 0) {
    return [
      [
        {
          style: {
            alignment: 'center',
          },
          text: t(
            'createPollPdfContentTable.noVotesWereCast',
            'No votes were cast.'
          ),
          colSpan: answerIds.length + 1,
        },
      ],
    ];
  }

  return Object.entries(votes).map(([userId, answerId]) => [
    {
      style: {
        alignment: 'left',
      },
      text: addBreakLineToTheName(getUserDisplayName(userId), answerIds.length),
    },
    ...answerIds.map((id) => ({
      style: 'tableBody',
      text: id === answerId ? 'X' : '',
    })),
  ]);
}
