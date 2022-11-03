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

import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import { ellipsis } from '../../lib/ellipsis';

type SectionHeadingDividerProps = {
  id?: string;
  title: string;
  count?: number;
};

export function SectionHeadingDivider({
  id,
  title,
  count,
}: SectionHeadingDividerProps) {
  return (
    <Box
      bgcolor="background.default"
      position="sticky"
      pt={1}
      px={2}
      top={0}
      zIndex={1}
    >
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="center"
        mb={1}
        minHeight={32}
        spacing={1}
      >
        <Typography component="h3" id={id} sx={ellipsis} variant="h5">
          {title}
        </Typography>
        {count !== undefined && (
          // Always force variant filled, even in high contrast mode
          <Chip
            aria-hidden="true"
            color="primary"
            label={count}
            variant="filled"
          />
        )}
      </Stack>

      <Divider />
    </Box>
  );
}
