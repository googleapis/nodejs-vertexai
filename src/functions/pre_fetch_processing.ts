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
  GenerateContentRequest,
  GenerationConfig,
  SafetySetting,
} from '../types/content';
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
  const contents = request.contents;
  for (const content of contents) {
    for (const part of content.parts) {
      if ('fileData' in part) {
        // @ts-ignore
        const uri = part['fileData']['fileUri'];
        if (!uri.startsWith('gs://')) {
          throw new URIError(
            `Found invalid Google Cloud Storage URI ${uri}, Google Cloud Storage URIs must start with gs://`
          );
        }
      }
    }
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
