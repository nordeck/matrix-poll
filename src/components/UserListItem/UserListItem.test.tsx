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
import { Button } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { ComponentType, PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { mockRoomMember } from '../../lib/testUtils';
import { createStore } from '../../store';
import { UserListItem } from './UserListItem';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<UserListItem/>', () => {
  let wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        content: { avatar_url: undefined },
      })
    );

    const store = createStore({ widgetApi });

    wrapper = ({ children }) => {
      return <Provider store={store}>{children}</Provider>;
    };
  });

  it('should render without exploding', async () => {
    render(<UserListItem userId="@user-alice" />, { wrapper });

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('A')).toHaveAttribute('aria-hidden', 'true');
  });

  it('should render with custom children exploding', async () => {
    render(
      <UserListItem userId="@user-alice">
        <Button>Test</Button>
      </UserListItem>,
      { wrapper }
    );

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /test/i })).toBeInTheDocument();
  });
});
