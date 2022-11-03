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
  ListItem,
  ListItemIcon,
  ListItemProps,
  ListItemText,
} from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import { ReactNode } from 'react';
import { MemberAvatar } from '../../components/MemberAvatar';
import { ellipsis } from '../../lib/ellipsis';
import { useUserDetails } from '../../store';

type UserListItemProps = {
  /** The id of the user entry */
  userId: string;
  /** The children to add at the last item. This should be a `List.Content`. */
  children?: ReactNode;
  /** The props of the outer ListItem element */
  ListItemProps?: ListItemProps;
  /** The id of the title text */
  titleId?: string;

  secondary?: ReactNode;
};

export function UserListItem({
  userId,
  children,
  ListItemProps,
  titleId: propsTitleId,
  secondary,
}: UserListItemProps) {
  const { getUserDisplayName } = useUserDetails();

  const fallbackTitleId = useId();

  const titleId = propsTitleId ?? fallbackTitleId;

  return (
    <ListItem {...ListItemProps} aria-labelledby={titleId}>
      <ListItemIcon sx={{ mr: 1, minWidth: 0 }}>
        <MemberAvatar userId={userId}></MemberAvatar>
      </ListItemIcon>

      <ListItemText
        id={titleId}
        primary={getUserDisplayName(userId)}
        primaryTypographyProps={{ sx: ellipsis }}
        secondary={secondary}
      />

      {children}
    </ListItem>
  );
}
