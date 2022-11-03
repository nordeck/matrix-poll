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
  RoomMemberStateEventContent,
  StateEvent,
} from '@matrix-widget-toolkit/api';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import {
  Autocomplete,
  AutocompleteRenderInputParams,
  InputAdornment,
  TextField,
} from '@mui/material';
import {
  HTMLAttributes,
  ReactNode,
  SyntheticEvent,
  useCallback,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useUserDetails } from '../../../store';
import { UserListItem } from '../../UserListItem';

export type AssignParticipantButtonProps = {
  availableRoomMembers: StateEvent<RoomMemberStateEventContent>[];
  label?: string;
  onAdd: (participant: string) => void;
};

export function AssignParticipantButton({
  onAdd,
  label,
  availableRoomMembers,
}: AssignParticipantButtonProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const { getUserDisplayName } = useUserDetails();

  const handleGetOptionLabel = useCallback(
    (event: StateEvent<RoomMemberStateEventContent>) =>
      getUserDisplayName(event.state_key),
    [getUserDisplayName]
  );

  const handleOnChange = useCallback(
    async (
      _: SyntheticEvent,
      event: StateEvent<RoomMemberStateEventContent> | null
    ) => {
      setInputValue('');

      if (event) {
        onAdd(event.state_key);
      }
    },
    [onAdd]
  );
  const handleOnInputChange = useCallback(
    (_: SyntheticEvent, value: string) => {
      setInputValue(value);
    },
    []
  );

  const handleRenderInput = useCallback(
    (params: AutocompleteRenderInputParams): ReactNode => {
      return (
        <TextField
          {...params}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <PersonAddAlt1Icon />
              </InputAdornment>
            ),
          }}
          label={label}
          placeholder={label}
        />
      );
    },
    [label]
  );

  const handleRenderOption = useCallback(
    (
      props: HTMLAttributes<HTMLLIElement>,
      event: StateEvent<RoomMemberStateEventContent>
    ): ReactNode => {
      return (
        <UserListItem
          ListItemProps={{ dense: true, ...props }}
          key={event.state_key}
          userId={event.state_key}
        />
      );
    },
    []
  );

  return (
    <Autocomplete
      disablePortal
      fullWidth
      getOptionLabel={handleGetOptionLabel}
      inputValue={inputValue}
      noOptionsText={t(
        'assignParticipantsView.selectNoParticipants',
        'There are no unassigned participants in this room.'
      )}
      onChange={handleOnChange}
      onInputChange={handleOnInputChange}
      options={availableRoomMembers}
      renderInput={handleRenderInput}
      renderOption={handleRenderOption}
      value={null}
    />
  );
}
