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

import { sortItems } from './DraggableList';

describe('<DraggableList/>', () => {
  describe('sortItems', () => {
    it('should sort items', () => {
      const items = [0, 1, 2, 3, 4];
      expect(sortItems(items, 2, 4)).toEqual([0, 1, 3, 4, 2]);
    });
  });
});
