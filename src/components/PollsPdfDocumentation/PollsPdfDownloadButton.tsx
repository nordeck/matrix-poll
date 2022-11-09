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
import { Button, Tooltip, Typography } from '@mui/material';
import { unstable_useId as useId, visuallyHidden } from '@mui/utils';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { Content, ContentText, TDocumentDefinitions } from 'pdfmake/interfaces';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AsyncState, isDefined } from '../../lib/utils';
import {
  RootState,
  selectGetVotes,
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
} from '../../store';
import { voteApi } from '../../store/api/voteApi';
import { createPdfPageHeader } from './components/createPdfPageHeader';
import { createPollPdfContent } from './components/createPollPdfContent';
import { zapfdingbats } from './zapfdingbats';

initializeFonts(pdfMake);

export function initializeFonts(pdf: typeof pdfMake) {
  pdf.vfs = {
    'ZapfDingbats.ttf': zapfdingbats,
  };

  Object.entries(pdfFonts.pdfMake.vfs).forEach(([n, f]) => {
    pdf.vfs[n] = f;
  });

  pdf.fonts = {};
  pdf.fonts['Roboto'] = {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf',
  };
  pdf.fonts['ZapfDingbats'] = {
    normal: 'ZapfDingbats.ttf',
  };
}

export const PollsPdfDownloadButton = () => {
  const { t } = useTranslation();
  const widgetApi = useWidgetApi();
  const dispatch = useAppDispatch();

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
    (state: RootState): AsyncState<Content> => {
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
        data: createPollPdfContent({
          pollResults,
          context: { t, getUserDisplayName },
        }),
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
      t,
      getUserDisplayName,
      roomMemberEvents,
      powerLevels?.event,
    ]
  );

  const { data: pdfContent, isLoading: isPdfContentLoading } =
    useAppSelector(pdfContentSelector);

  // TODO: use isPdfContentError

  useEffect(() => {
    if (isPdfContentLoading || !pdfContent) {
      return;
    }

    let blobUrl: string;
    const columns: TDocumentDefinitions = {
      pageMargins: [40, 80, 40, 40],
      pageSize: 'A4',
      content: pdfContent,
      version: '1.5',
      info: {
        title: roomName,
        author: authorName,
      },
      styles: {
        tableHeader: {
          alignment: 'center',
          bold: true,
          fontSize: 13,
        },
        tableBody: {
          alignment: 'center',
        },
        list: {
          margin: [5, 0, 0, 0],
        },
      },
      header() {
        return createPdfPageHeader({
          roomName,
          roomMemberEvents: roomMemberEvents
            ? selectRoomMembers(roomMemberEvents)
            : [],
          context: { t, getUserDisplayName },
        });
      },
      footer(currentPage, pageCount): ContentText {
        return {
          text: t('pollsPdfDownloadButton.footer', {
            defaultValue: '{{currentPage}} of {{pageCount}}',
            currentPage,
            pageCount,
          }) as string,
          alignment: 'center',
          margin: [10, 10],
        };
      },
    };

    const a = pdfMake.createPdf(columns);
    a.getBlob((blob) => {
      blobUrl = URL.createObjectURL(blob);
      setPdfUrl(blobUrl);
    });

    return () => {
      URL.revokeObjectURL(blobUrl);
    };
  }, [
    authorName,
    getUserDisplayName,
    isPdfContentLoading,
    pdfContent,
    roomMemberEvents,
    roomName,
    t,
    widgetApi.widgetParameters.userId,
  ]);

  const descriptionId = useId();
  const description = t(
    'pollsPdfDownloadButton.tooltip',
    'The provided PDF is currently not accessible and can not be read using a screen reader.'
  );

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
          component="a"
          disabled={!pdfUrl}
          download={`${roomName}.pdf`}
          fullWidth
          href={pdfUrl}
          target="_blank"
          variant="outlined"
        >
          {t(
            'pollsPdfDownloadButton.pdfDownload',
            'Download PDF documentation'
          )}
        </Button>
      </Tooltip>
    </>
  );
};

// React currently only allow lazy loading for default exports
// https://reactjs.org/docs/code-splitting.html#named-exports
export default PollsPdfDownloadButton;
