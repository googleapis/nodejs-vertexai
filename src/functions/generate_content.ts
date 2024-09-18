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
  GenerateContentRequest,
  GenerateContentResult,
  GenerationConfig,
  RequestOptions,
  SafetySetting,
  StreamGenerateContentResult,
  Tool,
} from '../types/content';
import {GoogleGenerativeAIError} from '../types/errors';
import {ToolConfig} from '../types/tool';
import * as constants from '../util/constants';

import {
  processUnary,
  processStream,
  throwErrorIfNotOK,
} from './post_fetch_processing';
import {postRequest} from './post_request';
import {
  formatContentRequest,
  validateGenerateContentRequest,
  validateGenerationConfig,
  hasVertexRagStore,
  getApiVersion,
} from './pre_fetch_processing';

/**
 * Make a async call to generate content.
 * @param request A GenerateContentRequest object with the request contents.
 * @returns The GenerateContentResponse object with the response candidates.
 */
export async function generateContent(
  location: string,
  resourcePath: string,
  token: Promise<string | null | undefined>,
  request: GenerateContentRequest | string,
  apiEndpoint?: string,
  generationConfig?: GenerationConfig,
  safetySettings?: SafetySetting[],
  tools?: Tool[],
  toolConfig?: ToolConfig,
  requestOptions?: RequestOptions
): Promise<GenerateContentResult> {
  request = formatContentRequest(request, generationConfig, safetySettings);

  validateGenerateContentRequest(request);

  if (request.generationConfig) {
    request.generationConfig = validateGenerationConfig(
      request.generationConfig
    );
  }

  const generateContentRequest: GenerateContentRequest = {
    contents: request.contents,
    systemInstruction: request.systemInstruction,
    cachedContent: request.cachedContent,
    generationConfig: request.generationConfig ?? generationConfig,
    safetySettings: request.safetySettings ?? safetySettings,
    tools: request.tools ?? tools,
    toolConfig: request.toolConfig ?? toolConfig,
  };
  const response: Response | undefined = await postRequest({
    region: location,
    resourcePath,
    resourceMethod: constants.GENERATE_CONTENT_METHOD,
    token: await token,
    data: generateContentRequest,
    apiEndpoint,
    requestOptions,
    apiVersion: getApiVersion(request),
  }).catch(e => {
    throw new GoogleGenerativeAIError('exception posting request to model', e);
  });
  await throwErrorIfNotOK(response).catch(e => {
    throw e;
  });
  return processUnary(response);
}

/**
 * Make an async stream request to generate content. The response will be
 * returned in stream.
 * @param {GenerateContentRequest} request - {@link GenerateContentRequest}
 * @returns {Promise<StreamGenerateContentResult>} Promise of {@link
 *     StreamGenerateContentResult}
 */
export async function generateContentStream(
  location: string,
  resourcePath: string,
  token: Promise<string | null | undefined>,
  request: GenerateContentRequest | string,
  apiEndpoint?: string,
  generationConfig?: GenerationConfig,
  safetySettings?: SafetySetting[],
  tools?: Tool[],
  toolConfig?: ToolConfig,
  requestOptions?: RequestOptions
): Promise<StreamGenerateContentResult> {
  request = formatContentRequest(request, generationConfig, safetySettings);
  validateGenerateContentRequest(request);

  if (request.generationConfig) {
    request.generationConfig = validateGenerationConfig(
      request.generationConfig
    );
  }

  const generateContentRequest: GenerateContentRequest = {
    contents: request.contents,
    systemInstruction: request.systemInstruction,
    cachedContent: request.cachedContent,
    generationConfig: request.generationConfig ?? generationConfig,
    safetySettings: request.safetySettings ?? safetySettings,
    tools: request.tools ?? tools,
    toolConfig: request.toolConfig ?? toolConfig,
  };
  const response = await postRequest({
    region: location,
    resourcePath,
    resourceMethod: constants.STREAMING_GENERATE_CONTENT_METHOD,
    token: await token,
    data: generateContentRequest,
    apiEndpoint,
    requestOptions,
    apiVersion: getApiVersion(request),
  }).catch(e => {
    throw new GoogleGenerativeAIError('exception posting request', e);
  });
  await throwErrorIfNotOK(response).catch(e => {
    throw e;
  });
  return processStream(response);
}
