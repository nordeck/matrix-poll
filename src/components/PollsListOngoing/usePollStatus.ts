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

import { useWidgetApi } from '@matrix-widget-toolkit/react';
import { useMemo } from 'react';
import { AsyncState } from '../../lib/utils';
import { usePollResults, usePowerLevels, useUserCanVote } from '../../store';
import { getCanViewResults } from './getCanViewResults';

type UsePollStatusReturn = {
  hasVoted: boolean;
  canViewResults: boolean;
  pollHasResults: boolean;
  canVote: boolean;
};

export function usePollStatus(pollId: string): AsyncState<UsePollStatusReturn> {
  const {
    widgetParameters: { userId = '' },
  } = useWidgetApi();
  const { canCreatePoll = false } = usePowerLevels();

  const {
    data: canVote,
    isLoading: isCanVoteLoading,
    isError: isCanVoteError,
  } = useUserCanVote(pollId, userId);
  const {
    data: pollResults,
    isLoading: isLoadingPollResults,
    isError: isPollResultsError,
  } = usePollResults(pollId);

  return useMemo(() => {
    if (isCanVoteError || isPollResultsError) {
      return { isLoading: false, isError: true };
    }

    if (isCanVoteLoading || isLoadingPollResults) {
      return { isLoading: true };
    }

    const canViewResults = pollResults
      ? getCanViewResults({
          canCreatePoll,
          poll: pollResults.poll.content,
        })
      : false;

    const pollHasResults = pollResults
      ? Object.keys(pollResults.results.votes).length > 0
      : false;

    return {
      isLoading: false,
      data: {
        hasVoted: pollResults ? userId in pollResults.results.votes : false,
        canViewResults,
        pollHasResults,
        canVote: canVote ?? false,
      },
    };
  }, [
    canCreatePoll,
    canVote,
    isCanVoteError,
    isCanVoteLoading,
    isLoadingPollResults,
    isPollResultsError,
    pollResults,
    userId,
  ]);
}
