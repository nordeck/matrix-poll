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
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import { t } from 'i18next';
import { ChangeEvent, useCallback, useId } from 'react';
import { IPollAnswer } from '../../model';

export type PollCardVoteFormAnswersProps = {
  answers: IPollAnswer[];
  selectedAnswerId?: string | null;
  onSelectedAnswerIdChange?: (selectedAnswerId: string) => void;
  'aria-describedby'?: string;
};

export function PollCardVoteFormAnswers({
  selectedAnswerId,
  onSelectedAnswerIdChange,
  answers,
  'aria-describedby': ariaDescribedById,
}: PollCardVoteFormAnswersProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (onSelectedAnswerIdChange) {
        onSelectedAnswerIdChange(event.target.value);
      }
    },
    [onSelectedAnswerIdChange]
  );

  const answerId = useId();

  return (
    <FormControl margin="dense">
      <FormLabel id={answerId}>{t('voteView.answer', 'Answer')}</FormLabel>
      <RadioGroup
        aria-describedby={ariaDescribedById}
        aria-labelledby={answerId}
        name="answer"
        onChange={handleChange}
        value={selectedAnswerId}
      >
        {answers.map((answer) => (
          <FormControlLabel
            control={<Radio />}
            disabled={!onSelectedAnswerIdChange}
            key={answer.id}
            label={answer.label}
            value={answer.id}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
}
