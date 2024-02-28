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
  CountTokensRequest,
  CountTokensResponse,
  RequestOptions,
} from '../types/content';
import {GoogleGenerativeAIError} from '../types/errors';
import {
  throwErrorIfNotOK,
  processCountTokenResponse,
} from './post_fetch_processing';
import {postRequest} from './post_request';

/**
 * Make a async request to count tokens.
 * @param request A CountTokensRequest object with the request contents.
 * @returns The CountTokensResponse object with the token count.
 */
export async function countTokens(
  location: string,
  project: string,
  publisherModelEndpoint: string,
  token: Promise<any>,
  request: CountTokensRequest,
  apiEndpoint?: string,
  requestOptions?: RequestOptions
): Promise<CountTokensResponse> {
  const response = await postRequest({
    region: location,
    project: project,
    resourcePath: publisherModelEndpoint,
    resourceMethod: 'countTokens',
    token: await token,
    data: request,
    apiEndpoint: apiEndpoint,
    requestOptions: requestOptions,
  }).catch(e => {
    throw new GoogleGenerativeAIError('exception posting request', e);
  });
  await throwErrorIfNotOK(response).catch(e => {
    throw e;
  });
  return processCountTokenResponse(response);
}
