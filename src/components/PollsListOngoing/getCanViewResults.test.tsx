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

import { IPoll, PollType, ResultType } from '../../model';
import { getCanViewResults } from './getCanViewResults';

describe('getCanViewResults', () => {
  it.each`
    resultType              | pollType           | canCreatePoll | expectedResult
    ${ResultType.Visible}   | ${PollType.Open}   | ${false}      | ${true}
    ${ResultType.Visible}   | ${PollType.ByName} | ${false}      | ${true}
    ${ResultType.Visible}   | ${PollType.Secret} | ${false}      | ${false}
    ${ResultType.Invisible} | ${PollType.Open}   | ${false}      | ${false}
    ${ResultType.Invisible} | ${PollType.ByName} | ${false}      | ${false}
    ${ResultType.Invisible} | ${PollType.Secret} | ${false}      | ${false}
    ${ResultType.Visible}   | ${PollType.Open}   | ${true}       | ${true}
    ${ResultType.Visible}   | ${PollType.ByName} | ${true}       | ${true}
    ${ResultType.Visible}   | ${PollType.Secret} | ${true}       | ${false}
    ${ResultType.Invisible} | ${PollType.Open}   | ${true}       | ${true}
    ${ResultType.Invisible} | ${PollType.ByName} | ${true}       | ${true}
    ${ResultType.Invisible} | ${PollType.Secret} | ${true}       | ${false}
  `(
    'should Return: $expectedResult if ResultType: $resultType, PollType: $pollType, user canCreatePoll: $canCreatePoll',
    ({ resultType, pollType, canCreatePoll, expectedResult }) => {
      const poll = { resultType, pollType } as Partial<IPoll>;

      expect(
        getCanViewResults({
          poll: poll as IPoll,
          canCreatePoll,
        })
      ).toEqual(expectedResult);
    }
  );
});
