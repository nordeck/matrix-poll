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

import { hasRoomEventPower } from '@matrix-widget-toolkit/api';
import { Box, Grid, TextField } from '@mui/material';
import {
  ChangeEvent,
  ReactElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { ROOM_EVENT_VOTE } from '../../../model';
import { GroupContent } from '../../../model/IGroup';
import {
  selectActiveRoomMembers,
  selectPollGroups,
  useGetPollGroupsQuery,
  useGetPowerLevelsQuery,
  useGetRoomMembersQuery,
} from '../../../store';
import { ParticipantsList } from '../ParticipantsList';
import { AssignParticipantButton } from './AssignParticipantButton';

export type GroupFormProps = {
  group?: GroupContent | undefined;
  groupId?: string;
  onGroupChange: (group: GroupContent | undefined) => void;
};

export function GroupForm({
  group,
  groupId,
  onGroupChange,
}: GroupFormProps): ReactElement {
  const { t } = useTranslation();
  const [isDirty, setDirty] = useState(false);
  const [abbreviation, setAbbreviation] = useState('');
  const [color, setColor] = useState('#999999');
  const [delegateParticipants, setDelegateParticipants] = useState<string[]>(
    []
  );
  const [representativeParticipants, setRepresentativeParticipants] = useState<
    string[]
  >([]);
  const { data: pollGroups } = useGetPollGroupsQuery();
  const { data: roomMembers } = useGetRoomMembersQuery();
  const { data: powerLevels } = useGetPowerLevelsQuery();

  const availableRoomMembers = useMemo(() => {
    const allRoomMembers = roomMembers
      ? selectActiveRoomMembers(roomMembers)
      : [];
    const roomMembersWithVotingPower = allRoomMembers.filter((m) =>
      hasRoomEventPower(
        powerLevels?.event?.content,
        m.state_key,
        ROOM_EVENT_VOTE
      )
    );
    const allGroupsExceptCurrentGroup = pollGroups
      ? selectPollGroups(pollGroups).filter((g) => g.state_key !== groupId)
      : [];
    const assignedRoomMemberIdsExceptCurrentGroup = Object.values(
      allGroupsExceptCurrentGroup
    ).flatMap((g) => Object.keys(g.content.members));
    const assignedRoomMemberIdsOfCurrentGroup = [
      ...delegateParticipants,
      ...representativeParticipants,
    ];
    const assignedRoomMemberIds = new Set([
      ...assignedRoomMemberIdsExceptCurrentGroup,
      ...assignedRoomMemberIdsOfCurrentGroup,
    ]);

    return roomMembersWithVotingPower.filter(
      (r) => !assignedRoomMemberIds.has(r.state_key)
    );
  }, [
    delegateParticipants,
    groupId,
    pollGroups,
    powerLevels?.event?.content,
    representativeParticipants,
    roomMembers,
  ]);

  useEffect(() => {
    if (group) {
      setAbbreviation(group.abbreviation);
      setColor(group.color);
      setDelegateParticipants(
        Object.entries(group.members)
          .filter(([_, value]) => value.memberRole === 'delegate')
          .map(([userId]) => userId)
      );
      setRepresentativeParticipants(
        Object.entries(group.members)
          .filter(([_, value]) => value.memberRole === 'representative')
          .map(([userId]) => userId)
      );
    }
  }, [group, setDelegateParticipants, setRepresentativeParticipants]);

  const isAbbreviationValid = !isDirty || abbreviation.trim().length > 0;
  const isColorValid = !isDirty || color.trim().length > 0;

  const handleAddDelegate = useCallback((participant: string) => {
    setDirty(true);
    setDelegateParticipants((v) => [...v, participant]);
  }, []);

  const handleRemoveDelegate = useCallback((participant: string) => {
    setDirty(true);
    setDelegateParticipants((v) => v.filter((m) => m !== participant));
  }, []);

  const handleAddRepresentative = useCallback((participant: string) => {
    setDirty(true);
    setRepresentativeParticipants((v) => [...v, participant]);
  }, []);

  const handleRemoveRepresentative = useCallback((participant: string) => {
    setDirty(true);
    setRepresentativeParticipants((v) => v.filter((m) => m !== participant));
  }, []);

  const onChangeDelegation = useCallback(
    (participant: string, type: 'representative' | 'delegate') => {
      setDirty(true);
      if (type === 'delegate') {
        setDelegateParticipants((v) => v.filter((m) => m !== participant));
        setRepresentativeParticipants((v) => [...v, participant]);
      } else {
        setRepresentativeParticipants((v) =>
          v.filter((m) => m !== participant)
        );
        setDelegateParticipants((v) => [...v, participant]);
      }
    },
    []
  );

  const handleChangeTitle = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setDirty(true);
      setAbbreviation(event.target.value);
    },
    []
  );

  const handleChangeColor = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setDirty(true);
      setColor(event.target.value);
    },
    []
  );

  useEffect(() => {
    if (isAbbreviationValid && isColorValid && isDirty) {
      const delegateMembers = delegateParticipants.map((p) => [
        p,
        { memberRole: 'delegate' },
      ]);
      const representativeMembers = representativeParticipants.map((p) => [
        p,
        { memberRole: 'representative' },
      ]);
      const group: GroupContent = {
        abbreviation,
        color,
        members: Object.fromEntries([
          ...delegateMembers,
          ...representativeMembers,
        ]),
      };
      onGroupChange(group);
    } else {
      onGroupChange(undefined);
    }
  }, [
    abbreviation,
    color,
    isDirty,
    isAbbreviationValid,
    isColorValid,
    onGroupChange,
    delegateParticipants,
    representativeParticipants,
  ]);

  const nameId = useId();
  const colorId = useId();

  return (
    <Box component="form" noValidate p={1}>
      <Grid container spacing={2}>
        <Grid item sm={8} xs={12}>
          <TextField
            // don't use the required property of the text field because we don't
            // want it to add a asterisk (*) to the title.
            InputProps={{ required: true }}
            error={isDirty && !isAbbreviationValid}
            fullWidth
            helperText={
              isDirty &&
              !isAbbreviationValid &&
              t('groups.groupTitleHelper', 'A title is required')
            }
            id={nameId}
            label={t('groups.groupTitle', 'Group title (required)')}
            onChange={handleChangeTitle}
            placeholder={t('groups.groupTitlePlaceholder', 'Group title')}
            value={abbreviation}
          />
        </Grid>

        <Grid item sm={4} xs={12}>
          <TextField
            // don't use the required property of the text field because we don't
            // want it to add a asterisk (*) to the title.
            InputProps={{ required: true }}
            error={isDirty && !isColorValid}
            fullWidth
            helperText={
              isDirty &&
              !isColorValid &&
              t('groups.groupColorHelper', 'A color is required')
            }
            id={colorId}
            label={t('groups.groupColor', 'Group color (required)')}
            onChange={handleChangeColor}
            sx={{
              '& .MuiInputBase-input': {
                height: 23,
              },
            }}
            type="color"
            value={color}
          />
        </Grid>
        <Grid item xs={12}>
          <ParticipantsList
            members={delegateParticipants}
            onChangeDelegation={onChangeDelegation}
            onRemoveMember={handleRemoveDelegate}
            type="delegate"
          />
          <AssignParticipantButton
            availableRoomMembers={availableRoomMembers}
            label={t(
              'assignParticipantsView.addDelegateUser',
              'Assign delegate'
            )}
            onAdd={handleAddDelegate}
          />
        </Grid>
        <Grid item xs={12}>
          <ParticipantsList
            members={representativeParticipants}
            onChangeDelegation={onChangeDelegation}
            onRemoveMember={handleRemoveRepresentative}
            type="representative"
          />
          <AssignParticipantButton
            availableRoomMembers={availableRoomMembers}
            label={t(
              'assignParticipantsView.addRepresentativeUser',
              'Assign representative'
            )}
            onAdd={handleAddRepresentative}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
