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

import { generateScale } from './helpers';

describe('generateScale', () => {
  it('should generate an array of even numbers for the chart bar', () => {
    const result: Array<{ value: number }> = [
      { value: 2 },
      { value: 5 },
      { value: 9 },
    ];
    expect(generateScale(result)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('should generate an array with default value if there is no result', () => {
    const result: Array<{ value: number }> = [];
    expect(generateScale(result)).toEqual([0]);
  });
});
