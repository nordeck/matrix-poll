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
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  AlertTitle,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
  Typography,
} from '@mui/material';
import { unstable_useId as useId, visuallyHidden } from '@mui/utils';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AsyncState, isDefined } from '../../lib/utils';
import {
  RootState,
  selectGetVotes,
  SelectPollResults,
  selectPollResults,
  selectPollsFinished,
  selectRoomMembers,
  useAppDispatch,
  useAppSelector,
  useGetPollsQuery,
  useGetPowerLevelsQuery,
  useGetRoomMembersQuery,
  useGetRoomNameQuery,
  useUserDetails,
  voteApi,
} from '../../store';
import { createPollPdf } from './pdf';

export const PollsPdfDownloadButton = () => {
  const { t } = useTranslation();
  const widgetApi = useWidgetApi();
  const dispatch = useAppDispatch();

  const [pdfModalOpen, setPdfModalOpen] = useState<boolean>(false);
  const [pdfWasGenerated, setPdfWasGenerated] = useState<boolean>(false);

  const [pdfUrl, setPdfUrl] = useState<string>();
  const { getUserDisplayName } = useUserDetails();

  const authorName = widgetApi.widgetParameters.userId
    ? getUserDisplayName(widgetApi.widgetParameters.userId)
    : '';
  const { data: roomNameEvent } = useGetRoomNameQuery();
  const roomName = roomNameEvent?.event?.content.name ?? 'UnknownRoom';
  const {
    data: roomMemberEvents,
    isLoading: isRoomMembersEventsLoading,
    isError: isRoomMembersEventsError,
  } = useGetRoomMembersQuery();
  const {
    data: pollEvents,
    isLoading: isPollEventsLoading,
    isError: isPollEventsError,
  } = useGetPollsQuery();
  const {
    data: powerLevels,
    isLoading: isPowerLevelsLoading,
    isError: isPowerLevelsError,
  } = useGetPowerLevelsQuery();

  // subscribe to all relevant `getVotes` calls so the requests are triggered
  // and we can use the selector to retrieve the status. this replicates what
  // happens internally in useGetVotesQuery(...) with the added flexibility that
  // we can loop the calls, which is not possible with a hook.
  useEffect(() => {
    if (!pollEvents) {
      return () => {};
    }

    const finishedPolls = pollEvents ? selectPollsFinished(pollEvents) : [];

    const subscriptions = finishedPolls.map((p) =>
      dispatch(
        voteApi.endpoints.getVotes.initiate({
          pollId: p.state_key,
          pollStartEventId: p.content.startEventId,
        })
      )
    );

    return () => {
      subscriptions.forEach((s) => s.unsubscribe());
    };
  }, [dispatch, pollEvents]);

  const pdfContentSelector = useCallback(
    (state: RootState): AsyncState<SelectPollResults[]> => {
      if (isRoomMembersEventsError || isPollEventsError || isPowerLevelsError) {
        return { isLoading: false, isError: true };
      }

      if (
        isPollEventsLoading ||
        isRoomMembersEventsLoading ||
        isPowerLevelsLoading ||
        !pollEvents
      ) {
        return { isLoading: true };
      }

      const finishedPolls = pollEvents ? selectPollsFinished(pollEvents) : [];

      if (
        finishedPolls.some((pollEvent) => {
          const votes = voteApi.endpoints.getVotes.select({
            pollId: pollEvent.state_key,
            pollStartEventId: pollEvent.content.startEventId,
          })(state);
          return votes.isUninitialized || votes.isLoading;
        })
      ) {
        return { isLoading: true };
      }

      const pollResults = finishedPolls
        .map((pollEvent) => {
          // use the selector to retrieve the latest votes of the poll. note that
          // this selector doesn't actually trigger the request. this is done in
          // the separate useEffect call above.
          const votes = voteApi.endpoints.getVotes.select({
            pollId: pollEvent.state_key,
            pollStartEventId: pollEvent.content.startEventId,
          })(state);
          const voteEvents = selectGetVotes(pollEvent, votes.data ?? []);

          return selectPollResults(
            pollEvent,
            voteEvents,
            roomMemberEvents,
            powerLevels?.event,
            { includeInvalidVotes: true }
          );
        })
        .filter(isDefined)
        // show the oldest first
        .reverse();

      return {
        isLoading: false,
        data: pollResults,
      };
    },
    [
      isRoomMembersEventsError,
      isPollEventsError,
      isPowerLevelsError,
      isPollEventsLoading,
      isRoomMembersEventsLoading,
      isPowerLevelsLoading,
      pollEvents,
      roomMemberEvents,
      powerLevels?.event,
    ]
  );

  const {
    data: pollResults,
    isLoading: isPdfContentLoading,
    isError: isPdfContentError,
  } = useAppSelector(pdfContentSelector);

  const generatePDFAndOpenDialog = useCallback(() => {
    setPdfModalOpen(true);

    if (pdfWasGenerated) {
      return false;
    }

    if (pollResults) {
      let blobUrl: string;

      createPollPdf({
        roomName,
        authorName,
        pollResults,
        roomMemberEvents: roomMemberEvents
          ? selectRoomMembers(roomMemberEvents)
          : [],
        getUserDisplayName,
      })
        .then((blob) => {
          blobUrl = URL.createObjectURL(blob);
          setPdfUrl(blobUrl);
          return;
        })
        .catch((ex) => {
          // todo...
        });

      setPdfWasGenerated(true);

      return () => {
        URL.revokeObjectURL(blobUrl);
      };
    }
  }, [
    pdfWasGenerated,
    roomName,
    authorName,
    pollResults,
    roomMemberEvents,
    getUserDisplayName,
  ]);

  const handleCloseModal = useCallback(() => {
    setPdfModalOpen(false);
  }, []);

  const descriptionId = useId();
  const description = t(
    'pollsPdfDownloadButton.tooltip',
    'The provided PDF is currently not accessible and can not be read using a screen reader.'
  );

  const dialogTitleId = useId();
  const dialogDescriptionId = useId();

  return (
    <>
      <Typography aria-hidden id={descriptionId} sx={visuallyHidden}>
        {description}
      </Typography>
      <Tooltip
        describeChild
        title={
          // This fragment is intentional, so that the tooltip doesn't apply the
          // description as a title to the link. Instead we want the text inside
          // the link to be the accessible name.
          <>{description}</>
        }
      >
        <Button
          aria-describedby={descriptionId}
          fullWidth
          onClick={generatePDFAndOpenDialog}
          variant="contained"
        >
          {t(
            'pollsPdfDownloadButton.generatePDF',
            'Generate PDF documentation'
          )}
        </Button>
      </Tooltip>

      <Dialog
        aria-describedby={dialogDescriptionId}
        aria-labelledby={dialogTitleId}
        onClose={handleCloseModal}
        open={pdfModalOpen}
      >
        <DialogTitle component="h3" id={dialogTitleId} sx={{ flex: 1 }}>
          {t('pollsPdfDownloadModal.title', 'Download the PDF')}
        </DialogTitle>

        <DialogContent sx={{ pt: 0 }}>
          <DialogContentText id={dialogDescriptionId}>
            {t(
              'pollsPdfDownloadModal.description',
              'The PDF report is being generated and can be downloaded once it is ready.'
            )}
          </DialogContentText>
          {isPdfContentError && (
            <Alert role="status" severity="error" sx={{ my: 2 }}>
              <AlertTitle>
                {t(
                  'pollsPdfDownloadModal.error',
                  'Something went wrong while generating the PDF documentation.'
                )}
              </AlertTitle>
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseModal} sx={{ mx: 1 }} variant="outlined">
            {t('pollsPdfDownloadModal.cancel', 'Cancel')}
          </Button>

          <LoadingButton
            aria-describedby={descriptionId}
            component="a"
            disabled={isPdfContentError}
            download={`${roomName}.pdf`}
            href={pdfUrl}
            loading={isPdfContentLoading || !pollResults || !pdfUrl}
            target="_blank"
            variant="contained"
          >
            {isPdfContentLoading || !pollResults || !pdfUrl
              ? t('pollsPdfDownloadModal.pdfLoading', 'Loading')
              : t('pollsPdfDownloadModal.pdfDownload', 'Download')}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

// React currently only allow lazy loading for default exports
// https://reactjs.org/docs/code-splitting.html#named-exports
export default PollsPdfDownloadButton;
