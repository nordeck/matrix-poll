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
import { EntityState } from '@reduxjs/toolkit';
import { IPoll } from '../../model';
import { selectAllPolls } from './pollApi';

export function selectPollsUpcoming(
  state: EntityState<StateEvent<IPoll>>,
  pollsOrder: string[] = [],
): StateEvent<IPoll>[] {
  return selectAllPolls(state)
    .filter((p) => p.content.startTime === undefined)
    .sort((a, b) => {
      let aIdx = pollsOrder.indexOf(a.state_key);
      let bIdx = pollsOrder.indexOf(b.state_key);

      // sort non-sorted polls last.
      if (aIdx === -1) {
        aIdx = pollsOrder.length;
      }
      if (bIdx === -1) {
        bIdx = pollsOrder.length;
      }

      return aIdx - bIdx;
    });
}
