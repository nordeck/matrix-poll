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

import { useWidgetApi } from '@matrix-widget-toolkit/react';
import { useCallback, useEffect, useRef } from 'react';
import { useAsync } from 'react-use';
import {
  pollApi,
  powerLevelsApi,
  roomMemberApi,
  roomNameApi,
  selectGetVotes,
  selectPollResults,
  SelectPollResults,
  selectPollsFinished,
  selectRoomMembers,
  useAppDispatch,
  useUserDetails,
  voteApi,
} from '../../../store';
import { createPollPdf } from '../pdf';
import { PollsPdfDialogContent } from './PollsPdfDialogContent';

export function PollsPdfDialogWrapper({ onClose }: { onClose: () => void }) {
  const widgetApi = useWidgetApi();
  const { getUserDisplayName } = useUserDetails();
  const dispatch = useAppDispatch();

  const urlRef = useRef<string | undefined>();
  const revokeUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = undefined;
    }
  }, []);

  const { loading, error, value } = useAsync(async () => {
    // Revoke previous URL
    revokeUrl();

    const authorName = widgetApi.widgetParameters.userId
      ? getUserDisplayName(widgetApi.widgetParameters.userId)
      : '';

    const { event: roomNameEvent } = await dispatch(
      roomNameApi.endpoints.getRoomName.initiate()
    ).unwrap();
    const roomName = roomNameEvent?.content.name ?? 'UnknownRoom';

    const roomMembersResult = await dispatch(
      roomMemberApi.endpoints.getRoomMembers.initiate()
    ).unwrap();
    const roomMemberEvents = selectRoomMembers(roomMembersResult);

    const { event: powerLevelsEvent } = await dispatch(
      powerLevelsApi.endpoints.getPowerLevels.initiate()
    ).unwrap();

    const pollsResult = await dispatch(
      pollApi.endpoints.getPolls.initiate()
    ).unwrap();
    const finishedPolls = selectPollsFinished(pollsResult);
    const pollResults: SelectPollResults[] = [];

    for (const pollEvent of finishedPolls) {
      const votesEvents = await dispatch(
        voteApi.endpoints.getVotes.initiate({
          pollId: pollEvent.state_key,
          pollStartEventId: pollEvent.content.startEventId,
        })
      ).unwrap();
      const vote = selectGetVotes(pollEvent, votesEvents);

      const result = selectPollResults(
        pollEvent,
        vote,
        roomMembersResult,
        powerLevelsEvent,
        { includeInvalidVotes: true }
      );

      if (result) {
        // show the oldest first
        pollResults.unshift(result);
      }
    }

    const blob = await createPollPdf({
      roomName,
      authorName,
      pollResults,
      roomMemberEvents,
      getUserDisplayName,
    });
    const url = URL.createObjectURL(blob);

    return { url, roomName };
  }, [dispatch]);

  useEffect(() => {
    // Revoke the URL on unmount
    return () => revokeUrl();
  }, [revokeUrl]);

  return (
    <PollsPdfDialogContent
      error={!!error}
      loading={loading}
      onClose={onClose}
      value={value}
    />
  );
}

// React currently only allow lazy loading for default exports
// https://reactjs.org/docs/code-splitting.html#named-exports
export default PollsPdfDialogWrapper;
