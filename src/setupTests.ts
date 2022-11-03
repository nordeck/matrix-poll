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

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { Settings } from 'luxon';
// Make sure to initialize i18n (see mock below)
import './i18n';

// Use a different configuration for i18next during tests
jest.mock('./i18n', () => {
  const i18n = require('i18next');
  const { initReactI18next } = require('react-i18next');

  i18n.use(initReactI18next).init({
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    resources: { en: {} },
  });

  return i18n;
});

// store original instance
const DateTimeFormat = Intl.DateTimeFormat;
function mockDateTimeFormatTimeZone(timeZone: string): void {
  jest
    .spyOn(Intl, 'DateTimeFormat')
    .mockImplementation(
      (locale, options) => new DateTimeFormat(locale, { ...options, timeZone })
    );
}

beforeEach(() => {
  // We want our tests to be in a reproducible time zone, always resulting in
  // the same results, independent from where they are run.
  mockDateTimeFormatTimeZone('UTC');
});

// Disable the warning that we don't have canvas support in tests, as we are
// currently unable to install the `canvas` package in the CI.
window.HTMLCanvasElement.prototype.getContext = function () {
  return null;
};

// Provide mocks for the object URL related
// functions that are not provided by jsdom.
window.URL.createObjectURL = jest.fn();
window.URL.revokeObjectURL = jest.fn();

// We want our tests to be in a reproducible time zone, always resulting in
// the same results, independent from where they are run.
Settings.defaultZone = 'UTC';
Settings.defaultLocale = 'en';

// Add support for jest-axe
expect.extend(toHaveNoViolations);
