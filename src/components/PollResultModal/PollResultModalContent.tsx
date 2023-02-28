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

import { getEnvironment } from '@matrix-widget-toolkit/mui';
import GroupsIcon from '@mui/icons-material/Groups';
import InsertChartIcon from '@mui/icons-material/InsertChart';
import {
  Box,
  FormControl,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Skeleton,
  Typography,
} from '@mui/material';
import React, { Suspense, useCallback, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ellipsis } from '../../lib/ellipsis';
import { IPoll, PollType } from '../../model';
import { usePollResults } from '../../store';
import { HeadingDivider } from '../HeadingDivider/HeadingDivider';
import {
  PollResultChartBar,
  PollResultGroupedChartBar,
} from './PollResultChart';
import {
  ShowResultsByGroupedNameList,
  ShowResultsByNameList,
} from './PollResultNameList';
import { PollResultGroupedTable, PollResultTable } from './PollResultTable';

export interface IResultViewProps {
  poll: IPoll;
  pollId: string;
  isFinished?: boolean;
  descriptionId?: string;
}

enum ChartType {
  bar = 'bar',
  grouped = 'grouped',
}

export const PollResultModalContent = ({
  poll,
  pollId,
  isFinished,
  descriptionId,
}: IResultViewProps) => {
  const { t } = useTranslation();
  const resultsHeadingId = useId();
  const votersHeadingId = useId();
  const [resultMode, setResultMode] = useState(ChartType.bar);
  const showLiveResultByName =
    getEnvironment('REACT_APP_POLL_SHOW_LIVE_RESULT_BY_NAME', 'true') ===
    'true';

  const { data: pollResults } = usePollResults(pollId, {
    includeInvalidVotes: isFinished,
  });

  const handleResultModeChange = useCallback(
    (e: SelectChangeEvent<ChartType>) =>
      setResultMode(e.target.value as ChartType),
    []
  );

  if (!pollResults) {
    return <React.Fragment />;
  }

  return (
    <>
      {poll.groups && (
        <FormControl fullWidth size="small" sx={{ mb: 1 }}>
          <Select
            inputProps={{
              'aria-label': t(
                'pollResultModalContent.resultDisplayMode',
                'Result Display Mode'
              ),
            }}
            onChange={handleResultModeChange}
            sx={{
              '& .MuiSelect-select': {
                display: 'flex',
                alignItems: 'center',
              },

              '& .MuiListItemIcon-root': {
                minWidth: 36,
              },
            }}
            value={resultMode}
          >
            <MenuItem value={ChartType.bar}>
              <ListItemIcon>
                <InsertChartIcon />
              </ListItemIcon>
              <ListItemText
                primary={t('pollResultModalContent.result', 'Result')}
              />
            </MenuItem>
            <MenuItem value={ChartType.grouped}>
              <ListItemIcon>
                <GroupsIcon />
              </ListItemIcon>
              <ListItemText>
                {t('pollResultModalContent.groupResult', 'Result by group')}
              </ListItemText>
            </MenuItem>
          </Select>
        </FormControl>
      )}

      <Box aria-labelledby={descriptionId} component="section">
        <Typography component="h4" id={descriptionId} my={1} variant="h3">
          {pollResults.poll.content.question}
        </Typography>

        <Suspense
          fallback={
            <Skeleton height={270} variant="rectangular" width="100%" />
          }
        >
          {resultMode === ChartType.bar && (
            <PollResultChartBar
              isFinished={isFinished}
              pollResults={pollResults}
            />
          )}

          {resultMode === ChartType.grouped && (
            <PollResultGroupedChartBar
              isFinished={isFinished}
              pollResults={pollResults}
            />
          )}
        </Suspense>
      </Box>

      <Box aria-labelledby={resultsHeadingId} component="section" my={1}>
        <HeadingDivider>
          <Typography id={resultsHeadingId} sx={ellipsis} variant="h4">
            {t('pollResultModalContent.resultTable', 'Results')}
          </Typography>
        </HeadingDivider>

        {resultMode === ChartType.bar && (
          <PollResultTable
            aria-labelledby={descriptionId}
            isFinished={isFinished}
            pollResults={pollResults}
          />
        )}

        {resultMode === ChartType.grouped && (
          <PollResultGroupedTable
            aria-labelledby={descriptionId}
            isFinished={isFinished}
            pollResults={pollResults}
          />
        )}
      </Box>

      {((showLiveResultByName && !isFinished) ||
        poll.pollType === PollType.ByName) && (
        <Box aria-labelledby={votersHeadingId} component="section" my={1}>
          <HeadingDivider>
            <Typography id={votersHeadingId} sx={ellipsis} variant="h4">
              {t('pollResultModalContent.resultByName', 'Voting persons')}
            </Typography>
          </HeadingDivider>

          {resultMode === ChartType.bar && (
            <ShowResultsByNameList
              isFinished={isFinished}
              labelId={votersHeadingId}
              pollId={pollId}
            />
          )}

          {resultMode === ChartType.grouped && (
            <ShowResultsByGroupedNameList
              isFinished={isFinished}
              pollId={pollId}
            />
          )}
        </Box>
      )}
    </>
  );
};
