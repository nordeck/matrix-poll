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

import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { act } from 'react-dom/test-utils';
import { TimeDistance } from './TimeDistance';

afterEach(() => {
  jest.useRealTimers();
});

describe('<TimeDistance/>', () => {
  it('should render without exploding', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:01:00Z'));

    render(
      <TimeDistance
        endTime="2020-01-01T00:02:00Z"
        startTime="2020-01-01T00:00:00Z"
      />
    );

    expect(screen.getAllByText(/ends in 01:00/i)).toHaveLength(2);
  });

  it('should use the current time if no start time is passed', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:01:00Z'));

    render(<TimeDistance fallbackDuration={2} />);

    expect(screen.getAllByText(/ends in 02:00/i)).toHaveLength(2);
  });

  it('should use endTime if existing', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:01:00Z'));

    render(
      <TimeDistance
        endTime="2020-01-01T00:03:00Z"
        fallbackDuration={5}
        startTime="2020-01-01T00:00:00Z"
      />
    );

    expect(screen.getAllByText(/ends in 02:00/i)).toHaveLength(2);
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <TimeDistance
        endTime="2020-01-01T00:01:00Z"
        fallbackDuration={2}
        startTime="2020-01-01T00:00:00Z"
      />
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it('should count down with duration', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00Z'));

    const { container } = render(
      <TimeDistance
        endTime="2020-01-01T00:02:00Z"
        startTime="2020-01-01T00:00:00Z"
      />
    );

    expect(screen.getAllByText(/ends in 02:00/i)).toHaveLength(2);

    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(screen.getAllByText(/ends in 01:30/i)).toHaveLength(2);

    act(() => {
      jest.advanceTimersByTime(66000);
    });

    expect(screen.getAllByText(/ends in 24/i)).toHaveLength(2);

    act(() => {
      jest.advanceTimersByTime(24000);
    });

    expect(container).toBeEmptyDOMElement();
  });

  it('should show duration without counting down', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:01:00Z'));

    render(<TimeDistance fallbackDuration={1} />);

    expect(screen.getAllByText(/ends in 01:00/i)).toHaveLength(2);

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(screen.getAllByText(/ends in 01:00/i)).toHaveLength(2);
  });
});
