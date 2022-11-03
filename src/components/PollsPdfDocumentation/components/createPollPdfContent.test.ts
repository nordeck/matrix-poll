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
import { mockPoll } from '../../../lib/testUtils';
import { createPollPdfContent } from './createPollPdfContent';
import { createPollPdfContentHeader as createPollPdfContentHeaderMocked } from './createPollPdfContentHeader';
import { createPollPdfContentTable as createPollPdfContentTableMocked } from './createPollPdfContentTable';
import { createPollSpecifics as createPollSpecificsMocked } from './createPollSpecifics';

jest.mock('./createPollPdfContentHeader');
jest.mock('./createPollSpecifics');
jest.mock('./createPollPdfContentTable');

const createPollPdfContentHeader =
  createPollPdfContentHeaderMocked as jest.MockedFunction<
    typeof createPollPdfContentHeaderMocked
  >;
const createPollSpecifics = createPollSpecificsMocked as jest.MockedFunction<
  typeof createPollSpecificsMocked
>;

const createPollPdfContentTable =
  createPollPdfContentTableMocked as jest.MockedFunction<
    typeof createPollPdfContentTableMocked
  >;

describe('createPollPdfContent', () => {
  const getUserDisplayName = (id: string) => `Name of ${id}`;

  it('should generate a pdf header and table', () => {
    const pollResult = {
      poll: mockPoll(),
      results: { votes: {} },
      votingRights: [],
    };

    createPollPdfContentHeader.mockReturnValue('createPollPdfContentHeader');
    createPollSpecifics.mockReturnValue('createPollSpecifics');
    createPollPdfContentTable.mockReturnValue('createPollPdfContentTable');

    expect(
      createPollPdfContent({
        pollResults: [pollResult, pollResult],
        context: {
          t,
          getUserDisplayName,
        },
      })
    ).toEqual([
      [
        {
          marginTop: 20,
          pageBreak: 'after',
          stack: [
            'createPollPdfContentHeader',
            'createPollSpecifics',
            'createPollPdfContentTable',
          ],
        },
        {
          marginTop: 20,
          pageBreak: undefined,
          stack: [
            'createPollPdfContentHeader',
            'createPollSpecifics',
            'createPollPdfContentTable',
          ],
        },
      ],
    ]);

    expect(createPollPdfContentHeader).toBeCalledTimes(2);
    expect(createPollPdfContentHeader).toBeCalledWith(0, pollResult, {
      t,
      getUserDisplayName,
    });
    expect(createPollPdfContentHeader).toBeCalledWith(1, pollResult, {
      t,
      getUserDisplayName,
    });

    expect(createPollPdfContentTable).toBeCalledTimes(2);
    expect(createPollPdfContentTable).toBeCalledWith(pollResult, {
      t,
      getUserDisplayName,
    });
  });
});
