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

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { zapfdingbats } from './zapfdingbats';

initializeFonts(pdfMake);

function initializeFonts(pdf: typeof pdfMake) {
  pdf.vfs = {
    'ZapfDingbats.ttf': zapfdingbats,
  };

  Object.entries(pdfFonts.pdfMake.vfs).forEach(([n, f]) => {
    pdf.vfs[n] = f;
  });

  pdf.fonts = {};
  pdf.fonts['Roboto'] = {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf',
  };
  pdf.fonts['ZapfDingbats'] = {
    normal: 'ZapfDingbats.ttf',
  };
}
