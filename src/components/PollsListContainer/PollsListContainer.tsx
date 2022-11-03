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

import { Stack } from '@mui/material';
import { ComponentPropsWithRef, PropsWithChildren } from 'react';

type PollListContainerProps = PropsWithChildren<
  ComponentPropsWithRef<'ul'> & {
    title?: string;
    pollLength?: number;
  }
>;

export const PollsListContainer = ({
  children,
  ...ulProps
}: PollListContainerProps) => {
  return (
    <Stack component="ul" my={0} px={1} spacing={1} {...ulProps}>
      {children}
    </Stack>
  );
};
