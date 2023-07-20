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

import { useWidgetApi } from '@matrix-widget-toolkit/react';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import { unstable_useId as useId, visuallyHidden } from '@mui/utils';
import { ModalButtonKind } from 'matrix-widget-api';
import { ReactElement, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as uuid from 'uuid';
import {
  selectPollGroups,
  useGetPollGroupsQuery,
  usePowerLevels,
  useUpdatePollGroupMutation,
} from '../../../store';
import { ListEmptyState } from '../../ListEmptyState';
import {
  CancelCreateGroupModal,
  GroupModalRequestData,
  GroupModalResult,
  SubmitCreateGroupModal,
} from '../CreateGroupModal';
import { GroupCard, GroupCardSkeleton } from '../GroupCard';

export function AdminPanel(): ReactElement {
  const { t } = useTranslation();
  const widgetApi = useWidgetApi();
  const [updatePollGroup] = useUpdatePollGroupMutation();
  const { data: groupsData, isLoading } = useGetPollGroupsQuery();
  const groups = groupsData ? selectPollGroups(groupsData) : undefined;
  const { canCreateGroups } = usePowerLevels();

  const handleCreatePoll = useCallback(async () => {
    const data = await widgetApi.openModal<
      GroupModalResult,
      GroupModalRequestData
    >(
      '/admin/create-group',
      t('adminPanel.createGroupModal.title', 'Create new group'),
      {
        buttons: [
          {
            id: SubmitCreateGroupModal,
            kind: ModalButtonKind.Primary,
            label: t('adminPanel.createGroupModal.save', 'Save'),
            disabled: true,
          },
          {
            id: CancelCreateGroupModal,
            kind: ModalButtonKind.Secondary,
            label: t('adminPanel.createGroupModal.cancel', 'Cancel'),
          },
        ],
      },
    );

    if (data) {
      await updatePollGroup({
        groupId: uuid.v4(),
        content: data.group,
      }).unwrap();
    }
  }, [t, updatePollGroup, widgetApi]);

  const headingId = useId();

  return (
    <Stack height="100%">
      <Typography id={headingId} sx={visuallyHidden} variant="h3">
        {t('adminPanel.title', 'Groups')}
      </Typography>

      <Box flexGrow="1" p={2} sx={{ overflowX: 'hidden' }}>
        <Box maxWidth={327} mx="auto">
          {isLoading && <GroupCardSkeleton />}

          {groups && (
            <Stack
              aria-labelledby={headingId}
              component="ul"
              spacing={1}
              sx={{ p: 0, m: 0 }}
            >
              {groups
                .filter((g) => g.content.abbreviation)
                .map((g) => (
                  <GroupCard
                    group={g.content}
                    groupId={g.state_key}
                    key={g.state_key}
                  />
                ))}

              {groups.length === 0 && (
                <ListEmptyState
                  message={
                    canCreateGroups
                      ? t(
                          'adminPanel.noGroupsAdminMessage',
                          'You have to create a group first.',
                        )
                      : t(
                          'adminPanel.noGroupsUserMessage',
                          'An admin has to create a group first.',
                        )
                  }
                />
              )}
            </Stack>
          )}
        </Box>
      </Box>

      {canCreateGroups ? (
        <Box component="nav" px={2}>
          <Divider />
          <Box maxWidth={327} mx="auto" my={2}>
            <Button
              fullWidth
              onClick={handleCreatePoll}
              startIcon={<AddIcon />}
              variant="contained"
            >
              {t('adminPanel.createGroup', 'Create new group')}
            </Button>
          </Box>
        </Box>
      ) : null}
    </Stack>
  );
}
