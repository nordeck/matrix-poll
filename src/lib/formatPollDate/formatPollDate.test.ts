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

import { formatPollDate } from './formatPollDate';

describe('formatPollDate', () => {
  it('should format short poll duration if start and end is on the same day', () => {
    expect(
      formatPollDate('2022-07-18T17:31:00Z', '2022-07-18T17:41:00Z'),
    ).toEqual('Jul 18, 5:31 PM - 5:41 PM');
  });

  it('should format long poll duration if start and end is on the same day', () => {
    expect(
      formatPollDate('2022-07-18T17:31:00Z', '2022-07-19T03:31:00.000Z'),
    ).toEqual('Jul 18, 5:31 PM - Jul 19, 3:31 AM');
  });
});
