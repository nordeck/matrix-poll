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
import { createAnswersColorScale, generateScale } from './helpers';

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

describe('createAnswersColorScale', () => {
  it('should repeat the colors if the answers are more then 7', () => {
    const answers = [
      'Yes',
      'No',
      'Maybe',
      'Of course',
      "I don't know yet",
      'Not sure',
      'Probably Yes',
      'Probably No',
    ];
    expect(createAnswersColorScale(answers, 'dark')).toEqual({
      "I don't know yet": '#40BFBD',
      Maybe: '#C29EFF',
      No: '#CBB701',
      'Not sure': '#EB8995',
      'Of course': '#F684BB',
      'Probably No': '#8AB3FF',
      'Probably Yes': '#ED905E',
      Yes: '#8AB3FF',
    });
  });
});
