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

const API_BASE_PATH = 'aiplatform.googleapis.com';

import {
  GenerateContentRequest,
  CLIENT_INFO,
  CountTokensRequest,
} from '../types/content';
import * as constants from './constants';

/**
 * Makes a POST request to a Vertex service
 */
export async function postRequest({
  region,
  project,
  resourcePath,
  resourceMethod,
  token,
  data,
  apiEndpoint,
  apiVersion = 'v1',
}: {
  region: string; project: string; resourcePath: string; resourceMethod: string;
  token: string;
  data: GenerateContentRequest | CountTokensRequest;
  apiEndpoint?: string;
  apiVersion?: string;
}): Promise<Response|undefined> {
  const vertexBaseEndpoint = apiEndpoint ?? `${region}-${API_BASE_PATH}`;

  let vertexEndpoint = `https://${vertexBaseEndpoint}/${apiVersion}/projects/${project}/locations/${region}/${resourcePath}:${resourceMethod}`;

  // Use server sent events for streamGenerateContent
  if (resourceMethod === constants.STREAMING_GENERATE_CONTENT_METHOD) {
    vertexEndpoint += '?alt=sse';
  }

  return await fetch(vertexEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': CLIENT_INFO.user_agent,
      'client_library_language': CLIENT_INFO.client_library_language,
      'client_library_version': CLIENT_INFO.client_library_version,
    },
    body: JSON.stringify(data),
  });
}
