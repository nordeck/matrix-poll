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
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardHeader,
  Collapse,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import { ModalButtonKind } from 'matrix-widget-api';
import { ReactElement, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ellipsis } from '../../../lib/ellipsis';
import { GroupContent } from '../../../model';
import {
  useDeletePollGroupMutation,
  usePowerLevels,
  useUpdatePollGroupMutation,
} from '../../../store';
import { ConfirmDeleteDialog } from '../../ConfirmDeleteDialog';
import { GroupAvatar } from '../../GroupAvatar';
import { MenuButton, MenuButtonItem } from '../../MenuButton';
import {
  CancelCreateGroupModal,
  GroupModalRequestData,
  GroupModalResult,
  SubmitCreateGroupModal,
} from '../CreateGroupModal';
import { ParticipantsList } from '../ParticipantsList';

type GroupCardProps = {
  group: GroupContent;
  groupId: string;
};

type GroupCardMenuProps = GroupCardProps & {
  'aria-describedby'?: string;
};

function GroupCardMenu({
  group,
  groupId,
  'aria-describedby': ariaDescribedBy,
}: GroupCardMenuProps): ReactElement {
  const { t } = useTranslation();
  const widgetApi = useWidgetApi();

  const [updatePollGroup] = useUpdatePollGroupMutation();
  const [deletePollGroup] = useDeletePollGroupMutation();

  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  const handleClickOpenDeleteConfirm = useCallback(() => {
    setOpenDeleteConfirm(true);
  }, []);

  const handleCloseDeleteConfirm = useCallback(() => {
    setOpenDeleteConfirm(false);
  }, []);

  const handleClickDeleteConfirm = useCallback(async () => {
    handleCloseDeleteConfirm();

    await deletePollGroup({ groupId }).unwrap();
  }, [deletePollGroup, groupId, handleCloseDeleteConfirm]);

  const handleClickEditGroup = useCallback(async () => {
    const groupData = await widgetApi.openModal<
      GroupModalResult,
      GroupModalRequestData
    >(
      '/admin/create-group',
      t('groupCard.editGroupModal.title', 'Edit group'),
      {
        buttons: [
          {
            id: SubmitCreateGroupModal,
            kind: ModalButtonKind.Primary,
            label: t('groupCard.editGroupModal.save', 'Save'),
            disabled: true,
          },
          {
            id: CancelCreateGroupModal,
            kind: ModalButtonKind.Secondary,
            label: t('groupCard.editGroupModal.cancel', 'Cancel'),
          },
        ],
        data: { group, groupId },
      }
    );

    if (groupData) {
      await updatePollGroup({
        groupId,
        content: groupData.group,
      }).unwrap();
    }
  }, [widgetApi, t, group, groupId, updatePollGroup]);

  return (
    <>
      <MenuButton
        aria-describedby={ariaDescribedBy}
        buttonLabel={t('groupCard.moreSettings', 'More settings')}
      >
        <MenuButtonItem icon={<EditIcon />} onClick={handleClickEditGroup}>
          {t('groupCard.editGroup', 'Edit group')}
        </MenuButtonItem>
        <MenuButtonItem
          color="error.main"
          icon={<DeleteIcon />}
          onClick={handleClickOpenDeleteConfirm}
        >
          {t('groupCard.deleteGroup', 'Delete group')}
        </MenuButtonItem>
      </MenuButton>

      <ConfirmDeleteDialog
        confirmTitle={t('groupCard.confirmButton', 'Delete')}
        description={t('groupCard.message', {
          title: group.abbreviation,
          defaultValue:
            'Are you sure you want to delete the group “{{title}}”?',
        })}
        onCancel={handleCloseDeleteConfirm}
        onConfirm={handleClickDeleteConfirm}
        open={openDeleteConfirm}
        title={t('groupCard.modalHeader', 'Delete group')}
      />
    </>
  );
}

export function GroupCard({ group, groupId }: GroupCardProps): ReactElement {
  const { canCreateGroups } = usePowerLevels();
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();

  const delegateParticipants = useMemo(() => {
    return Object.entries(group.members)
      .filter(([_, value]) => value.memberRole === 'delegate')
      .map(([userId]) => userId);
  }, [group.members]);
  const representativeParticipants = useMemo(() => {
    return Object.entries(group.members)
      .filter(([_, value]) => value.memberRole === 'representative')
      .map(([userId]) => userId);
  }, [group.members]);

  const handleExpandClick = useCallback(() => {
    setExpanded((old) => !old);
  }, []);

  const titleId = useId();
  const participantsId = useId();
  const participantsTitleId = useId();

  return (
    <Box
      aria-labelledby={titleId}
      component="li"
      m={0}
      p={0}
      sx={{ listStyleType: 'none' }}
    >
      <Card variant="outlined">
        <CardHeader
          action={
            canCreateGroups && (
              <GroupCardMenu
                aria-describedby={titleId}
                group={group}
                groupId={groupId}
              />
            )
          }
          avatar={<GroupAvatar group={group} />}
          title={group.abbreviation}
          titleTypographyProps={{
            id: titleId,
            sx: ellipsis,
            component: 'h4',
            variant: 'h4',
          }}
        />
        <Divider />
        <CardActionArea
          aria-controls={expanded ? participantsId : undefined}
          aria-expanded={expanded}
          aria-label={
            expanded
              ? t('groupCard.hideParticipants', 'Hide participants list')
              : t('groupCard.showParticipants', 'Show participants list')
          }
          onClick={handleExpandClick}
        >
          <CardContent>
            <Stack alignItems="center" direction="row">
              <Typography flex={1} id={participantsTitleId} ml={1} variant="h5">
                {t('groupCard.participants', 'Participants')}
              </Typography>
              <ExpandMoreIcon
                sx={{
                  transform: !expanded ? 'rotate(0deg)' : 'rotate(180deg)',
                  marginLeft: 'auto',
                  transition: (theme) =>
                    theme.transitions.create('transform', {
                      duration: theme.transitions.duration.shortest,
                    }),
                }}
              />
            </Stack>
          </CardContent>
        </CardActionArea>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent
            aria-labelledby={participantsTitleId}
            component="section"
            id={participantsId}
            sx={{ pt: 0 }}
          >
            <ParticipantsList members={delegateParticipants} type="delegate" />
            <ParticipantsList
              members={representativeParticipants}
              type="representative"
            />
          </CardContent>
        </Collapse>
      </Card>
    </Box>
  );
}
