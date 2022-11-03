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

import { useWidgetApi } from '@matrix-widget-toolkit/react';
import { useEffect, useState } from 'react';
import { IPoll } from '../../model';
import { CreatePollForm } from './CreatePollForm';
import {
  CancelPollModal,
  PollModalRequestData,
  PollModalResult,
  SubmitPollModal,
} from './types';

export const CreatePollModal = () => {
  const widgetApi = useWidgetApi();
  const initialPoll =
    widgetApi.getWidgetConfig<PollModalRequestData>()?.data.poll;
  const [poll, setPoll] = useState<IPoll | undefined>();
  const isValid = poll !== undefined;

  useEffect(() => {
    widgetApi.setModalButtonEnabled(SubmitPollModal, isValid);
  }, [widgetApi, isValid]);

  useEffect(() => {
    const subscription = widgetApi
      .observeModalButtons()
      .subscribe(async (buttonId) => {
        switch (buttonId) {
          case CancelPollModal:
            await widgetApi.closeModal();
            break;
          case SubmitPollModal:
            if (poll) {
              await widgetApi.closeModal<PollModalResult>({
                poll,
              });
            }
            break;
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [poll, widgetApi]);

  return <CreatePollForm onPollChange={setPoll} poll={initialPoll} />;
};
