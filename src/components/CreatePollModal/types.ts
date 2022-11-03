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

import { IPoll } from '../../model';

/**
 * An action that is triggered when the create or edit poll modal is canceled.
 */
export const CancelPollModal = 'net.nordeck.poll.cancel';

/**
 * An action that is triggered when the create or edit poll modal is submitted.
 */
export const SubmitPollModal = 'net.nordeck.poll.submit';

export type PollModalRequestData = {
  poll?: IPoll;
};

export type PollModalResult = {
  poll: IPoll;
};
