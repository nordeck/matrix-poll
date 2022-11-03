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
import { unstable_useId as useId } from '@mui/utils';
import { t } from 'i18next';
import { ChangeEvent, Dispatch, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IPollAnswer } from '../../model';

enum AnswerType {
  YesNoAbstain = 'YesNoAbstain',
  YesNo = 'YesNo',
}

export function createAnswer(
  type: AnswerType = AnswerType.YesNoAbstain
): IPollAnswer[] {
  switch (type) {
    case AnswerType.YesNo:
      return [
        {
          id: '1',
          label: t('pollForm.answer.yes', 'Yes'),
        },
        {
          id: '2',
          label: t('pollForm.answer.no', 'No'),
        },
      ];
    default:
      return [
        {
          id: '1',
          label: t('pollForm.answer.yes', 'Yes'),
        },
        {
          id: '2',
          label: t('pollForm.answer.no', 'No'),
        },
        {
          id: '3',
          label: t('pollForm.answer.abstain', 'Abstain'),
        },
      ];
  }
}

export type AnswerTypeFieldProps = {
  value: IPollAnswer[];
  onChange: Dispatch<IPollAnswer[]>;
};

export function AnswerTypeField({ value, onChange }: AnswerTypeFieldProps) {
  const { t } = useTranslation();
  const labelId = useId();
  const answerType =
    value.length === 2 ? AnswerType.YesNo : AnswerType.YesNoAbstain;

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const type = event.target.value as AnswerType;
      onChange(createAnswer(type));
    },
    [onChange]
  );

  useEffect(() => {
    if (value.length === 0) {
      onChange(createAnswer(answerType));
    }
  }, [answerType, onChange, value]);

  return (
    <FormControl margin="dense">
      <FormLabel id={labelId}>
        {t('pollForm.answerTypes', 'Answer type')}
      </FormLabel>

      <RadioGroup
        aria-labelledby={labelId}
        name="answertypes"
        onChange={handleChange}
        value={answerType}
      >
        <FormControlLabel
          control={<Radio />}
          label={t('pollForm.answerType.yesNoAbstain', 'Yes | No | Abstain')}
          value={AnswerType.YesNoAbstain}
        />
        <FormControlLabel
          control={<Radio />}
          label={t('pollForm.answerType.yesNo', 'Yes | No')}
          value={AnswerType.YesNo}
        />
      </RadioGroup>
    </FormControl>
  );
}
