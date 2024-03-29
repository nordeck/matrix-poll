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

import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { renderHook } from '@testing-library/react-hooks';
import { ComponentType, PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { mockRoomMember } from '../../lib/testUtils';
import { createStore } from '../store';
import { useUserDetails } from './useUserDetails';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('useUserDetails', () => {
  let wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    const store = createStore({ widgetApi });

    widgetApi.mockSendStateEvent(mockRoomMember());

    wrapper = ({ children }) => {
      return <Provider store={store}>{children}</Provider>;
    };
  });

  it('should generate display name', async () => {
    const { result, waitFor } = renderHook(useUserDetails, { wrapper });

    await waitFor(() => {
      expect(result.current.getUserDisplayName('@user-alice')).toBe('Alice');
    });
    expect(result.current.getUserDisplayName('@other-user-id')).toBe(
      '@other-user-id',
    );
  });
});
