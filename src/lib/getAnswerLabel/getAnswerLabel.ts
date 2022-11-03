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

import { StateEvent } from '@matrix-widget-toolkit/api';
import { TFunction } from 'i18next';
import { IPoll } from '../../model';
import { AnswerId } from '../../store';

/**
 * Returns the label of an answer.
 *
 * @param pollEvent - the poll event that defines the answers.
 * @param answerId - the id of the answer.
 * @param context - a context with an instance of the translation engine.
 * @returns the answer label, or a translated "invalid" value if no
 *          answer was given or no answer with the given id exists.
 */
export function getAnswerLabel(
  pollEvent: StateEvent<IPoll>,
  answerId: AnswerId | undefined,
  context: { t: TFunction }
): string {
  if (typeof answerId === 'string') {
    const answer = pollEvent.content.answers.find((a) => a.id === answerId);

    if (answer) {
      return answer.label;
    }
  }

  return context.t('getAnswerLabel.invalidAnswer', 'Invalid');
}
