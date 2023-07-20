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
import { isDefined } from '../../../lib/utils';
import { SelectPollResults } from '../../../store';

export function createPollPdfSpecifics(
  pollResult: SelectPollResults,
  getUserDisplayName: (userId: string) => string,
): Content {
  const pollGroups = pollResult.poll.content.groups;

  const representativeList = pollGroups?.flatMap((g) =>
    Object.entries(g.votingRights)
      .map(([userId, state]) => {
        if (state?.state === 'represented') {
          return {
            group: g.abbreviation,
            representedBy: state.representedBy,
            delegate: userId,
          };
        } else if (state?.state === 'invalid') {
          return {
            group: g.abbreviation,
            delegate: userId,
          };
        }

        return undefined;
      })
      .filter(isDefined),
  );

  if (!pollGroups || !representativeList?.length) {
    return [];
  }

  return [
    {
      style: 'tableExample',
      color: '#444',
      table: {
        widths: ['100%'],
        body: [
          [
            [
              {
                text: t('createPollSpecifics.specifics', 'Specifics'),
                decoration: 'underline',
                margin: [0, 2],
              },
              {
                ul: [
                  ...representativeList.map((r) => ({
                    text: [
                      t(
                        'createPollSpecifics.messageAbsent',
                        'Absent: {{delegate}} ({{group}})',
                        {
                          delegate: getUserDisplayName(r.delegate),
                          group: r.group,
                        },
                      ),
                      ...(r.representedBy
                        ? [
                            { text: ' ➔ ', font: 'ZapfDingbats' },
                            t(
                              'createPollSpecifics.messageRepresented',
                              'Represented by: {{delegate}} ({{group}})',
                              {
                                delegate: getUserDisplayName(r.representedBy),
                                group: r.group,
                              },
                            ),
                          ]
                        : []),
                    ],
                    alignment: 'left',
                  })),
                ],
                style: 'list',
              },
            ],
          ],
        ],
      },
    },
  ];
}
