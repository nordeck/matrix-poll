/*
 * Copyright 2023 Nordeck IT + Consulting GmbH
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
import { t } from 'i18next';
import { ContentText, TDocumentDefinitions } from 'pdfmake/interfaces';
import { SelectPollResults } from '../../../store';
import { createPollPdfContent } from './createPollPdfContent';
import { createPollPdfPageHeader } from './createPollPdfPageHeader';

export function createPollPdfDefinition({
  roomName,
  authorName,
  pollResults,
  roomMemberEvents,
  getUserDisplayName,
}: {
  roomName: string;
  authorName: string;
  pollResults: SelectPollResults[];
  roomMemberEvents: StateEvent<RoomMemberStateEventContent>[];
  getUserDisplayName: (userId: string) => string;
}): TDocumentDefinitions {
  return {
    pageMargins: [40, 80, 40, 40],
    pageSize: 'A4',
    content: createPollPdfContent({
      pollResults,
      getUserDisplayName,
    }),
    version: '1.5',
    info: {
      title: roomName,
      author: authorName,
    },
    styles: {
      tableHeader: {
        alignment: 'center',
        bold: true,
        fontSize: 13,
      },
      tableBody: {
        alignment: 'center',
      },
      list: {
        margin: [5, 0, 0, 0],
      },
    },
    header() {
      return createPollPdfPageHeader({
        roomName,
        roomMemberEvents,
      });
    },
    footer(currentPage, pageCount): ContentText {
      return {
        text: t('createPollPdfDefinition.footer', {
          defaultValue: '{{currentPage}} of {{pageCount}}',
          currentPage,
          pageCount,
        }) as string,
        alignment: 'center',
        margin: [10, 10],
      };
    },
  };
}
