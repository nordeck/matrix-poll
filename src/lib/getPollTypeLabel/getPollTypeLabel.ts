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

import { TFunction } from 'i18next';
import { PollType } from '../../model';
import { SelectPollResults } from '../../store';

export function getPollTypeLabel(
  pollResult: SelectPollResults,
  t: TFunction,
): string {
  const pollType = pollResult.poll.content.pollType;

  if (pollResult.groupedResults) {
    switch (pollType) {
      case PollType.ByName:
        return t('getPollTypeLabel.titleWithGroups', 'Poll by name (grouped)', {
          context: 'byName',
        });

      case PollType.Secret:
        return t('getPollTypeLabel.titleWithGroups', 'Secret poll (grouped)', {
          context: 'secret',
        });

      case PollType.Open:
        return t('getPollTypeLabel.titleWithGroups', 'Open poll (grouped)', {
          context: 'open',
        });
    }
  } else {
    switch (pollType) {
      case PollType.ByName:
        return t('getPollTypeLabel.title', 'Poll by name', {
          context: 'byName',
        });

      case PollType.Secret:
        return t('getPollTypeLabel.title', 'Secret poll', {
          context: 'secret',
        });

      case PollType.Open:
        return t('getPollTypeLabel.title', 'Open poll', {
          context: 'open',
        });
    }
  }
}
