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
  Content,
  GenerateContentRequest,
  GenerationConfig,
  SafetySetting,
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
  validateGcsInput(request.contents);
  validateFunctionResponseRequest(request.contents);
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

function validateGcsInput(contents: Content[]) {
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

function validateFunctionResponseRequest(contents: Content[]) {
  const lastestContentPart = contents[contents.length - 1].parts[0];
  if (!('functionResponse' in lastestContentPart)) {
    return;
  }
  const errorMessage =
    'Please ensure that function response turn comes immediately after a function call turn.';
  if (contents.length < 2) {
    throw new ClientError(errorMessage);
  }
  const secondLastestContentPart = contents[contents.length - 2].parts[0];
  if (!('functionCall' in secondLastestContentPart)) {
    throw new ClientError(errorMessage);
  }
}
