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

import {countTokens} from '../count_tokens';
import {CountTokensRequest} from '../../types';
import {constants} from '../../util';

const TEST_PROJECT = 'test-project';
const TEST_LOCATION = 'test-location';
const TEST_PUBLISHER_MODEL_ENDPOINT = 'test-publisher-model-endpoint';
const TEST_TOKEN_PROMISE = Promise.resolve('test-token');
const TEST_API_ENDPOINT = 'test-api-endpoint';
const TEST_CHAT_MESSSAGE_TEXT = 'How are you doing today?';
const TEST_USER_CHAT_MESSAGE = [
  {role: constants.USER_ROLE, parts: [{text: TEST_CHAT_MESSSAGE_TEXT}]},
];
describe('countTokens', () => {
  const req: CountTokensRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };

  it('return expected response when OK', async () => {
    const fetchResponseObj = {
      status: 200,
      statusText: 'OK',
      ok: true,
      headers: {'Content-Type': 'application/json'},
      url: 'url',
    };
    const expectedResponseBody = {
      totalTokens: 1,
    };
    const response = new Response(
      JSON.stringify(expectedResponseBody),
      fetchResponseObj
    );
    spyOn(global, 'fetch').and.resolveTo(response);

    const resp = await countTokens(
      TEST_LOCATION,
      TEST_PROJECT,
      TEST_PUBLISHER_MODEL_ENDPOINT,
      TEST_TOKEN_PROMISE,
      TEST_API_ENDPOINT,
      req
    );

    expect(resp).toEqual(expectedResponseBody);
  });

  it('throw GoogleGenerativeError when not OK and not 4XX', async () => {
    const fetch500Obj = {
      status: 500,
      statusText: 'Internal Server Error',
      ok: false,
    };
    const body = {};
    const response = new Response(JSON.stringify(body), fetch500Obj);
    const expectedErrorMessage =
      '[VertexAI.GoogleGenerativeAIError]: got status: 500 Internal Server Error';
    spyOn(global, 'fetch').and.resolveTo(response);

    await expectAsync(
      countTokens(
        TEST_LOCATION,
        TEST_PROJECT,
        TEST_PUBLISHER_MODEL_ENDPOINT,
        TEST_TOKEN_PROMISE,
        TEST_API_ENDPOINT,
        req
      )
    ).toBeRejected();
    await countTokens(
      TEST_LOCATION,
      TEST_PROJECT,
      TEST_PUBLISHER_MODEL_ENDPOINT,
      TEST_TOKEN_PROMISE,
      TEST_API_ENDPOINT,
      req
    ).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });

  it('throw ClientError when not OK and 4XX', async () => {
    const fetch400Obj = {
      status: 400,
      statusText: 'Bad Request',
      ok: false,
    };
    const body = {};
    const response = new Response(JSON.stringify(body), fetch400Obj);
    const expectedErrorMessage =
      '[VertexAI.ClientError]: got status: 400 Bad Request';
    spyOn(global, 'fetch').and.resolveTo(response);

    await expectAsync(
      countTokens(
        TEST_LOCATION,
        TEST_PROJECT,
        TEST_PUBLISHER_MODEL_ENDPOINT,
        TEST_TOKEN_PROMISE,
        TEST_API_ENDPOINT,
        req
      )
    ).toBeRejected();
    await countTokens(
      TEST_LOCATION,
      TEST_PROJECT,
      TEST_PUBLISHER_MODEL_ENDPOINT,
      TEST_TOKEN_PROMISE,
      TEST_API_ENDPOINT,
      req
    ).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });
});
