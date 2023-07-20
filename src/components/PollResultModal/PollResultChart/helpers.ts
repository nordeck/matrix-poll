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

import { Theme } from '@matrix-widget-toolkit/react';
import { max, range } from 'lodash';

export function generateScale(results: Array<{ value: number }>): number[] {
  const maxValue = max(results.map((r) => r.value)) ?? 0;

  return range(0, maxValue + 1);
}

const lightThemeColors = [
  '#0A60FF',
  '#5B5201',
  '#7B24FF',
  '#A20B54',
  '#1F5C5A',
  '#9E1F2E',
  '#8A3A0F',
];
const darkThemeColors = [
  '#8AB3FF',
  '#CBB701',
  '#C29EFF',
  '#F684BB',
  '#40BFBD',
  '#EB8995',
  '#ED905E',
];

export function createAnswersColorScale(
  answers: string[],
  theme: Theme,
): Record<string, string> {
  const themeColors = theme === 'dark' ? darkThemeColors : lightThemeColors;

  return Object.fromEntries(
    answers.map((answer, i) => [answer, themeColors[i % themeColors.length]]),
  );
}
