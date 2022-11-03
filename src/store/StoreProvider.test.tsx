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

import { WidgetApi } from '@matrix-widget-toolkit/api';
import { useWidgetApi as useWidgetApiMocked } from '@matrix-widget-toolkit/react';
import { configureStore, createReducer } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { TypedUseSelectorHook, useSelector } from 'react-redux';
import { createStore } from './store';
import { StoreProvider } from './StoreProvider';

jest.mock('./store');
jest.mock('@matrix-widget-toolkit/react');

const useWidgetApi = useWidgetApiMocked as jest.MockedFunction<
  typeof useWidgetApiMocked
>;

describe('StoreProvider', () => {
  it('should work', () => {
    const store = configureStore({
      reducer: {
        example: createReducer({ title: 'Example' }, {}),
      },
    });
    const useAppSelector: TypedUseSelectorHook<
      ReturnType<typeof store.getState>
    > = useSelector;

    const ExampleWidget = () => {
      const value = useAppSelector((state) => state.example.title);
      return <p>{value}</p>;
    };

    (createStore as jest.Mock).mockReturnValue(store);

    const widgetApi = {
      widgetParameters: {
        roomId: 'room-1234',
        userId: 'user-1234',
      },
    };

    useWidgetApi.mockReturnValue(widgetApi as WidgetApi);

    render(
      <StoreProvider>
        <ExampleWidget />
      </StoreProvider>
    );

    expect(screen.getByText(/example/i)).toBeInTheDocument();
    expect(createStore).toBeCalledWith({
      widgetApi,
    });
  });
});
