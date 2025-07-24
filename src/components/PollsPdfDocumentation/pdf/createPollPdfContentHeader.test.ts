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

import { describe, expect, it } from 'vitest';
import { mockPoll } from '../../../lib/testUtils';
import { PollInvalidAnswer, SelectPollResults } from '../../../store';
import { createPollPdfContentHeader } from './createPollPdfContentHeader';

describe('createPollPdfContentHeader', () => {
  it('should generate a header without groups on a single day', () => {
    const pollResult: SelectPollResults = {
      poll: mockPoll({
        content: {
          startTime: '2020-01-01T03:33:55Z',
          endTime: '2020-01-01T03:34:55Z',
        },
      }),
      results: {
        votes: {
          '@user-1': '1',
          '@user-2': PollInvalidAnswer,
        },
      },
      votingRights: ['@user-1', '@user-2'],
    };

    expect(createPollPdfContentHeader(5, pollResult)).toEqual([
      {
        color: '#444',
        style: 'tableExample',
        table: {
          body: [
            [
              {
                alignment: 'left',
                fillColor: '#aaa',
                style: 'tableHeader',
                text: '6 - My Title',
              },
              {
                alignment: 'center',
                fillColor: '#aaa',
                style: 'tableHeader',
                text: 'Open poll',
              },
            ],
            [
              [
                {
                  alignment: 'left',
                  decoration: 'underline',
                  lineHeight: 1,
                  margin: [0, 2],
                  text: 'General information',
                },
                {
                  alignment: 'left',
                  lineHeight: 1.5,
                  text: 'Jan 1, 3:33 AM - 3:34 AM',
                },
                {
                  alignment: 'left',
                  decoration: 'underline',
                  lineHeight: 1,
                  margin: [0, 2],
                  text: 'Voting information',
                },
                {
                  ul: [{ alignment: 'left', text: 'Voting persons: 2' }],
                  style: 'list',
                },
              ],
              [
                [
                  {
                    alignment: 'left',
                    decoration: 'underline',
                    margin: [0, 2],
                    text: 'Total voting result',
                  },
                  { alignment: 'left', margin: [0, 2], text: 'Cast votes: 1' },
                  [
                    {
                      ul: [{ text: 'Yes: 1', alignment: 'left' }],
                      style: 'list',
                    },
                    {
                      ul: [{ text: 'No: 0', alignment: 'left' }],
                      style: 'list',
                    },
                    {
                      ul: [{ text: 'Invalid: 1', alignment: 'left' }],
                      style: 'list',
                    },
                  ],
                ],
              ],
            ],
            [
              {
                border: [true, false, true, false],
                colSpan: 2,
                decoration: 'underline',
                text: 'Description',
              },
            ],
            [
              {
                border: [true, false, true, true],
                colSpan: 2,
                margin: [0, 3],
                text: 'My Description',
              },
            ],
            [
              {
                border: [true, false, true, false],
                colSpan: 2,
                decoration: 'underline',
                text: 'Voting question',
              },
            ],
            [
              {
                alignment: 'left',
                bold: true,
                border: [true, false, true, true],
                colSpan: 2,
                fontSize: 14,
                margin: [0, 3],
                style: 'tableHeader',
                text: 'My Question',
              },
            ],
          ],
          headerRows: 1,
          widths: ['65%', '35%'],
        },
      },
    ]);
  });

  it('should generate a header with groups on a single day', () => {
    const pollResult: SelectPollResults = {
      poll: mockPoll({
        content: {
          startTime: '2020-01-01T03:33:55Z',
          endTime: '2020-01-01T03:34:55Z',
        },
      }),
      results: {
        votes: {
          '@user-1': '1',
          '@user-2': PollInvalidAnswer,
        },
      },
      votingRights: ['@user-1', '@user-2'],
      groupedResults: {
        'group-1': {
          abbreviation: 'Group 1',
          color: '#ff0000',
          votes: {
            '@user-1': '1',
            '@user-2': PollInvalidAnswer,
          },
          invalidVoters: {},
        },
        'group-2': {
          abbreviation: 'Group 2',
          color: '#0000ff',
          votes: {},
          invalidVoters: {},
        },
      },
    };

    expect(createPollPdfContentHeader(5, pollResult)).toEqual([
      {
        color: '#444',
        style: 'tableExample',
        table: {
          body: [
            [
              {
                alignment: 'left',
                fillColor: '#aaa',
                style: 'tableHeader',
                text: '6 - My Title',
              },
              {
                alignment: 'center',
                fillColor: '#aaa',
                style: 'tableHeader',
                text: 'Open poll (grouped)',
              },
            ],
            [
              [
                {
                  alignment: 'left',
                  decoration: 'underline',
                  lineHeight: 1,
                  margin: [0, 2],
                  text: 'General information',
                },
                {
                  alignment: 'left',
                  lineHeight: 1.5,
                  text: 'Jan 1, 3:33 AM - 3:34 AM',
                },
                {
                  alignment: 'left',
                  decoration: 'underline',
                  lineHeight: 1,
                  margin: [0, 2],
                  text: 'Voting information',
                },
                {
                  ul: [{ alignment: 'left', text: 'Voting persons: 2' }],
                  style: 'list',
                },
              ],
              [
                [
                  {
                    alignment: 'left',
                    decoration: 'underline',
                    margin: [0, 2],
                    text: 'Total voting result',
                  },
                  { alignment: 'left', margin: [0, 2], text: 'Cast votes: 1' },
                  [
                    {
                      ul: [{ text: 'Yes: 1', alignment: 'left' }],
                      style: 'list',
                    },
                    {
                      ul: [{ text: 'No: 0', alignment: 'left' }],
                      style: 'list',
                    },
                    {
                      ul: [{ text: 'Invalid: 1', alignment: 'left' }],
                      style: 'list',
                    },
                  ],
                ],
              ],
            ],
            [
              {
                border: [true, false, true, false],
                colSpan: 2,
                decoration: 'underline',
                text: 'Description',
              },
            ],
            [
              {
                border: [true, false, true, true],
                colSpan: 2,
                margin: [0, 3],
                text: 'My Description',
              },
            ],
            [
              {
                border: [true, false, true, false],
                colSpan: 2,
                decoration: 'underline',
                text: 'Voting question',
              },
            ],
            [
              {
                alignment: 'left',
                bold: true,
                border: [true, false, true, true],
                colSpan: 2,
                fontSize: 14,
                margin: [0, 3],
                style: 'tableHeader',
                text: 'My Question',
              },
            ],
          ],
          headerRows: 1,
          widths: ['65%', '35%'],
        },
      },
    ]);
  });

  it('should generate a header on multiple days', () => {
    const pollResult: SelectPollResults = {
      poll: mockPoll({
        content: {
          startTime: '2020-01-01T03:33:55Z',
          endTime: '2020-01-02T12:53:55Z',
        },
      }),
      results: {
        votes: {
          '@user-1': '1',
          '@user-2': PollInvalidAnswer,
        },
      },
      votingRights: ['@user-1', '@user-2'],
      groupedResults: {
        'group-1': {
          abbreviation: 'Group 1',
          color: '#ff0000',
          votes: {
            '@user-1': '1',
            '@user-2': PollInvalidAnswer,
          },
          invalidVoters: {},
        },
        'group-2': {
          abbreviation: 'Group 2',
          color: '#0000ff',
          votes: {},
          invalidVoters: {},
        },
      },
    };

    expect(createPollPdfContentHeader(5, pollResult)).toEqual([
      {
        color: '#444',
        style: 'tableExample',
        table: {
          body: [
            [
              {
                alignment: 'left',
                fillColor: '#aaa',
                style: 'tableHeader',
                text: '6 - My Title',
              },
              {
                alignment: 'center',
                fillColor: '#aaa',
                style: 'tableHeader',
                text: 'Open poll (grouped)',
              },
            ],
            [
              [
                {
                  alignment: 'left',
                  decoration: 'underline',
                  lineHeight: 1,
                  margin: [0, 2],
                  text: 'General information',
                },
                {
                  alignment: 'left',
                  lineHeight: 1.5,
                  text: 'Jan 1, 3:33 AM - Jan 2, 12:53 PM',
                },
                {
                  alignment: 'left',
                  decoration: 'underline',
                  lineHeight: 1,
                  margin: [0, 2],
                  text: 'Voting information',
                },
                {
                  ul: [{ alignment: 'left', text: 'Voting persons: 2' }],
                  style: 'list',
                },
              ],
              [
                [
                  {
                    alignment: 'left',
                    decoration: 'underline',
                    margin: [0, 2],
                    text: 'Total voting result',
                  },
                  { alignment: 'left', margin: [0, 2], text: 'Cast votes: 1' },
                  [
                    {
                      ul: [{ text: 'Yes: 1', alignment: 'left' }],
                      style: 'list',
                    },
                    {
                      ul: [{ text: 'No: 0', alignment: 'left' }],
                      style: 'list',
                    },
                    {
                      ul: [{ text: 'Invalid: 1', alignment: 'left' }],
                      style: 'list',
                    },
                  ],
                ],
              ],
            ],
            [
              {
                border: [true, false, true, false],
                colSpan: 2,
                decoration: 'underline',
                text: 'Description',
              },
            ],
            [
              {
                border: [true, false, true, true],
                colSpan: 2,
                margin: [0, 3],
                text: 'My Description',
              },
            ],
            [
              {
                border: [true, false, true, false],
                colSpan: 2,
                decoration: 'underline',
                text: 'Voting question',
              },
            ],
            [
              {
                alignment: 'left',
                bold: true,
                border: [true, false, true, true],
                colSpan: 2,
                fontSize: 14,
                margin: [0, 3],
                style: 'tableHeader',
                text: 'My Question',
              },
            ],
          ],
          headerRows: 1,
          widths: ['65%', '35%'],
        },
      },
    ]);
  });
});
