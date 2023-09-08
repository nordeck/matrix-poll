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

import { Box } from '@mui/material';
import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PollPanel } from './components';
import { AdminPanel } from './components/Admin/AdminPanel';
import { CreateGroupModal } from './components/Admin/CreateGroupModal/CreateGroupModal';
import { CreatePollModal } from './components/CreatePollModal/CreatePollModal';
import { createPollStatusNotificationsMiddleware } from './components/PollStatusNotifications';
import { useNotifications } from './components/PollStatusNotifications/PollStatusNotificationsProvider';
import { StoreProvider } from './store';

function App() {
  const { showNotification } = useNotifications();
  const [pollNotificationsMiddleware] = useState(() =>
    createPollStatusNotificationsMiddleware({ showNotification }),
  );

  return (
    <StoreProvider middlewares={[pollNotificationsMiddleware]}>
      <Box height="100vh">
        <Routes>
          <Route element={<PollPanel />} index />
          <Route element={<CreatePollModal />} path="create-poll" />
          <Route path="/admin">
            <Route element={<AdminPanel />} index />
            <Route element={<CreateGroupModal />} path="create-group" />
          </Route>
        </Routes>
      </Box>
    </StoreProvider>
  );
}

export default App;
