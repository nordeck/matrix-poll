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
import { omit } from 'lodash';
import { isValidEvent } from './validation';

export const STATE_EVENT_POLL_GROUP = 'net.nordeck.poll.group';

export type MemberRole = 'delegate' | 'representative';

export interface MemberContent {
  memberRole: MemberRole;
}

export interface GroupContent {
  abbreviation: string;
  color: string;
  members: { [key: string]: MemberContent };
}

export type IGroup = StateEvent<GroupContent>;

const memberContentSchema = Joi.object<MemberContent, true>({
  // Optional for backward compatibility, is resolved during migration
  memberRole: Joi.string().valid('delegate', 'representative').optional(),
}).unknown();

const groupContentSchema = Joi.object<GroupContent, true>({
  abbreviation: Joi.string().min(1).required(),
  color: Joi.string().min(1).required(),
  members: Joi.object().pattern(Joi.string(), memberContentSchema).required(),
}).unknown();

export function isValidGroupEvent(
  event: StateEvent<unknown>
): event is StateEvent<GroupContent> {
  return isValidEvent(event, STATE_EVENT_POLL_GROUP, groupContentSchema);
}

/**
 * Migrate from the old format of poll groups to the new one.
 *
 * Should be done on every read from the room.
 */
export function migratePollGroupSchema(
  pollGroupEvent: StateEvent<GroupContent>
): StateEvent<GroupContent> {
  return {
    ...pollGroupEvent,
    content: {
      ...pollGroupEvent.content,
      members: Object.fromEntries(
        Object.entries(pollGroupEvent.content.members)
          // skip all member that have the obsolete `leaveDate` field set.
          .filter(([_, p]) => {
            if ('leaveDate' in p) {
              const { leaveDate } = p as unknown as {
                leaveDate: string;
              };

              return leaveDate === undefined;
            }

            return true;
          })
          .map(([userId, p]) => [
            userId,
            {
              // delete the obsolete fields
              ...omit(p, 'joinDate', 'leaveDate'),
              // make sure we can handle old groups that don't include a memberRole yet
              memberRole: p.memberRole ?? 'delegate',
            },
          ])
      ),
    },
  };
}
