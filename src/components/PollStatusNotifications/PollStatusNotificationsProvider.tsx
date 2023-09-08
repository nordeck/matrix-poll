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
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';

// https://allyjs.io/tutorials/hiding-elements.html
// Element is visually hidden but is readable by screen readers
const visuallyHiddenCss = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  border: '0',
  padding: '0',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  'clip-path': 'inset(100%)',
};

type NotificationType = 'info';

export type ShowNotificationFn = (
  type: NotificationType,
  message: string,
) => void;

type NotificationsState = {
  showNotification: ShowNotificationFn;
};

export const NotificationsContext = createContext<
  NotificationsState | undefined
>(undefined);

export function useNotifications(): NotificationsState {
  const context = useContext(NotificationsContext);

  if (context === undefined) {
    throw new Error(
      'useNotifications must be used within a PollStatusNotificationsProvider',
    );
  }

  return context;
}

export function PollStatusNotificationsProvider({
  children,
}: PropsWithChildren<{}>) {
  const ref = useRef<HTMLElement | null>(null);

  // Create a manually managed div element and add content when we need it. Only
  // _changes_ to a live region are announced, not the initial value, reliably.
  // We use a div with role=log and add p-tags for each element. We also remove
  // the messages after a timeout to reduce the risk of reading old messages.
  //
  // This implementation is based on https://www.scottohara.me/blog/2022/02/05/are-we-live.html
  // We use "Demo 6".
  useEffect(() => {
    const el = document.createElement('div');
    ref.current = el;

    el.setAttribute('role', 'log');
    el.setAttribute('aria-atomic', 'false');

    Object.assign(el.style, visuallyHiddenCss);

    document.body.appendChild(el);

    return () => {
      el.remove();
      if (el === ref.current) {
        ref.current = null;
      }
    };
  }, []);

  const showNotification = useCallback<ShowNotificationFn>((_, message) => {
    let el: HTMLElement | undefined;

    // add the message after a timeout to work around issues where the live
    // region was set to `aria-hidden` by a modal (ex: start a poll) and the
    // notification was not announced if we added it to early.
    setTimeout(() => {
      // skip add messages that are already present to prevent instabilities
      // if the caller of this function can't reliably deduplicate the calls.
      if (
        ref.current &&
        !Array.from(ref.current.childNodes).some(
          (c) => c.textContent === message,
        )
      ) {
        el = document.createElement('p');
        el.textContent = message;
        ref.current.appendChild(el);
      }
    }, 1000);

    // remove the message after a timeout
    setTimeout(() => {
      if (el) {
        el.remove();
      }
    }, 10000);
  }, []);

  const context = useMemo<NotificationsState>(
    () => ({ showNotification }),
    [showNotification],
  );

  return (
    <NotificationsContext.Provider value={context}>
      {children}
    </NotificationsContext.Provider>
  );
}
