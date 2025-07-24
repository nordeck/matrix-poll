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
import * as pdfMake from 'pdfmake/build/pdfmake';
import { SelectPollResults } from '../../../store';
import { createFontConfig } from './createFontConfig';
import { createPollPdfDefinition } from './createPollPdfDefinition';

export async function createPollPdf(params: {
  roomName: string;
  authorName: string;
  pollResults: SelectPollResults[];
  roomMemberEvents: StateEvent<RoomMemberStateEventContent>[];
  getUserDisplayName: (userId: string) => string;
}): Promise<Blob> {
  const cfg = createFontConfig();
  const documentDefinitions = createPollPdfDefinition(params);
  const pdf = pdfMake.createPdf(
    documentDefinitions,
    undefined,
    cfg.fonts,
    cfg.vfs,
  );

  return new Promise((resolve) => pdf.getBlob(resolve));
}
