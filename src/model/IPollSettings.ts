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
import Joi from 'joi';
import { isValidEvent } from './validation';

export const STATE_EVENT_POLL_SETTINGS = 'net.nordeck.poll.settings';

export interface IPollSettings {
  pdfButtonDisabledAfter?: string;
  pollsOrder?: Array<string>;
}

const settingsSchema = Joi.object<IPollSettings, true>({
  pdfButtonDisabledAfter: Joi.string().isoDate(),
  pollsOrder: Joi.array().items(Joi.string()),
}).unknown();

export function isValidPollSettingsEvent(
  event: StateEvent<unknown>,
): event is StateEvent<IPollSettings> {
  return isValidEvent(event, STATE_EVENT_POLL_SETTINGS, settingsSchema);
}
