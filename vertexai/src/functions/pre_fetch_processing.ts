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
  GenerationConfig,
  RetrievalTool,
  SafetySetting,
  Tool,
} from '../types/content';
import {ClientError} from '../types/errors';
import * as constants from '../util/constants';

export function formatContentRequest(
  request: GenerateContentRequest | string,
  generationConfig?: GenerationConfig,
  safetySettings?: SafetySetting[]
): GenerateContentRequest {
  if (typeof request === 'string') {
    return {
      contents: [{role: constants.USER_ROLE, parts: [{text: request}]}],
      generationConfig: generationConfig,
      safetySettings: safetySettings,
    };
  } else {
    return request;
  }
}

export function validateGenerateContentRequest(
  request: GenerateContentRequest
) {
  if (hasVertexAISearch(request) && hasVertexRagStore(request)) {
    throw new ClientError(
      'Found both vertexAiSearch and vertexRagStore field are set in tool. Either set vertexAiSearch or vertexRagStore.'
    );
  }
}

export function validateGenerationConfig(
  generationConfig: GenerationConfig
): GenerationConfig {
  if ('topK' in generationConfig) {
    if (!(generationConfig.topK! > 0) || !(generationConfig.topK! <= 40)) {
      delete generationConfig.topK;
    }
  }
  return generationConfig;
}

export function getApiVersion(
  request: GenerateContentRequest
): 'v1' | 'v1beta1' {
  return hasVertexRagStore(request) || hasCachedContent(request)
    ? 'v1beta1'
    : 'v1';
}

export function hasVertexRagStore(request: GenerateContentRequest): boolean {
  for (const tool of request?.tools ?? []) {
    const retrieval = (tool as RetrievalTool).retrieval;
    if (!retrieval) continue;
    if (retrieval.vertexRagStore) {
      return true;
    }
  }
  return false;
}

function hasCachedContent(request: GenerateContentRequest): boolean {
  return !!request.cachedContent;
}

export function hasVertexAISearch(request: GenerateContentRequest): boolean {
  for (const tool of request?.tools ?? []) {
    const retrieval = (tool as RetrievalTool).retrieval;
    if (!retrieval) continue;
    if (retrieval.vertexAiSearch) {
      return true;
    }
  }
  return false;
}
