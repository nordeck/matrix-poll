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

import { Link } from '@mui/material';
import { unstable_useId as useId } from '@mui/utils';
import { MouseEvent, ReactElement, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LinesEllipsis from 'react-lines-ellipsis';

/**
 * Props for the {@link ExpandableText} component.
 */
type ExpandableTextProps = {
  /** the text to display */
  text: string;

  /** the maximal amount of lines before adding ellipses (defaults to 2) */
  maxLine?: number;
};

/**
 * Crop text if has more lines than configured, add ellipsis and a "read more" link.
 *
 * @param param0 - {@link ExpandableTextProps}
 */
export function ExpandableText({
  text,
  maxLine = 2,
}: ExpandableTextProps): ReactElement {
  const { t } = useTranslation();
  const [showExpanded, setShowExpanded] = useState(false);
  const ref = useRef<HTMLButtonElement | null>(null);

  const handleCollapse = useCallback((e: MouseEvent) => {
    e.preventDefault();
    setShowExpanded(false);

    // reset the focus to the new button
    setTimeout(() => {
      ref.current?.focus();
    }, 0);
  }, []);

  const handleExpand = useCallback((e: MouseEvent) => {
    e.preventDefault();
    setShowExpanded(true);

    // reset the focus to the new button
    setTimeout(() => {
      ref.current?.focus();
    }, 0);
  }, []);

  const id = useId();

  if (showExpanded) {
    return (
      <div id={id}>
        {text}{' '}
        <Link
          aria-controls={id}
          aria-expanded="true"
          component="button"
          onClick={handleCollapse}
          ref={ref}
          variant="body2"
        >
          {t('voteView.readLess', 'Read less')}
        </Link>
      </div>
    );
  }

  return (
    <LinesEllipsis
      ellipsis={
        <>
          {'... '}
          <Link
            aria-controls={id}
            aria-expanded="false"
            component="button"
            onClick={handleExpand}
            ref={ref}
            variant="body2"
          >
            {t('voteView.readMore', 'Read more')}
          </Link>
        </>
      }
      id={id}
      maxLine={maxLine}
      text={text}
    />
  );
}
