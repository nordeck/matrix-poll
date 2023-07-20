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

import { interfaces as charts } from '@carbon/charts';
import { GroupedBarChart } from '@carbon/charts-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { getAnswerLabel } from '../../../lib/getAnswerLabel';
import {
  AnswerId,
  getVoteAnswerCount,
  PollInvalidAnswer,
  SelectPollResults,
} from '../../../store';
import { generateScale } from './helpers';
import './styles.scss';
import { useCarbonTheme } from './useCarbonTheme';

export interface PollResultGroupedChartBarProps {
  pollResults: SelectPollResults;
  isFinished?: boolean;
}

interface SortedGroupResults {
  group: string;
  answer: string;
  value: number;
}

export const PollResultGroupedChartBar = ({
  pollResults,
  isFinished,
}: PollResultGroupedChartBarProps) => {
  const { t } = useTranslation();
  const theme = useCarbonTheme();

  const answerIds: AnswerId[] = isFinished
    ? [...pollResults.poll.content.answers.map((a) => a.id), PollInvalidAnswer]
    : [...pollResults.poll.content.answers.map((a) => a.id)];

  if (!pollResults.groupedResults) {
    return <React.Fragment />;
  }

  const colors = Object.fromEntries(
    Object.values(pollResults.groupedResults).map((group) => [
      group.abbreviation,
      group.color,
    ]),
  );

  const results = Object.values(pollResults.groupedResults).flatMap((group) => {
    const votesByAnswer = getVoteAnswerCount(group.votes);
    return answerIds.map<SortedGroupResults>((p) => {
      const answerCount = votesByAnswer[p];
      return {
        group: group.abbreviation,
        answer: getAnswerLabel(pollResults.poll, p, { t }),
        value: answerCount ?? 0,
      };
    });
  });

  const options: charts.BarChartOptions = {
    theme,
    tooltip: {
      enabled: false,
    },
    axes: {
      left: {
        mapsTo: 'value',
        ticks: {
          values: generateScale(results),
        },
      },
      bottom: {
        mapsTo: 'answer',
        scaleType: charts.ScaleTypes.LABELS,
      },
    },
    height: '270px',
    color: { scale: colors },
    toolbar: {
      enabled: false,
    },
  };

  return <GroupedBarChart data={results} options={options} />;
};

// React currently only allow lazy loading for default exports
// https://reactjs.org/docs/code-splitting.html#named-exports
export default PollResultGroupedChartBar;
