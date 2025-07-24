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
import { configureStore, Middleware } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { baseApi } from './api';

const loggerMiddleware: Middleware = () => (next) => (action: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('LOGGER', action);
  }
  return next(action);
};

export function createStore({
  widgetApi,
  middlewares = [],
}: {
  widgetApi: WidgetApi;
  middlewares?: Middleware[];
}) {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: {
            widgetApi,
          } as ThunkExtraArgument,
        },
      })
        .concat(middlewares)
        .concat(loggerMiddleware)
        .concat(baseApi.middleware),
  });
  return store;
}

/**
 * Extra arguments that are provided to `createAsyncThunk`
 */
export type ThunkExtraArgument = {
  widgetApi: WidgetApi;
};

type StoreType = ReturnType<typeof createStore>;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<StoreType['getState']>;
export type AppDispatch = StoreType['dispatch'];

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
