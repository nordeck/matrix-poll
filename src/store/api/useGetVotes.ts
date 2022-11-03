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

import { RoomEvent, StateEvent } from '@matrix-widget-toolkit/api';
import { DateTime } from 'luxon';
import { useMemo } from 'react';
import { AsyncState } from '../../lib/utils';
import { IPoll, IVote } from '../../model';
import { selectPollById, useGetPollsQuery } from './pollApi';
import { useGetVotesQuery } from './voteApi';

export function useGetVotes(pollId: string): AsyncState<RoomEvent<IVote>[]> {
  const {
    data: pollEvents,
    isLoading: isPollEventsLoading,
    isError: isPollEventsError,
  } = useGetPollsQuery();

  const pollEvent = pollEvents ? selectPollById(pollEvents, pollId) : undefined;

  const {
    data: votes,
    isUninitialized: isVotesUninitialized,
    isLoading: isVotesLoading,
    isError: isVotesError,
  } = useGetVotesQuery(
    {
      pollId,
      pollStartEventId: pollEvent?.content.startEventId,
    },
    // wait until the polls have been loaded to make sure the
    // content of `startEventId` is valid.
    { skip: isPollEventsLoading }
  );

  return useMemo(() => {
    if (isPollEventsError || isVotesError) {
      return {
        isLoading: false,
        isError: true,
      };
    }

    if (isPollEventsLoading || isVotesLoading || isVotesUninitialized) {
      return {
        isLoading: true,
      };
    }

    return {
      isLoading: false,
      data: selectGetVotes(pollEvent, votes ?? []),
    };
  }, [
    isPollEventsError,
    isVotesError,
    isPollEventsLoading,
    isVotesLoading,
    isVotesUninitialized,
    pollEvent,
    votes,
  ]);
}

export function selectGetVotes(
  pollEvent: StateEvent<IPoll> | undefined,
  votes: RoomEvent<IVote>[]
): RoomEvent<IVote>[] {
  if (!pollEvent || !pollEvent.content.startTime) {
    return [];
  }

  const startTime = DateTime.fromISO(pollEvent.content.startTime);
  const endTime = startTime.plus({ minutes: pollEvent.content.duration });

  const votedUsers = new Set<string>();

  return (
    votes
      // only votes for the current poll
      .filter((v) => v.content.pollId === pollEvent.state_key)

      // only votes for existing answers
      .filter((v) =>
        pollEvent.content.answers.some((a) => a.id === v.content.answerId)
      )

      // only if they were cast during the vote duration
      .filter((v) => {
        const date = DateTime.fromMillis(v.origin_server_ts);
        return date >= startTime && date < endTime;
      })

      // only the first vote by the user
      .filter((v) => {
        if (votedUsers.has(v.sender)) {
          return false;
        }

        votedUsers.add(v.sender);
        return true;
      })
  );
}
