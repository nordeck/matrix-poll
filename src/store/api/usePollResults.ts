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
  PowerLevelsStateEvent,
  RoomEvent,
  RoomMemberStateEventContent,
  StateEvent,
} from '@matrix-widget-toolkit/api';
import { EntityState } from '@reduxjs/toolkit';
import { keyBy, mapValues, pickBy } from 'lodash';
import { useMemo } from 'react';
import { AsyncState } from '../../lib/utils';
import {
  IPoll,
  IVote,
  PollGroup,
  ROOM_EVENT_VOTE,
  VotingRight,
} from '../../model';
import { getIgnoredUsers } from './config';
import { selectPollById, useGetPollsQuery } from './pollApi';
import { useGetPowerLevelsQuery } from './powerLevelsApi';
import { selectRoomMembers, useGetRoomMembersQuery } from './roomMemberApi';
import { useGetVotes } from './useGetVotes';

/** A constant that shows that a user didn't submit an answer. */
export const PollInvalidAnswer: unique symbol = Symbol(
  'net.nordeck.poll.vote.invalid',
);

type InvalidVote = Exclude<VotingRight, { state: 'active' }>;
type InvalidVotes = Record<string, InvalidVote>;

export type AnswerId = string | typeof PollInvalidAnswer;
export type Votes = Partial<Record<string, AnswerId>>;
export type GroupResult = {
  /** The abbreviation of the group */
  abbreviation: string;

  /** The color of the group */
  color: string;

  /**
   * A list of all votes per user (user_id -> answerId).
   * {@link PollInvalidAnswer} shows that the user didn't
   * submit an answer even though a voting right was present.
   */
  votes: Votes;

  /** Information about users that lost their voting rights */
  invalidVoters: InvalidVotes;
};

/** Return type of the {@link makeSelectPollResults} selector. */
export type SelectPollResults = {
  /** The original poll event */
  poll: StateEvent<IPoll>;

  /** A list of users that have a voting right */
  votingRights: string[];

  results: {
    /**
     * A list of all votes per user (user_id -> answerId).
     * {@link PollInvalidAnswer} shows that the user didn't
     * submit an answer even though a voting right was present.
     */
    votes: Votes;
  };

  /** The information of all  */
  groupedResults?: Record<string, GroupResult>;
};

type MakeSelectPollResultsOpts = {
  includeInvalidVotes?: boolean;
  skipLoadingVotes?: boolean;
};

/**
 * A hook that returns the details and results of a single poll.
 *
 * @returns the results, or undefined if poll doesn't exist or has not yet started.
 */
export function usePollResults(
  pollId: string,
  opts: MakeSelectPollResultsOpts = {},
): AsyncState<SelectPollResults | undefined> {
  const {
    data: pollEvents,
    isLoading: isPollEventsLoading,
    isError: isPollEventsError,
  } = useGetPollsQuery();
  const {
    data: voteEvents,
    isLoading: isVoteEventsLoading,
    isError: isVoteEventsError,
  } = useGetVotes(pollId);
  const {
    data: roomMembersState,
    isLoading: isRoomMembersStateLoading,
    isError: isRoomMembersStateError,
  } = useGetRoomMembersQuery();
  const {
    data: powerLevels,
    isLoading: isPowerLevelsLoading,
    isError: isPowerLevelsError,
  } = useGetPowerLevelsQuery();

  return useMemo(() => {
    if (
      isPollEventsError ||
      (!opts?.skipLoadingVotes && isVoteEventsError) ||
      isRoomMembersStateError ||
      isPowerLevelsError
    ) {
      return { isLoading: false, isError: true };
    }

    if (
      isPollEventsLoading ||
      (!opts?.skipLoadingVotes && isVoteEventsLoading) ||
      isRoomMembersStateLoading ||
      isPowerLevelsLoading
    ) {
      return {
        isLoading: true,
      };
    }

    const pollEvent = pollEvents
      ? selectPollById(pollEvents, pollId)
      : undefined;

    if (!pollEvent) {
      return {
        isLoading: false,
        data: undefined,
      };
    }

    return {
      isLoading: false,
      data: selectPollResults(
        pollEvent,
        opts?.skipLoadingVotes ? [] : voteEvents ?? [],
        roomMembersState,
        powerLevels?.event,
        {
          // provide individual values because opts can't be memoed directly
          includeInvalidVotes: opts.includeInvalidVotes,
          skipLoadingVotes: opts.skipLoadingVotes,
        },
      ),
    };
  }, [
    isPollEventsError,
    isPollEventsLoading,
    isPowerLevelsError,
    isPowerLevelsLoading,
    isRoomMembersStateError,
    isRoomMembersStateLoading,
    isVoteEventsError,
    isVoteEventsLoading,
    opts.includeInvalidVotes,
    opts.skipLoadingVotes,
    pollEvents,
    pollId,
    powerLevels?.event,
    roomMembersState,
    voteEvents,
  ]);
}

