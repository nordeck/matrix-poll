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

import { WidgetApiMockProvider } from '@matrix-widget-toolkit/react';
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { isFunction } from 'lodash';
import * as pdfMake from 'pdfmake/build/pdfmake';
import { ComponentType, PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';
import { mockPoll, mockRoomMember, mockRoomName } from '../../lib/testUtils';
import { PollType } from '../../model';
import { createStore } from '../../store';
import { PollsPdfDownloadButton } from './PollsPdfDownloadButton';

jest.mock('pdfmake/build/pdfmake', () => ({
  createPdf: jest.fn(),
}));

const createPdfMock = jest.mocked(pdfMake.createPdf);

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('<PollsPdfDownloadButton/>', () => {
  let Wrapper: ComponentType<PropsWithChildren<{}>>;
  let createPdfMockReturnValue: jest.Mocked<
    ReturnType<typeof pdfMake.createPdf>
  >;

  beforeEach(() => {
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: '@user-id',
        content: {
          displayname: 'My User',
        },
      })
    );

    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-0',
        content: {
          startTime: '2020-01-02T00:00:00Z',
          endTime: '2020-01-02T00:01:00Z',
          title: 'Second Poll',
          pollType: PollType.ByName,
          groups: undefined,
        },
      })
    );

    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-1',
        content: {
          startTime: '2020-01-01T00:00:00Z',
          endTime: '2020-01-01T00:01:00Z',
          title: 'First Poll',
          groups: undefined,
        },
      })
    );

    widgetApi.mockSendStateEvent(
      mockPoll({
        state_key: 'poll-2',
        content: {
          startTime: '2999-12-31T23:23:59Z',
          endTime: '2999-12-31T23:24:59Z',
          title: 'Third Poll',
          groups: undefined,
        },
      })
    );

    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: 'user-alice',
        content: { displayname: 'Alice' },
      })
    );

    widgetApi.mockSendStateEvent(mockRoomName());

    Wrapper = ({ children }: PropsWithChildren<{}>) => {
      const store = useMemo(() => createStore({ widgetApi }), []);
      return (
        <WidgetApiMockProvider value={widgetApi}>
          <Provider store={store}>{children}</Provider>
        </WidgetApiMockProvider>
      );
    };

    createPdfMockReturnValue = {
      getBlob: jest.fn(),
      download: jest.fn(),
      getBase64: jest.fn(),
      getBuffer: jest.fn(),
      getDataUrl: jest.fn(),
      getStream: jest.fn(),
      open: jest.fn(),
      print: jest.fn(),
    };

    createPdfMock.mockReturnValue(createPdfMockReturnValue);

    createPdfMockReturnValue.getBlob.mockImplementation((cb) =>
      cb(new Blob(['value']))
    );

    (URL.createObjectURL as jest.Mock).mockReturnValue('blob:url');
  });

  it('should show PDF generation button', async () => {
    render(<PollsPdfDownloadButton />, { wrapper: Wrapper });

    expect(
      await screen.findByRole('button', {
        name: 'Generate PDF documentation',
        description: /not accessible/i,
      })
    ).toBeInTheDocument();
  });

  it('should disable PDF download button while PDF is generated', async () => {
    createPdfMockReturnValue.getBlob.mockImplementation(() => {});

    render(<PollsPdfDownloadButton />, { wrapper: Wrapper });

    userEvent.click(
      await screen.findByRole('button', { name: 'Generate PDF documentation' })
    );

    const pdfDialog = await screen.findByRole('dialog', {
      name: 'Download the PDF',
      description:
        'The PDF report is being generated and can be downloaded once it is ready.',
    });

    expect(
      within(pdfDialog).getByRole('button', { name: 'Loading' })
    ).toBeInTheDocument();

    expect(
      within(pdfDialog).getByRole('button', { name: 'Cancel' })
    ).toBeInTheDocument();
  });

  it('should generate PDF on open dialog', async () => {
    render(<PollsPdfDownloadButton />, { wrapper: Wrapper });

    userEvent.click(
      await screen.findByRole('button', { name: 'Generate PDF documentation' })
    );

    expect(
      await screen.findByRole('dialog', { name: 'Download the PDF' })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(createPdfMock).toHaveBeenLastCalledWith({
        content: [
          [
            {
              marginTop: 20,
              pageBreak: 'after',
              stack: [
                [
                  {
                    color: '#444',
                    style: 'tableExample',
                    table: {
                      body: expect.arrayContaining([
                        [
                          {
                            alignment: 'left',
                            fillColor: '#aaa',
                            style: 'tableHeader',
                            text: '1 - First Poll',
                          },
                          {
                            alignment: 'center',
                            fillColor: '#aaa',
                            style: 'tableHeader',
                            text: 'Open poll',
                          },
                        ],
                      ]),
                      headerRows: 1,
                      widths: ['65%', '35%'],
                    },
                  },
                ],
                expect.arrayContaining([]),
                expect.arrayContaining([]),
              ],
            },
            {
              marginTop: 20,
              pageBreak: undefined,
              stack: [
                [
                  {
                    color: '#444',
                    style: 'tableExample',
                    table: {
                      body: expect.arrayContaining([
                        [
                          {
                            alignment: 'left',
                            fillColor: '#aaa',
                            style: 'tableHeader',
                            text: '2 - Second Poll',
                          },
                          {
                            alignment: 'center',
                            fillColor: '#aaa',
                            style: 'tableHeader',
                            text: 'Poll by name',
                          },
                        ],
                      ]),
                      headerRows: 1,
                      widths: ['65%', '35%'],
                    },
                  },
                ],
                expect.arrayContaining([]),
                expect.arrayContaining([]),
              ],
            },
          ],
        ],
        footer: expect.any(Function),
        header: expect.any(Function),
        info: {
          title: 'My Room',
          author: 'My User',
        },
        version: '1.5',
        pageMargins: [40, 80, 40, 40],
        pageSize: 'A4',
        styles: {
          tableBody: {
            alignment: 'center',
          },
          tableHeader: {
            alignment: 'center',
            bold: true,
            fontSize: 13,
          },
          list: {
            margin: [5, 0, 0, 0],
          },
        },
      });
    });

    const { header } =
      createPdfMock.mock.calls[createPdfMock.mock.calls.length - 1][0];

    expect(
      isFunction(header) &&
        header(1, 5, {
          height: 0,
          width: 0,
          orientation: 'landscape',
        })
    ).toEqual([
      {
        stack: [
          {
            alignment: 'center',
            bold: true,
            fontSize: 20,
            margin: [0, 30, 0, 10],
            text: 'My Room',
          },
          {
            columnGap: 30,
            columns: [
              { text: 'Joined persons: 2', width: '*', alignment: 'right' },
              { text: 'Invited persons: 0', width: '*' },
            ],
          },
        ],
      },
    ]);

    const { footer } =
      createPdfMock.mock.calls[createPdfMock.mock.calls.length - 1][0];

    expect(
      isFunction(footer) &&
        footer(1, 5, {
          height: 0,
          width: 0,
          orientation: 'landscape',
        })
    ).toEqual({
      alignment: 'center',
      margin: [10, 10],
      text: '1 of 5',
    });
  });

  it('should show PDF download button', async () => {
    render(<PollsPdfDownloadButton />, { wrapper: Wrapper });

    userEvent.click(
      await screen.findByRole('button', { name: 'Generate PDF documentation' })
    );

    await waitFor(() => {
      const pdfDialog = screen.getByRole('dialog', {
        name: 'Download the PDF',
        description:
          'The PDF report is being generated and can be downloaded once it is ready.',
      });

      expect(
        within(pdfDialog).getByRole('link', {
          name: 'Download',
          description: /not accessible/i,
        })
      ).toHaveAttribute('href', 'blob:url');
    });

    // TODO: how to test the URL.revokeObjectURL(blobUrl) ??????
  });

  it('should show error', async () => {
    widgetApi.receiveStateEvents.mockRejectedValue(new Error('Some Error'));

    render(<PollsPdfDownloadButton />, { wrapper: Wrapper });

    userEvent.click(
      await screen.findByRole('button', { name: 'Generate PDF documentation' })
    );

    expect(
      await screen.findByRole('dialog', { name: 'Download the PDF' })
    ).toBeInTheDocument();

    await waitFor(() => {
      const pdfDialog = screen.getByRole('dialog', {
        name: 'Download the PDF',
        description:
          'The PDF report is being generated and can be downloaded once it is ready.',
      });

      const alert = within(pdfDialog).getByRole('status');
      expect(
        within(alert).getByText(
          'Something went wrong while generating the PDF documentation.'
        )
      ).toBeInTheDocument();
    });
  });
});
