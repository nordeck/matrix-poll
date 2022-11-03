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

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Chip, keyframes, SxProps, Theme, Typography } from '@mui/material';
import { DateTime } from 'luxon';
import { AriaAttributes, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInterval } from 'react-use';

const flash = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const rotation = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(359deg); }
`;

type TimeDistanceProps = {
  /** The duration used when no startTime and/or endTime are provided. */
  fallbackDuration?: number;
  /** The time when the poll starts */
  startTime?: string;
  /** The time when the poll ends */
  endTime?: string;
  sx?: SxProps<Theme>;
};

type State =
  | {
      interval: null;
      renderLabel: false;
      endMinutes?: number;
    }
  | {
      endMinutes: number;
      animated: boolean;
      iconName: string;
      interval: number;
      labelColor: string;
      labelText: string;
      renderLabel: true;
      startHours: number;
    };

export const TimeDistance = ({
  fallbackDuration = 0,
  startTime,
  endTime,
  sx,
}: TimeDistanceProps) => {
  const { t } = useTranslation();

  const paused = !endTime || !startTime;
  const duration =
    endTime && startTime
      ? DateTime.fromISO(endTime)
          .diff(DateTime.fromISO(startTime), 'minute')
          .as('minutes')
      : fallbackDuration;

  const getLabelColor = (minutes: number): string => {
    const halfTime = minutes <= duration && minutes > duration / 2;
    const threeQuarters = minutes < duration / 2 && minutes > duration / 4;
    const lastQuarters = minutes < duration / 4;

    switch (true) {
      case halfTime:
        return 'primary';
      case threeQuarters:
        return 'warning';
      case lastQuarters:
        return 'error';
      default:
        return 'primary';
    }
  };

  const getTimeData = (old: State | undefined = undefined): State => {
    const now = DateTime.now();
    const startDate = startTime ? DateTime.fromISO(startTime) : now;
    const startDuration = startDate.diff(now);
    const startHours = startDuration.as('hours');

    const endDate = endTime
      ? DateTime.fromISO(endTime)
      : startDate.plus({ minutes: duration });
    const endDuration = endDate.diff(now);
    const endHours = endDuration.as('hours');
    const endMinutes = endDuration.as('minutes');

    const exactDurationFormat =
      endHours >= 1.0 ? 'hh:mm:ss' : endMinutes >= 1.0 ? 'mm:ss' : 'ss';

    if (endHours > 0) {
      // the meeting is running
      const lastMinute = endMinutes;
      const updateLabel =
        old === undefined ||
        lastMinute ||
        !(~~(old.endMinutes ?? 0) === ~~endMinutes);
      return !updateLabel
        ? old
        : {
            animated: true,
            iconName: 'clock outline',
            interval: 1000, // update every second
            labelColor: getLabelColor(endMinutes),
            labelText: !lastMinute
              ? endDuration.toHuman()
              : t('timeDistance.remainingExact', {
                  defaultValue: 'Ends in {{time}}',
                  time: endDuration.toFormat(exactDurationFormat),
                }),
            renderLabel: true,
            startHours,
            endMinutes,
          };
    } else {
      return {
        // stop rendering a label for this meeting
        interval: null,
        renderLabel: false,
      };
    }
  };

  const [timeDistance, setTimeDistance] = useState(getTimeData);

  useInterval(() => {
    if (!paused) {
      setTimeDistance(getTimeData);
    }
  }, timeDistance.interval);

  return timeDistance.renderLabel ? (
    <>
      <TimeDistanceComponent
        // this component reserves the space to move others away
        animated={timeDistance.animated}
        aria-hidden="true"
        labelColor={timeDistance.labelColor}
        labelText={timeDistance.labelText}
        paused={paused}
        startHours={timeDistance.startHours}
        sx={{ ...sx, position: 'relative', visibility: 'hidden' }}
      />
      <TimeDistanceComponent
        // this component renders the actual label
        animated={timeDistance.animated}
        labelColor={timeDistance.labelColor}
        labelText={timeDistance.labelText}
        paused={paused}
        startHours={timeDistance.startHours}
        sx={sx}
      />
    </>
  ) : null;
};

function TimeDistanceComponent({
  animated,
  paused,
  labelText,
  startHours,
  labelColor,
  sx,
  ...ariaAttributes
}: AriaAttributes & {
  animated: boolean;
  paused: boolean | undefined;
  labelText: string;
  startHours: number;
  labelColor: string;
  sx?: SxProps<Theme>;
}) {
  return (
    <Chip
      {...ariaAttributes}
      avatar={<AccessTimeIcon />}
      label={
        <Typography
          component="span"
          fontSize="inherit"
          sx={{
            display: 'block',
            fontWeight: 'bold',
            animation:
              animated && !paused
                ? `${flash} 1s ease-in-out infinite`
                : undefined,
            animationFillMode: 'both',
            fontVariantNumeric: 'tabular-nums',
          }}
          variant="body2"
        >
          {labelText}
        </Typography>
      }
      size="small"
      sx={{
        '& .MuiChip-avatar': {
          color: 'inherit',
          height: 12,
          width: 12,
        },

        '& .MuiSvgIcon-root': {
          animation:
            startHours < 0 && !paused
              ? `${rotation} 2s infinite linear`
              : undefined,
        },

        '& .MuiChip-label': {
          px: 2,
        },

        bgcolor: `${labelColor}.main`,
        color: `${labelColor}.contrastText`,
        borderRadius: 0.5,
        borderEndEndRadius: 0,
        borderStartEndRadius: 0,
        height: 18,

        position: 'absolute',
        right: '-1.2em',
        fontSize: '0.6rem',

        '&:after': {
          content: '""',
          borderColor: 'transparent',
          borderStyle: 'solid',
          borderTopColor: `${labelColor}.dark`,
          borderWidth: '1.2em 1.2em 0 0',
          position: 'absolute',
          top: '100%',
          right: 0,
          transition: (theme) => theme.transitions.create(['border-color']),
        },

        ...sx,
      }}
      variant="filled"
    />
  );
}
