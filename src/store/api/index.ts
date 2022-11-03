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

export { baseApi } from './baseApi';
export {
  selectAllPolls,
  selectPollById,
  useDeletePollMutation,
  useGetPollsQuery,
  useStartPollMutation,
  useStopPollMutation,
  useUpdatePollMutation,
} from './pollApi';
export {
  selectPollGroup,
  selectPollGroups,
  useDeletePollGroupMutation,
  useGetPollGroupsQuery,
  useUpdatePollGroupMutation,
} from './pollGroupApi';
export {
  useGetPollSettingsQuery,
  usePatchPollSettingsMutation,
} from './pollSettingsApi';
export { useGetPowerLevelsQuery } from './powerLevelsApi';
export {
  selectActiveRoomMembers,
  selectRoomMember,
  selectRoomMembers,
  useGetRoomMembersQuery,
} from './roomMemberApi';
export { useGetRoomNameQuery } from './roomNameApi';
export { selectPollsFinished } from './selectPollsFinished';
export { selectPollsOngoing } from './selectPollsOngoing';
export { selectPollsUpcoming } from './selectPollsUpcoming';
export { selectGetVotes, useGetVotes } from './useGetVotes';
export {
  getVoteAnswerCount,
  PollInvalidAnswer,
  selectPollResults,
  usePollResults,
} from './usePollResults';
export type {
  AnswerId,
  GroupResult,
  SelectPollResults,
  Votes,
} from './usePollResults';
export { usePowerLevels } from './usePowerLevels';
export { useRerenderOnPollStatusChange } from './useRerenderOnPollStatusChange';
export { useUserCanVote } from './useUserCanVote';
export { useUserDetails } from './useUserDetails';
export { useVoteMutation } from './voteApi';
