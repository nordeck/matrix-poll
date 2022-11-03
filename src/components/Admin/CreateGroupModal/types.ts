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

import { GroupContent } from '../../../model';

/**
 * An action that is triggered when the create group modal is canceled.
 */
export const CancelCreateGroupModal = 'net.nordeck.create.group.cancel';

/**
 * An action that is triggered when the create group modal is submitted.
 */
export const SubmitCreateGroupModal = 'net.nordeck.create.group.submit';

export type GroupModalRequestData = {
  group: GroupContent;
  groupId: string;
};

export type GroupModalResult = {
  group: GroupContent;
};
