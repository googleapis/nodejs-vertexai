/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  AGGREGATED_RESPONSE_STREAM_RESPONSE_CHUNKS_1,
  AGGREGATED_RESPONSE_STREAM_RESPONSE_CHUNKS_2,
  STREAM_RESPONSE_CHUNKS_1,
  STREAM_RESPONSE_CHUNKS_2,
} from './test_data';
import {aggregateResponses} from '../post_fetch_processing';

describe('aggregateResponses', () => {
  it('grounding metadata in multiple chunks for multiple candidates, should aggregate accordingly', () => {
    const actualResult = aggregateResponses(STREAM_RESPONSE_CHUNKS_1);

    expect(JSON.stringify(actualResult)).toEqual(
      JSON.stringify(AGGREGATED_RESPONSE_STREAM_RESPONSE_CHUNKS_1)
    );
  });

  it('citation metadata in multiple chunks for multiple candidates, should aggregate accordingly', () => {
    const actualResult = aggregateResponses(STREAM_RESPONSE_CHUNKS_2);

    expect(JSON.stringify(actualResult)).toEqual(
      JSON.stringify(AGGREGATED_RESPONSE_STREAM_RESPONSE_CHUNKS_2)
    );
  });
});
