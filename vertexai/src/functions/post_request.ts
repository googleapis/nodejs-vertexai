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

const API_BASE_PATH = 'aiplatform.googleapis.com';
const GOOGLE_INTERNAL_ENDPOINT = 'googleapis.com';

const AUTHORIZATION_HEADER = 'Authorization';
const CONTENT_TYPE_HEADER = 'Content-Type';
const USER_AGENT_HEADER = 'User-Agent';
const X_GOOG_API_CLIENT_HEADER = 'X-Goog-Api-Client';
const SERVER_RESERVED_HEADERS = [AUTHORIZATION_HEADER, CONTENT_TYPE_HEADER];

import {
  GenerateContentRequest,
  CountTokensRequest,
  RequestOptions,
} from '../types/content';
import {ClientError} from '../types/errors';
import * as constants from '../util/constants';

/**
 * Makes a POST request to a Vertex service
 * @ignore
 */
export async function postRequest({
  region,
  resourcePath,
  resourceMethod,
  token,
  data,
  apiEndpoint,
  requestOptions,
  apiVersion = 'v1',
}: {
  region: string;
  resourcePath: string;
  resourceMethod: string;
  token: string | null | undefined;
  data: GenerateContentRequest | CountTokensRequest;
  apiEndpoint?: string;
  requestOptions?: RequestOptions;
  apiVersion?: string;
}): Promise<Response | undefined> {
  const vertexBaseEndpoint = apiEndpoint ?? `${region}-${API_BASE_PATH}`;

  let vertexEndpoint = `https://${vertexBaseEndpoint}/${apiVersion}/${resourcePath}:${resourceMethod}`;

  // Use server sent events for streamGenerateContent
  if (resourceMethod === constants.STREAMING_GENERATE_CONTENT_METHOD) {
    vertexEndpoint += '?alt=sse';
  }
  const necessaryHeaders = new Headers({
    [AUTHORIZATION_HEADER]: `Bearer ${token}`,
    [CONTENT_TYPE_HEADER]: 'application/json',
    [USER_AGENT_HEADER]: constants.USER_AGENT,
  });
  const totalHeaders: Headers = getExtraHeaders(
    vertexBaseEndpoint,
    necessaryHeaders,
    requestOptions
  );
  return fetch(vertexEndpoint, {
    ...getFetchOptions(requestOptions),
    method: 'POST',
    headers: totalHeaders,
    body: JSON.stringify(data),
  });
}

function getFetchOptions(requestOptions?: RequestOptions): RequestInit {
  const fetchOptions = {} as RequestInit;
  if (
    !requestOptions ||
    requestOptions.timeout === undefined ||
    requestOptions.timeout < 0
  ) {
    return fetchOptions;
  }
  const abortController = new AbortController();
  const signal = abortController.signal;
  setTimeout(() => abortController.abort(), requestOptions.timeout);
  fetchOptions.signal = signal;
  return fetchOptions;
}

function stringHasLineBreak(header?: string | null): boolean {
  if (header === null || header === undefined) {
    return false;
  }
  return header.includes('\n') || header.includes('\r');
}
function headersHasLineBreak(customHeaders?: Headers): boolean {
  if (!customHeaders) {
    return false;
  }
  for (const [key, value] of customHeaders.entries()) {
    if (stringHasLineBreak(key) || stringHasLineBreak(value)) {
      return true;
    }
  }
  return false;
}

function getExtraHeaders(
  vertexBaseEndpoint: string,
  necessaryHeaders: Headers,
  requestOptions?: RequestOptions
): Headers {
  if (stringHasLineBreak(requestOptions?.apiClient)) {
    throw new ClientError(
      'Found line break in apiClient request option field, please remove ' +
        'the line break and try again.'
    );
  }
  if (headersHasLineBreak(requestOptions?.customHeaders)) {
    throw new ClientError(
      'Found line break in customerHeaders request option field, please remove ' +
        'the line break and try again.'
    );
  }
  const totalHeaders: Headers = new Headers(necessaryHeaders);
  const customHeaders = requestOptions?.customHeaders ?? new Headers();
  for (const [key, val] of customHeaders.entries()) {
    totalHeaders.append(key, val);
  }
  if (requestOptions?.apiClient) {
    totalHeaders.append(X_GOOG_API_CLIENT_HEADER, requestOptions?.apiClient);
  }

  // Resolve header conflicts.
  let goldenHeaders: Headers;
  if (vertexBaseEndpoint.endsWith(GOOGLE_INTERNAL_ENDPOINT)) {
    goldenHeaders = necessaryHeaders;
  } else {
    goldenHeaders = customHeaders;
  }
  for (const header of SERVER_RESERVED_HEADERS) {
    if (goldenHeaders.has(header)) {
      totalHeaders.set(header, goldenHeaders.get(header)!);
    }
  }
  return totalHeaders;
}
