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
  Card,
  CardContent,
  CardHeader,
  Divider,
  Typography,
} from '@mui/material';
import React, { ReactElement, ReactNode } from 'react';
import { ellipsis } from '../../lib/ellipsis';
import { IPoll } from '../../model';
import { ExpandableText } from './ExpandableText';
import { PollInfoIcons } from './PollInfoIcons';

/**
 * Props for the {@link PollCard} component.
 */
type PollCardProps = {
  /** the poll object to display */
  poll: IPoll;

  /** the ID of the poll event */
  pollId: string;

  /** add content to the header of the card. it will be added before the poll title. */
  header?: ReactNode;

  /** add content to the header between the title and the icons */
  headerMeta?: ReactNode;

  /** add content after the icons */
  headerInfos?: ReactNode;

  /** the main content of the card that is added below the description */
  children?: ReactNode;

  /** add content to the bottom of the card */
  extra?: ReactNode;

  /** if true, the icons will include the already taken votes. this will make sense once the poll has started  */
  showVotes?: boolean;

  /** The id of the title element */
  titleId?: string;

  /** The id of the question element */
  questionId?: string;
};

/**
 * A card that renders common props of a poll. This includes the
 * title, the question, the description, and a set of icons with
 * details about legitimated users and voted users.
 *
 * @param param0 - {@link PollCardProps}
 */
export function PollCard({
  pollId,
  poll,
  showVotes = false,
  children,
  header,
  headerMeta,
  headerInfos,
  extra,
  titleId,
  questionId,
}: PollCardProps): ReactElement {
  return (
    <Card variant="outlined">
      <CardHeader
        action={header}
        subheader={headerMeta}
        sx={{ pb: 0 }}
        title={poll.title}
        titleTypographyProps={{
          id: titleId,
          sx: ellipsis,
          component: 'h4',
        }}
      />

      <CardContent sx={{ pt: 0, display: 'flex', flexWrap: 'wrap-reverse' }}>
        <PollInfoIcons pollId={pollId} showVotes={showVotes} />
      </CardContent>

      {headerInfos}

      <Divider />

      <CardContent>
        <Typography component="div" id={questionId} variant="h5">
          {poll.question}
        </Typography>

        {poll.description && (
          <Typography component="div" variant="body2">
            <ExpandableText text={poll.description} />
          </Typography>
        )}

        {children}
      </CardContent>

      {extra && (
        <>
          <Divider />
          <CardContent>{extra}</CardContent>
        </>
      )}
    </Card>
  );
}
