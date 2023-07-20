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
import { PollInvalidAnswer } from '../../store';
import { mockPoll } from '../testUtils';
import { getAnswerLabel } from './getAnswerLabel';

describe('getAnswerLabel', () => {
  it('should return answer label', () => {
    expect(getAnswerLabel(mockPoll(), '1', { t })).toBe('Yes');
  });

  it('should return fallback label if answerId is not known', () => {
    expect(getAnswerLabel(mockPoll(), 'invalid', { t })).toBe('Invalid');
  });

  it('should return fallback label if answer is invalid', () => {
    expect(getAnswerLabel(mockPoll(), PollInvalidAnswer, { t })).toBe(
      'Invalid',
    );
  });
});
