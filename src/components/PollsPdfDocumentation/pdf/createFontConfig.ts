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

import pdfFonts from 'pdfmake/build/vfs_fonts';
import { TFontDictionary } from 'pdfmake/interfaces';
import { zapfdingbats } from './zapfdingbats';

type FontConfig = {
  vfs: Vfs;
  fonts: TFontDictionary;
};

type Vfs = { [file: string]: string };

export function createFontConfig(): FontConfig {
  const config: FontConfig = {
    vfs: {
      'ZapfDingbats.ttf': zapfdingbats,
    },
    fonts: {},
  };

  // Ignore types. Works for vite dev, build, preview.
  const vfs = pdfFonts as unknown as Vfs;
  Object.entries(vfs).forEach(([n, f]) => {
    config.vfs[n] = f;
  });

  config.fonts['Roboto'] = {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf',
  };
  config.fonts['ZapfDingbats'] = {
    normal: 'ZapfDingbats.ttf',
  };

  return config;
}
