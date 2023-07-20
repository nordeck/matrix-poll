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

import { t } from 'i18next';
import { DateTime } from 'luxon';

const timeOnlyFormat = { hour: 'numeric', minute: 'numeric' };

const withDateFormat = {
  hour: 'numeric',
  minute: 'numeric',
  month: 'short',
  day: 'numeric',
};

export const formatPollDate = (
  date: string | undefined,
  endTime: string | undefined,
) => {
  const startDate = date ? DateTime.fromISO(date) : DateTime.now();
  const endDate = endTime ? DateTime.fromISO(endTime) : undefined;
  const isSameDay = endDate && startDate.hasSame(endDate, 'day');

  return t('pollDuration', '{{startDate, datetime}} - {{endDate, datetime}}', {
    startDate: startDate.toJSDate(),
    endDate: endDate?.toJSDate(),
    formatParams: {
      startDate: withDateFormat,
      endDate: isSameDay ? timeOnlyFormat : withDateFormat,
    },
  });
};
