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

import { StateEvent } from '@matrix-widget-toolkit/api';
import { useCallback, useEffect, useState } from 'react';
import { useInterval } from 'react-use';
import { AsyncState } from '../../lib/utils';
import { IPollSettings } from '../../model';
import { useGetPollSettingsQuery } from '../../store';

function evaluateCanDownloadPdf(
  pollSettings: StateEvent<IPollSettings> | undefined,
): boolean {
  return (
    !pollSettings?.content?.pdfButtonDisabledAfter ||
    new Date(pollSettings.content.pdfButtonDisabledAfter) > new Date()
  );
}

export function useCanDownloadPdf(): AsyncState<boolean> {
  const [canDownloadPdf, setCanDownloadPdf] = useState(true);
  const { data: pollSettings, isLoading: isPollSettingsLoading } =
    useGetPollSettingsQuery();

  const updateEnabledFlag = useCallback(() => {
    setCanDownloadPdf(evaluateCanDownloadPdf(pollSettings?.event));
  }, [pollSettings]);

  useEffect(() => {
    setCanDownloadPdf(evaluateCanDownloadPdf(pollSettings?.event));
  }, [pollSettings]);

  useInterval(updateEnabledFlag, canDownloadPdf ? 1000 : null);

  return { data: canDownloadPdf, isLoading: isPollSettingsLoading };
}
