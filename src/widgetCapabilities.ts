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
  STATE_EVENT_POWER_LEVELS,
  STATE_EVENT_ROOM_MEMBER,
} from '@matrix-widget-toolkit/api';
import { EventDirection, WidgetEventCapability } from 'matrix-widget-api';
import {
  ROOM_EVENT_POLL_START,
  ROOM_EVENT_VOTE,
  STATE_EVENT_POLL,
  STATE_EVENT_POLL_GROUP,
  STATE_EVENT_POLL_SETTINGS,
  STATE_EVENT_ROOM_NAME,
} from './model';

export const widgetCapabilities = [
  WidgetEventCapability.forRoomEvent(EventDirection.Send, ROOM_EVENT_VOTE),
  WidgetEventCapability.forRoomEvent(EventDirection.Receive, ROOM_EVENT_VOTE),
  WidgetEventCapability.forStateEvent(EventDirection.Send, STATE_EVENT_POLL),
  WidgetEventCapability.forStateEvent(EventDirection.Receive, STATE_EVENT_POLL),
  WidgetEventCapability.forStateEvent(
    EventDirection.Send,
    STATE_EVENT_POLL_SETTINGS,
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_POLL_SETTINGS,
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_POWER_LEVELS,
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_ROOM_NAME,
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_ROOM_MEMBER,
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Send,
    STATE_EVENT_POLL_GROUP,
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_POLL_GROUP,
  ),
  WidgetEventCapability.forRoomEvent(
    EventDirection.Send,
    ROOM_EVENT_POLL_START,
  ),
  WidgetEventCapability.forRoomEvent(
    EventDirection.Receive,
    ROOM_EVENT_POLL_START,
  ),
];
