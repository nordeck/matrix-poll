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

import {
  hasRoomEventPower,
  hasStateEventPower,
} from '@matrix-widget-toolkit/api';
import { useWidgetApi } from '@matrix-widget-toolkit/react';
import {
  ROOM_EVENT_VOTE,
  STATE_EVENT_POLL,
  STATE_EVENT_POLL_GROUP,
  STATE_EVENT_POLL_SETTINGS,
} from '../../model';
import { useGetPowerLevelsQuery } from './powerLevelsApi';

export type PowerLevels = {
  canCreatePoll: boolean | undefined;
  canCreatePollSettings: boolean | undefined;
  canCreateGroups: boolean | undefined;
  canCreateVote: boolean | undefined;
};

export function usePowerLevels({
  userId,
}: { userId?: string } = {}): PowerLevels {
  const { data: powerLevels, isLoading } = useGetPowerLevelsQuery();
  const widgetApi = useWidgetApi();
  userId ??= widgetApi.widgetParameters.userId;

  let canCreatePoll: boolean | undefined = undefined;
  let canCreatePollSettings: boolean | undefined = undefined;
  let canCreateGroups: boolean | undefined = undefined;
  let canCreateVote: boolean | undefined = undefined;

  if (!isLoading && powerLevels) {
    canCreatePoll = hasStateEventPower(
      powerLevels?.event?.content,
      userId,
      STATE_EVENT_POLL,
    );
    canCreatePollSettings = hasStateEventPower(
      powerLevels?.event?.content,
      userId,
      STATE_EVENT_POLL_SETTINGS,
    );
    canCreateGroups = hasStateEventPower(
      powerLevels?.event?.content,
      userId,
      STATE_EVENT_POLL_GROUP,
    );
    canCreateVote = hasRoomEventPower(
      powerLevels?.event?.content,
      userId,
      ROOM_EVENT_VOTE,
    );
  }

  return {
    canCreatePoll,
    canCreatePollSettings,
    canCreateGroups,
    canCreateVote,
  };
}
