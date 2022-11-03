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
import { GroupContent } from '../../../model/IGroup';
import { GroupForm } from './GroupForm';
import {
  CancelCreateGroupModal,
  GroupModalRequestData,
  GroupModalResult,
  SubmitCreateGroupModal,
} from './types';

export const CreateGroupModal = () => {
  const widgetApi = useWidgetApi();
  const initialGroup =
    widgetApi.getWidgetConfig<GroupModalRequestData>()?.data.group;
  const groupId =
    widgetApi.getWidgetConfig<GroupModalRequestData>()?.data.groupId;
  const [group, setGroup] = useState<GroupContent | undefined>();
  const isValid = group !== undefined;

  useEffect(() => {
    widgetApi.setModalButtonEnabled(SubmitCreateGroupModal, isValid);
  }, [widgetApi, isValid]);

  useEffect(() => {
    const subscription = widgetApi
      .observeModalButtons()
      .subscribe(async (buttonId) => {
        switch (buttonId) {
          case CancelCreateGroupModal:
            await widgetApi.closeModal();
            break;
          case SubmitCreateGroupModal:
            if (group) {
              await widgetApi.closeModal<GroupModalResult>({
                group,
              });
            }
            break;
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [group, widgetApi]);

  return (
    <GroupForm
      group={initialGroup}
      groupId={groupId}
      onGroupChange={setGroup}
    />
  );
};
