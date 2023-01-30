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
import { SimpleBarChart } from '@carbon/charts-react';
import { useThemeSelection } from '@matrix-widget-toolkit/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { getAnswerLabel } from '../../../lib/getAnswerLabel';
import {
  AnswerId,
  getVoteAnswerCount,
  PollInvalidAnswer,
  SelectPollResults,
} from '../../../store';
import { createAnswersColorScale, generateScale } from './helpers';
import './styles.scss';
import { useCarbonTheme } from './useCarbonTheme';

interface SortedResults {
  group: string;
  value: number;
}

interface PollResultChartBarProps {
  pollResults: SelectPollResults;
  isFinished?: boolean;
}

const PollResultChartBar = ({
  pollResults,
  isFinished,
}: PollResultChartBarProps) => {
  const { t } = useTranslation();
  const { theme } = useThemeSelection();
  const carbonTheme = useCarbonTheme();

  const answerIds: AnswerId[] = isFinished
    ? [...pollResults.poll.content.answers.map((a) => a.id), PollInvalidAnswer]
    : [...pollResults.poll.content.answers.map((a) => a.id)];

  const votesByAnswer = getVoteAnswerCount(pollResults.results.votes);
  const results: SortedResults[] = answerIds.map((p) => {
    const answerCount = votesByAnswer[p];
    return {
      group: getAnswerLabel(pollResults.poll, p, { t }),
      value: answerCount ?? 0,
    };
  });

  const options: charts.BarChartOptions = {
    theme: carbonTheme,
    color: {
      scale: createAnswersColorScale(
        results.map((r) => r.group),
        theme
      ),
    },
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
        mapsTo: 'group',
        scaleType: charts.ScaleTypes.LABELS,
      },
    },
    height: '270px',
    toolbar: {
      enabled: false,
    },
  };

  return <SimpleBarChart data={results} options={options}></SimpleBarChart>;
};

// React currently only allow lazy loading for default exports
// https://reactjs.org/docs/code-splitting.html#named-exports
export default PollResultChartBar;
