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

import {
  RoomMemberStateEventContent,
  StateEvent,
} from '@matrix-widget-toolkit/api';
import { Column, Content } from 'pdfmake/interfaces';
import { Context } from './types';

export function createPdfPageHeader(opts: {
  roomName: string;
  roomMemberEvents: StateEvent<RoomMemberStateEventContent>[];
  context: Context;
}): Content {
  const { roomName, roomMemberEvents, context } = opts;
  const { t } = context;

  const invitedUsersCount = roomMemberEvents.filter(
    (e) => e.content.membership === 'invite'
  ).length;
  const joinedUsersCount = roomMemberEvents.filter(
    (e) => e.content.membership === 'join'
  ).length;

  return [
    {
      stack: [
        {
          text: roomName,
          alignment: 'center',
          bold: true,
          fontSize: 20,
          margin: [0, 30, 0, 10],
        },
        {
          columns: [
            {
              width: '*',
              alignment: 'right',
              text: t(
                'createPollPdfContentHeader.joinedMembers',
                'Joined persons: {{count}}',
                { count: joinedUsersCount }
              ),
            } as Column,
            {
              width: '*',
              text: t(
                'createPollPdfContentHeader.invitedMembers',
                'Invited persons: {{count}}',
                { count: invitedUsersCount }
              ),
            } as Column,
          ],
          columnGap: 30,
        },
      ],
    },
  ];
}
