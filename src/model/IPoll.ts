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
import { DateTime } from 'luxon';
import { isValidEvent } from './validation';

export const STATE_EVENT_POLL = 'net.nordeck.poll';

export enum PollType {
  Secret = 'secret',
  Open = 'open',
  ByName = 'byName',
}

export enum ResultType {
  Visible = 'visible',
  Invisible = 'invisible',
}

export interface IPollAnswer {
  id: string;
  label: string;
}

const pollAnswerSchema = Joi.object<IPollAnswer>({
  id: Joi.string().min(1).required(),
  label: Joi.string().min(1).required(),
}).unknown();

export type VotingRight =
  | {
      state: 'active';
    }
  | {
      state: 'invalid';
    }
  | {
      state: 'represented';
      representedBy: string;
    };

const votingRightBase = Joi.object<VotingRight, true>({
  state: Joi.string().valid('active', 'invalid').required(),
}).unknown();

const votingRightRepresented = Joi.object<VotingRight, true>({
  state: Joi.string().valid('represented').required(),
  representedBy: Joi.string().min(1).required(),
}).unknown();

const votingRightSchema = Joi.alternatives().conditional('.state', {
  switch: [
    { is: 'active', then: votingRightBase },
    { is: 'invalid', then: votingRightBase },
    { is: 'represented', then: votingRightRepresented },
  ],
});

export type VotingRights = Partial<Record<string, VotingRight>>;

export type PollGroup = {
  id: string;
  eventId: string;
  abbreviation: string;
  color: string;
  votingRights: VotingRights;
};

const pollGroupSchema = Joi.object<PollGroup, true>({
  id: Joi.string().min(1).required(),
  eventId: Joi.string().min(1).required(),
  abbreviation: Joi.string().min(1).required(),
  color: Joi.string().min(1).required(),
  votingRights: Joi.object()
    .pattern(Joi.string(), votingRightSchema)
    .required(),
}).unknown();

export interface IPoll {
  title: string;
  question: string;
  description: string;
  pollType: PollType;
  answers: Array<IPollAnswer>;
  duration: number;
  resultType: ResultType;
  startEventId?: string;
  startTime?: string;
  endTime?: string;
  groups?: PollGroup[];
}

const pollSchema = Joi.object<IPoll, true>({
  title: Joi.string().min(1).required(),
  question: Joi.string().min(1).required(),
  description: Joi.string().min(1).required(),
  pollType: Joi.string()
    .valid(...Object.values(PollType))
    .required(),
  answers: Joi.array().items(pollAnswerSchema).min(1).required(),
  duration: Joi.number().strict().required(),
  resultType: Joi.string()
    .valid(...Object.values(ResultType))
    .required(),
  startEventId: Joi.string(),
  startTime: Joi.string().isoDate(),
  endTime: Joi.string().isoDate(),
  groups: Joi.array().items(pollGroupSchema),
}).unknown();

export function isValidPollEvent(
  event: StateEvent<unknown>
): event is StateEvent<IPoll> {
  return isValidEvent(event, STATE_EVENT_POLL, pollSchema);
}

/**
 * Migrate from the old format of polls to the new one.
 *
 * Should be done on every read from the room.
 */
export function migratePollSchema(
  pollEvent: StateEvent<IPoll>
): StateEvent<IPoll> {
  if (
    pollEvent.content.startTime !== undefined &&
    pollEvent.content.endTime === undefined
  ) {
    return {
      ...pollEvent,
      content: {
        ...pollEvent.content,
        endTime: DateTime.fromISO(pollEvent.content.startTime)
          .plus({ minute: pollEvent.content.duration })
          .toISO(),
      },
    };
  }

  return pollEvent;
}
