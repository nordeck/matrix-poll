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
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';

export function GroupCardSkeleton() {
  return (
    <Card variant="outlined">
      <CardHeader
        avatar={<Skeleton height={40} variant="circular" width={40} />}
        title={<Skeleton width="50%" />}
        titleTypographyProps={{
          variant: 'h4',
        }}
      />
      <Divider />
      <CardContent>
        <Stack alignItems="center" direction="row">
          <Typography component="div" flex={1} ml={1} variant="h5">
            <Skeleton width="50%" />
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
