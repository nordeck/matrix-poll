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

import { StateEvent } from '@matrix-widget-toolkit/api';
import { Box, Stack } from '@mui/material';
import { ReactElement, StrictMode, useCallback, useId, useMemo } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { useTranslation } from 'react-i18next';
import { IPoll } from '../../model';
import {
  selectPollsUpcoming,
  useGetPollSettingsQuery,
  useGetPollsQuery,
  usePatchPollSettingsMutation,
  usePowerLevels,
} from '../../store';
import { DraggableList } from '../DraggableList';
import { SectionHeadingDivider } from '../HeadingDivider';
import { PollsListContainer } from '../PollsListContainer';
import { PollsListUpcomingItem } from './PollsListUpcomingItem';

export const PollsListUpcoming = (): ReactElement => {
  const { t } = useTranslation();
  const { canCreatePollSettings } = usePowerLevels();
  const [patchPollSettings] = usePatchPollSettingsMutation();

  const { data: pollsState } = useGetPollsQuery();
  const { data: pollSettings } = useGetPollSettingsQuery();

  // TODO: delay the rendering before the pollSettings are loaded so the order doesn't "jump".

  const polls = useMemo(
    () =>
      pollsState
        ? selectPollsUpcoming(
            pollsState,
            pollSettings?.event?.content.pollsOrder
          )
        : [],
    [pollSettings?.event?.content.pollsOrder, pollsState]
  );

  const handleSortPollDrop = useCallback(
    async (sortedPolls: StateEvent<IPoll>[]) => {
      const withOrderUpdated = sortedPolls.map((e) => e.state_key);

      await patchPollSettings({
        changes: {
          pollsOrder: withOrderUpdated,
        },
      }).unwrap();
    },
    [patchPollSettings]
  );

  const headingId = useId();

  return (
    <Stack>
      <SectionHeadingDivider
        count={polls.length}
        id={headingId}
        title={t('pollsListUpcoming.notStartedPolls', 'Not started polls')}
      />

      <Box m={2}>
        <Box maxWidth={327} mx="auto">
          <DraggableList
            disabled={!canCreatePollSettings}
            items={polls}
            onDrop={handleSortPollDrop}
          >
            {(items) => (
              <PollsListContainer aria-labelledby={headingId}>
                {items.map((item, idx) => (
                  <Draggable
                    draggableId={item.state_key}
                    index={idx}
                    isDragDisabled={!canCreatePollSettings}
                    key={item.state_key}
                  >
                    {(provided) => (
                      <StrictMode>
                        <PollsListUpcomingItem
                          poll={item}
                          provided={provided}
                        />
                      </StrictMode>
                    )}
                  </Draggable>
                ))}
              </PollsListContainer>
            )}
          </DraggableList>
        </Box>
      </Box>
    </Stack>
  );
};