export function selectPollResults(
  pollEvent: StateEvent<IPoll>,
  voteEvents: RoomEvent<IVote>[],
  roomMembersState:
    | EntityState<StateEvent<RoomMemberStateEventContent>>
    | undefined,
  powerLevels: StateEvent<PowerLevelsStateEvent> | undefined,
  opts: MakeSelectPollResultsOpts = {},
): SelectPollResults | undefined {
  const { includeInvalidVotes = false } = opts;

  const ignoredUsers = getIgnoredUsers();
  const roomMembers = roomMembersState
    ? selectRoomMembers(roomMembersState).filter(
        (m) => !ignoredUsers.includes(m.state_key),
      )
    : [];

  // no groups -> use votes, room members, and power levels
  if (!pollEvent.content.groups) {
    const allInvalidVotes: Votes = includeInvalidVotes
      ? Object.fromEntries(
          roomMembers
            .filter(
              (m) =>
                (m.content.membership === 'join' ||
                  m.content.membership === 'invite') &&
                hasRoomEventPower(
                  powerLevels?.content,
                  m.state_key,
                  ROOM_EVENT_VOTE,
                ),
            )
            .map((m) => [m.state_key, PollInvalidAnswer]),
        )
      : {};

    const allValidVotes: Votes = Object.fromEntries(
      voteEvents.map((v) => [v.sender, v.content.answerId]),
    );

    const votes = {
      ...allInvalidVotes,
      ...allValidVotes,
    };

    return {
      poll: pollEvent,
      votingRights: Object.keys(votes),
      results: { votes },
    };
  }

  // cleanup the groups to delete all invalid entries
  const groups = cleanupGroups(pollEvent.content.groups);

  // get the grouped results
  const groupedResults = mapValues(
    keyBy(groups, (g) => g.id),
    (g) => {
      // get an object of all invalid voters
      const invalidVoters = pickBy(
        g.votingRights,
        (v): v is InvalidVote => v !== undefined && v.state !== 'active',
      );

      const allInvalidVotes: Votes = includeInvalidVotes
        ? Object.fromEntries(
            Object.entries(g.votingRights)
              .map(([userId, state]) => {
                if (state?.state === 'represented') {
                  return [state.representedBy, PollInvalidAnswer];
                }

                return [userId, PollInvalidAnswer];
              })
              .filter(([userId]) => !(userId in invalidVoters)),
          )
        : {};

      const allValidVotes: Votes = Object.fromEntries(
        voteEvents
          .filter((v) => {
            // is active delegate
            if (g.votingRights[v.sender]?.state === 'active') {
              return true;
            }

            // is representative
            return Object.values(invalidVoters).some(
              (invalid) =>
                invalid.state === 'represented' &&
                invalid.representedBy === v.sender,
            );
          })
          .map((v) => [v.sender, v.content.answerId]),
      );

      const votes = {
        ...allInvalidVotes,
        ...allValidVotes,
      };

      return {
        abbreviation: g.abbreviation,
        color: g.color,
        votes,
        invalidVoters,
      };
    },
  );

  // flatten the grouped votes for the results type
  let votes = {};
  for (const value of Object.values(groupedResults)) {
    votes = {
      ...value.votes,
      ...votes,
    };
  }

  return {
    poll: pollEvent,
    votingRights: Object.keys(votes).sort(),
    results: {
      votes,
    },
    groupedResults,
  };
}

/**
 * Make sure the information in the groups are consistent.
 * It makes sure:
 *
 *  1. A user can't be a delegate for different groups.
 *  2. A delegate can't represent another delegate.
 *  3. A user can't represent multiple delegates (even across group boundaries).
 *
 * Duplicated users are removed and invalid
 * representations are replaced by the `invalid` state.
 *
 * @param groups - the original groups that were read from the room.
 * @returns the cleaned up groups.
 */
function cleanupGroups(groups: PollGroup[]): PollGroup[] {
  const delegates = new Set<string>();
  const representatives = new Set<string>();

  // make sure a delegate only is in one group at a time
  const fixedDelegatesGroup = groups.map((g) => ({
    ...g,
    votingRights: pickBy(g.votingRights, (_, key) => {
      if (delegates.has(key)) {
        return false;
      }

      delegates.add(key);
      return true;
    }),
  }));

  return fixedDelegatesGroup.map((g) => ({
    ...g,
    votingRights: Object.fromEntries(
      Object.entries(g.votingRights).map(([key, value]) => {
        if (value?.state === 'represented') {
          // delegates can't be representatives
          if (delegates.has(value.representedBy)) {
            return [key, { state: 'invalid' }];
          }

          // make sure to not use representatives twice
          if (representatives.has(value.representedBy)) {
            return [key, { state: 'invalid' }];
          }

          representatives.add(value.representedBy);
        }

        return [key, value];
      }),
    ),
  }));
}

/**
 * Count all votes grouped by answer id.
 *
 * @param votes - a {@link Votes} object.
 * @returns a map with `answerId -> vote count`
 */
export function getVoteAnswerCount(
  votes: Votes,
): Partial<Record<string | typeof PollInvalidAnswer, number>> {
  const result: Partial<Record<string | typeof PollInvalidAnswer, number>> = {};

  for (const answerId of Object.values(votes)) {
    if (answerId !== undefined) {
      result[answerId] = (result[answerId] ?? 0) + 1;
    }
  }

  return result;
}
