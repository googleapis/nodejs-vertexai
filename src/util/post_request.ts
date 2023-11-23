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

// TODO: update to prod endpoint when ready
const API_BASE_PATH = 'autopush-aiplatform.sandbox.googleapis.com';

import {
    GenerateContentRequest, CLIENT_INFO,
} from '../types/content';

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
  // TODO: update to prod version when ready
  apiVersion = 'internal',
}: {
  region: string,
  project: string,
  resourcePath: string,
  resourceMethod: string,
  token: string,
  data: GenerateContentRequest,
  apiEndpoint?: string,
  apiVersion?: string,
}): Promise<Response|undefined> {
  const vertexBaseEndpoint = apiEndpoint ?? `${region}-${API_BASE_PATH}`;

  const vertexEndpoint = `https://${vertexBaseEndpoint}/${
      apiVersion}/projects/${project}/locations/${region}/${resourcePath}:${
      resourceMethod}`;

  return await fetch(vertexEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'user_agent': CLIENT_INFO.user_agent,
      'client_library_language': CLIENT_INFO.client_library_language,
      'client_library_version': CLIENT_INFO.client_library_version,
    },
    body: JSON.stringify(data),
  });
}
