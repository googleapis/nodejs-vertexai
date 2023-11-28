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

import {GenerateContentResponse, GenerateContentResult} from './types/content';

const NON_STREAMING_WARNING_STREAM = 'Warning: the `stream` iterable' +
    ' is not available if stream=false';
const responseLineRE = /^data\: (.*)\r\n/;

function isGenerateContentResponse(resp: any): resp is GenerateContentResponse {
  return 'candidates' in resp;
}

// TODO: set a better type for `reader`. Setting it to
// `ReadableStreamDefaultReader` results in an error (diagnostic code 2304)
async function*
    generateResponseSequence(
        reader: any, currentText: string,
        allResponses: GenerateContentResponse[]):
        AsyncGenerator<GenerateContentResponse> {
  while (true) {
    const {value, done} = await reader.read();
    if (done) {
      return;
    }
    const chunk = Buffer.from(value).toString();
    currentText += chunk;
    const match = currentText.match(responseLineRE);
    if (match) {
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(match[1]);

      } catch (e) {
        throw new Error(`Error parsing JSON response: "${match[1]}"`);
      }
      if (isGenerateContentResponse(parsedResponse)) {
        allResponses.push(parsedResponse);
        currentText = '';
        yield parsedResponse;
      }
    }
  }
}

/**
 * Returns an empty generator when stream=false is passed to generateContent
 */
export async function*
    emptyGenerator(): AsyncGenerator<GenerateContentResponse> {
  console.warn(NON_STREAMING_WARNING_STREAM);
  yield {
    candidates: [],
  };
}

/**
 * Processes model responses from streamGenerateContent when stream=true
 */
export function processStream(
    response: Response|undefined,
    ): GenerateContentResult {
  if (response !== undefined && response.body) {
    const reader = response.body.getReader();
    let currentText = '';
    const allResponses: GenerateContentResponse[] = [];
    return {
      stream: generateResponseSequence(reader, currentText, allResponses),
      responses: allResponses,
    };
  }
  return {responses: [], stream: emptyGenerator()};
}

/**
 * Process model responses from generateContent when stream=false | undefined
 */
export function processNonStream(response: any): GenerateContentResult {

  if (response !== undefined) {
    // ts-ignore
    const responseJson = response.json();
    return {
      responses: [responseJson],
      stream: emptyGenerator()
    };
  }
  
  return {
    responses: [],
    stream: emptyGenerator(),
  };
}