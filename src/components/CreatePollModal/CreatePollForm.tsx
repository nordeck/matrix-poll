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
import TimerIcon from '@mui/icons-material/Timer';
import {
  Box,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { unstable_useId as useId, visuallyHidden } from '@mui/utils';
import { isEqual } from 'lodash';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IPoll, IPollAnswer, PollType, ResultType } from '../../model';
import { PollGroup } from '../../model/IPoll';
import { selectPollGroups, useGetPollGroupsQuery } from '../../store';
import {
  syncPollGroupsWithRoomGroups,
  VotingRightsConfiguration,
} from '../VotingRightsConfiguration';
import { AnswerTypeField, createAnswer } from './AnswerTypeField';

export interface ICreatePollFormProps {
  poll?: IPoll | undefined;
  onPollChange: (poll: IPoll | undefined) => void;
}

export const CreatePollForm = ({
  onPollChange,
  poll,
}: ICreatePollFormProps) => {
  const { t } = useTranslation();
  const { data: groupEventsData, isLoading } = useGetPollGroupsQuery();

  // TODO: do we need a loading indicator/skeleton to tell that we don't know whether there are groups yet? Do we care about the error case?

  const [title, setTitle] = useState(poll?.title ?? '');
  const [question, setQuestion] = useState(poll?.question ?? '');
  const [description, setDescription] = useState(poll?.description ?? '');
  const [pollType, setPollType] = useState<PollType>(
    poll?.pollType ?? PollType.Open,
  );
  const [answers, setAnswers] = useState<Array<IPollAnswer>>(
    () => poll?.answers ?? createAnswer(),
  );
  const [liveResults, setLiveResults] = useState(
    poll ? poll.resultType === ResultType.Visible : true,
  );
  const [duration, setDuration] = useState(poll?.duration?.toString() ?? '1');
  const [isDirty, setIsDirty] = useState(false);
  const [groups, setGroups] = useState<PollGroup[]>([]);

  const isDescriptionRequired =
    getEnvironment('REACT_APP_POLL_DESCRIPTION_REQUIRED') === 'true';

  const titleError = title.length === 0;
  const questionError = question.length === 0;
  const durationError = isNaN(parseInt(duration)) || parseInt(duration) <= 0;
  const descriptionError = isDescriptionRequired && description.length === 0;

  useEffect(() => {
    const isValid =
      !titleError &&
      !questionError &&
      !durationError &&
      answers.length > 0 &&
      !descriptionError;

    if (isDirty && isValid) {
      const poll: IPoll = {
        title,
        question,
        description,
        pollType,
        answers,
        resultType: liveResults ? ResultType.Visible : ResultType.Invisible,
        duration: parseInt(duration),
        groups: groups.length > 0 ? groups : undefined,
      };
      onPollChange(poll);
    } else {
      onPollChange(undefined);
    }
  }, [
    answers,
    description,
    duration,
    groups,
    isDescriptionRequired,
    isDirty,
    onPollChange,
    pollType,
    question,
    liveResults,
    title,
    titleError,
    descriptionError,
    questionError,
    durationError,
  ]);

  useEffect(() => {
    if (!isLoading && groupEventsData) {
      const groupEvents = selectPollGroups(groupEventsData);
      const updatedGroups = syncPollGroupsWithRoomGroups(
        poll?.groups ?? [],
        groupEvents,
      );

      setGroups(updatedGroups);

      if (poll) {
        const groupsHaveConflicts = !isEqual(updatedGroups, poll.groups ?? []);

        if (groupsHaveConflicts) {
          setIsDirty(true);
        }
      }
    }
  }, [poll, isLoading, groupEventsData]);

  const handleChangeTitle = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setIsDirty(true);
    setTitle(e.target.value);
  }, []);

  const handleChangeQuestion = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setIsDirty(true);
      setQuestion(e.target.value);
    },
    [],
  );

  const handleChangeDescription = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setIsDirty(true);
      setDescription(e.target.value);
    },
    [],
  );

  const handlePollTypeChange = useCallback((e: SelectChangeEvent<PollType>) => {
    setIsDirty(true);
    setPollType(e.target.value as PollType);
  }, []);

  const handleChangeAnswers = useCallback((answers: IPollAnswer[]) => {
    setIsDirty(true);
    setAnswers(answers);
  }, []);

  const handleChangeLiveResults = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setIsDirty(true);
      setLiveResults(e.target.checked);
    },
    [],
  );

  const handleChangeDuration = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setIsDirty(true);
      setDuration(e.target.value.replace(/[^0-9]*/g, ''));
    },
    [],
  );

  const handleGroupsChange = useCallback((groups: PollGroup[]) => {
    setIsDirty(true);
    setGroups(groups);
  }, []);

  const formTitleId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const questionId = useId();
  const durationId = useId();
  const pollTypeId = useId();
  const pollTypeLabelId = useId();
  const liveResultsId = useId();
  const pollTypeLabel = t('pollForm.pollTypes', 'Poll type');

  return (
    <Box
      aria-labelledby={formTitleId}
      component="form"
      display="flex"
      flexWrap="wrap"
      p={1}
    >
      <Typography component="h3" id={formTitleId} sx={visuallyHidden}>
        {t('pollForm.poll', 'Poll')}
      </Typography>

      <TextField
        // don't use the required property of the text field because we don't
        // want it to add a asterisk (*) to the title.
        InputProps={{ required: true }}
        error={isDirty && titleError}
        fullWidth
        helperText={
          isDirty &&
          titleError &&
          t('pollForm.titleHelperText', 'A title is required')
        }
        id={titleId}
        label={t('pollForm.title', 'Title (required)')}
        margin="dense"
        onChange={handleChangeTitle}
        value={title}
      />

      <TextField
        // don't use the required property of the text field because we don't
        // want it to add a asterisk (*) to the title.
        InputProps={{ required: isDescriptionRequired }}
        error={isDirty && descriptionError}
        fullWidth
        helperText={
          isDirty && descriptionError
            ? t('pollForm.descriptionHelperText', 'A description is required')
            : undefined
        }
        id={descriptionId}
        label={
          isDescriptionRequired
            ? t('pollForm.descriptionRequired', 'Description (required)')
            : t('pollForm.description', 'Description')
        }
        margin="dense"
        multiline
        onChange={handleChangeDescription}
        rows={3}
        value={description}
      />

      <TextField
        // don't use the required property of the text field because we don't
        // want it to add a asterisk (*) to the title.
        InputProps={{ required: true }}
        error={isDirty && questionError}
        fullWidth
        helperText={
          isDirty &&
          questionError &&
          t('pollForm.questionHelperText', 'A question is required')
        }
        id={questionId}
        label={t('pollForm.question', 'Question (required)')}
        margin="dense"
        onChange={handleChangeQuestion}
        value={question}
      />

      <Grid container mt={{ sm: 1 }} spacing={2}>
        <Grid item sm xs={12}>
          <AnswerTypeField onChange={handleChangeAnswers} value={answers} />
        </Grid>

        <Divider
          orientation="vertical"
          sx={{ display: { xs: 'none', sm: 'block' } }}
        />

        <Grid item sm xs={12}>
          <TextField
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <TimerIcon />
                </InputAdornment>
              ),
              // don't use the required property of the text field because we
              // don't want it to add a asterisk (*) to the title.
              required: true,
            }}
            error={isDirty && durationError}
            fullWidth
            helperText={
              isDirty &&
              durationError &&
              t('pollForm.durationHelperText', 'A duration is required')
            }
            id={durationId}
            inputProps={{
              inputMode: 'numeric',
              type: 'number',
              min: 1,
              // 100 years should be enough
              max: 100 * 365 * 24 * 60,
            }}
            label={t('pollForm.duration', 'Duration in minutes (required)')}
            margin="dense"
            onChange={handleChangeDuration}
            value={duration}
          />

          <FormControl fullWidth margin="dense" size="small">
            <InputLabel id={pollTypeLabelId}>{pollTypeLabel}</InputLabel>
            <Select
              id={pollTypeId}
              label={pollTypeLabel}
              labelId={pollTypeLabelId}
              onChange={handlePollTypeChange}
              value={pollType}
            >
              <MenuItem value={PollType.ByName}>
                {t('pollForm.type', 'By Name', { context: 'byName' })}
              </MenuItem>
              <MenuItem value={PollType.Open}>
                {t('pollForm.type', 'Open', { context: 'open' })}
              </MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense" size="small">
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={liveResults}
                    id={liveResultsId}
                    onChange={handleChangeLiveResults}
                    sx={{ mx: 2 }}
                  />
                }
                label={t('pollForm.realTimeResults', 'Display live results')}
              />
            </FormGroup>
          </FormControl>
        </Grid>
      </Grid>

      {groups.length > 0 && (
        <VotingRightsConfiguration
          groups={groups}
          onGroupsChange={handleGroupsChange}
        />
      )}
    </Box>
  );
};
