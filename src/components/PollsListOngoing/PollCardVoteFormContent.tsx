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

import { Button } from '@mui/material';
import { FormEvent, ReactElement, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IPoll } from '../../model';
import { useVoteMutation } from '../../store';
import { PollCardVoteFormAnswers } from './PollCardVoteFormAnswers';

type PollCardVoteFormContentProps = {
  poll: IPoll;
  pollId: string;
  questionId?: string;
};

export function PollCardVoteFormContent({
  poll,
  pollId,
  questionId,
}: PollCardVoteFormContentProps): ReactElement {
  const { t } = useTranslation();
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [vote, { isLoading: isVoting }] = useVoteMutation();

  const handleSubmitVote = useCallback(
    (ev: FormEvent) => {
      ev.preventDefault();

      if (selectedAnswerId) {
        vote({
          pollId,
          answerId: selectedAnswerId,
          pollStartEventId: poll.startEventId,
        });
      }
    },
    [poll.startEventId, pollId, selectedAnswerId, vote],
  );

  return (
    <form onSubmit={handleSubmitVote}>
      <PollCardVoteFormAnswers
        answers={poll.answers}
        aria-describedby={questionId}
        onSelectedAnswerIdChange={setSelectedAnswerId}
        selectedAnswerId={selectedAnswerId}
      />

      <Button
        aria-describedby={questionId}
        disabled={isVoting || !selectedAnswerId}
        fullWidth
        type="submit"
        variant="contained"
      >
        {t('voteView.vote', 'Vote')}
      </Button>
    </form>
  );
}
