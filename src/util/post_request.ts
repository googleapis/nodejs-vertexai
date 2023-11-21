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

import {GenerateContentRequest} from '../types/content';
/**
 * Makes a POST request to a Vertex service
 */
export async function postRequest({
  region,
  project,
  apiVersion = 'v1',
  resourcePath,
  resourceMethod,
  token,
  data,
  apiKey,  // TODO: remove when we switch to Vertex endpoint
  apiEndpoint,
}: {
  region: string,
  project: string,
  resourcePath: string,
  resourceMethod: string,
  token: string,
  data: GenerateContentRequest,
  apiVersion?: string,
  apiKey?: string,  // TODO: remove when we switch to Vertex endpoint
  apiEndpoint?: string,
}): Promise<Response|undefined> {
  // TODO: replace Labs endpoint with vertex when service is available
  // TODO: add user-agent to the request header for Vertex endpoint

  const labsEndpoint =
      `https://autopush-generativelanguage.sandbox.googleapis.com/v1beta/models/gemini-pro:${
          resourceMethod}?key=${apiKey}&alt=sse`;

  const vertexBaseEndpoint = apiEndpoint ?? `${region}-${API_BASE_PATH}`;

  const vertexEndpoint = `https://${vertexBaseEndpoint}/${
      apiVersion}/projects/${project}/locations/${region}/${resourcePath}:${
      resourceMethod}&alt=sse`;

  return await fetch(labsEndpoint, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data),
  });
}