/**
 * @license
 * Copyright 2024 Google LLC
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
  AGGREGATED_RESPONSE_STREAM_RESPONSE_CHUNKS_3,
  AGGREGATED_RESPONSE_STREAM_RESPONSE_CHUNKS_4,
  COUNT_TOKENS_RESPONSE_1,
  STREAM_RESPONSE_CHUNKS_1,
  STREAM_RESPONSE_CHUNKS_2,
  STREAM_RESPONSE_CHUNKS_3,
  STREAM_RESPONSE_CHUNKS_4,
  UNARY_RESPONSE_1,
  UNARY_RESPONSE_MISSING_ROLE_INDEX,
} from './test_data';
import * as PostFetchFunctions from '../post_fetch_processing';
import {aggregateResponses} from '../post_fetch_processing';
import {generateContent, generateContentStream} from '../generate_content';
import {countTokens} from '../count_tokens';

const fetchResponseObj = {
  status: 200,
  statusText: 'OK',
  ok: true,
  headers: {'Content-Type': 'application/json'},
  url: 'url',
};

const LOCATION = 'location';
const RESOURCE_PATH = 'RESOURCE_PATH';
const TOKEN = Promise.resolve('token');
const GENERATE_CONTENT_REQUEST = 'generate_content_request';
const COUNT_TOKEN_REQUEST = {
  contents: [{role: 'user', parts: [{text: 'text'}]}],
};
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

  it('missing candidates, should return {}', () => {
    expect(aggregateResponses([{}, {}])).toEqual({});
  });

  it('missing role and index, should add role and index', () => {
    const actualResult = aggregateResponses(STREAM_RESPONSE_CHUNKS_3);

    expect(JSON.stringify(actualResult)).toEqual(
      JSON.stringify(AGGREGATED_RESPONSE_STREAM_RESPONSE_CHUNKS_3)
    );
  });

  it('missing content, should add role and return empty content', () => {
    const actualResult = aggregateResponses(STREAM_RESPONSE_CHUNKS_4);

    expect(JSON.stringify(actualResult)).toEqual(
      JSON.stringify(AGGREGATED_RESPONSE_STREAM_RESPONSE_CHUNKS_4)
    );
  });
});

describe('processUnary', () => {
  it('grounding metadata in multiple candidates, processUnary should return faithful response', async () => {
    const fetchResult = new Response(
      JSON.stringify(UNARY_RESPONSE_1),
      fetchResponseObj
    );
    spyOn(global, 'fetch').and.resolveTo(fetchResult);
    const actualResult = await generateContent(
      LOCATION,
      RESOURCE_PATH,
      TOKEN,
      GENERATE_CONTENT_REQUEST
    );
    const actualResponse = actualResult.response;

    expect(actualResponse).toEqual(UNARY_RESPONSE_1);
  });

  it('response missing role and index, should add role and index', async () => {
    const fetchResult = new Response(
      JSON.stringify(UNARY_RESPONSE_MISSING_ROLE_INDEX),
      fetchResponseObj
    );
    const expectedResult = UNARY_RESPONSE_1;
    spyOn(global, 'fetch').and.resolveTo(fetchResult);
    const actualResult = await generateContent(
      LOCATION,
      RESOURCE_PATH,
      TOKEN,
      GENERATE_CONTENT_REQUEST
    );
    const actualResponse = actualResult.response;

    expect(actualResponse).toEqual(expectedResult);
  });

  it('candidate undefined, should return empty response', async () => {
    spyOn(global, 'fetch').and.resolveTo(
      new Response(JSON.stringify({}), fetchResponseObj)
    );
    const actualResult = await generateContent(
      LOCATION,
      RESOURCE_PATH,
      TOKEN,
      GENERATE_CONTENT_REQUEST
    );
    const actualResponse = actualResult.response;

    expect(actualResponse).toEqual({});
  });
});

describe('processStream', () => {
  it('grounding metadata in multiple chunks for multiple candidates, processStream should return faithful response', async () => {
    const fetchResult = new Response(
      JSON.stringify(STREAM_RESPONSE_CHUNKS_1),
      fetchResponseObj
    );
    spyOn(global, 'fetch').and.resolveTo(fetchResult);
    const processStreamSpy = spyOn(PostFetchFunctions, 'processStream');
    await generateContentStream(
      LOCATION,
      RESOURCE_PATH,
      TOKEN,
      GENERATE_CONTENT_REQUEST
    );
    const actualArg = processStreamSpy.calls.allArgs()[0][0];

    expect(actualArg).toBeDefined();
    const actualResponseToProcessStream = await actualArg!.json();
    expect(actualResponseToProcessStream).toEqual(STREAM_RESPONSE_CHUNKS_1);
  });
});

describe('processCountTokenResponse', () => {
  it('multiple contents, processCountTokenResponse should return faithful response', async () => {
    const fetchResult = new Response(
      JSON.stringify(COUNT_TOKENS_RESPONSE_1),
      fetchResponseObj
    );
    spyOn(global, 'fetch').and.resolveTo(fetchResult);
    const actualResponse = await countTokens(
      LOCATION,
      RESOURCE_PATH,
      TOKEN,
      COUNT_TOKEN_REQUEST
    );

    expect(actualResponse).toEqual(COUNT_TOKENS_RESPONSE_1);
  });
});
