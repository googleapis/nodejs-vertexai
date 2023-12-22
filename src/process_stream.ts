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
  CitationSource,
  GenerateContentCandidate,
  GenerateContentResponse,
  GenerateContentResult,
  StreamGenerateContentResult,
} from './types/content';

const responseLineRE = /^data: (.*)(?:\n\n|\r\r|\r\n\r\n)/;

async function* generateResponseSequence(
  stream: ReadableStream<GenerateContentResponse>
): AsyncGenerator<GenerateContentResponse> {
  const reader = stream.getReader();
  while (true) {
    const {value, done} = await reader.read();
    if (done) {
      break;
    }
    yield value;
  }
}

/**
 * Process a response.body stream from the backend and return an
 * iterator that provides one complete GenerateContentResponse at a time
 * and a promise that resolves with a single aggregated
 * GenerateContentResponse.
 *
 * @param response - Response from a fetch call
 * @ignore
 */
export function processStream(
  response: Response | undefined
): StreamGenerateContentResult {
  if (response === undefined) {
    throw new Error('Error processing stream because response === undefined');
  }
  if (!response.body) {
    throw new Error('Error processing stream because response.body not found');
  }
  const inputStream = response.body!.pipeThrough(
    new TextDecoderStream('utf8', {fatal: true})
  );
  const responseStream =
    getResponseStream<GenerateContentResponse>(inputStream);
  const [stream1, stream2] = responseStream.tee();
  return {
    stream: generateResponseSequence(stream1),
    response: getResponsePromise(stream2),
  };
}

async function getResponsePromise(
  stream: ReadableStream<GenerateContentResponse>
): Promise<GenerateContentResponse> {
  const allResponses: GenerateContentResponse[] = [];
  const reader = stream.getReader();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const {done, value} = await reader.read();
    if (done) {
      return aggregateResponses(allResponses);
    }
    allResponses.push(value);
  }
}

/**
 * Reads a raw stream from the fetch response and join incomplete
 * chunks, returning a new stream that provides a single complete
 * GenerateContentResponse in each iteration.
 * @ignore
 */
export function getResponseStream<T>(
  inputStream: ReadableStream<string>
): ReadableStream<T> {
  const reader = inputStream.getReader();
  const stream = new ReadableStream<T>({
    start(controller) {
      let currentText = '';
      return pump();
      function pump(): Promise<(() => Promise<void>) | undefined> {
        return reader.read().then(({value, done}) => {
          if (done) {
            if (currentText.trim()) {
              controller.error(new Error('Failed to parse stream'));
              return;
            }
            controller.close();
            return;
          }

          currentText += value;
          let match = currentText.match(responseLineRE);
          let parsedResponse: T;
          while (match) {
            try {
              parsedResponse = JSON.parse(match[1]) as T;
            } catch (e) {
              controller.error(
                new Error(`Error parsing JSON response: "${match[1]}"`)
              );
              return;
            }
            controller.enqueue(parsedResponse);
            currentText = currentText.substring(match[0].length);
            match = currentText.match(responseLineRE);
          }
          return pump();
        });
      }
    },
  });
  return stream;
}

/**
 * Aggregates an array of `GenerateContentResponse`s into a single
 * GenerateContentResponse.
 * @ignore
 */
function aggregateResponses(
  responses: GenerateContentResponse[]
): GenerateContentResponse {
  const lastResponse = responses[responses.length - 1];

  const aggregatedResponse: GenerateContentResponse = {
    candidates: [],
    promptFeedback: lastResponse && lastResponse.promptFeedback,
  };

  if (responses.length === 0) {
    return aggregatedResponse;
  }

  for (const response of responses) {
    for (let i = 0; i < response.candidates.length; i++) {
      if (!aggregatedResponse.candidates[i]) {
        aggregatedResponse.candidates[i] = {
          index: response.candidates[i].index,
          content: {
            role: response.candidates[i].content.role,
            parts: [{text: ''}],
          },
        } as GenerateContentCandidate;
      }
      if (response.candidates[i].citationMetadata) {
        if (
          !aggregatedResponse.candidates[i].citationMetadata?.citationSources
        ) {
          aggregatedResponse.candidates[i].citationMetadata = {
            citationSources: [] as CitationSource[],
          };
        }

        const existingMetadata = response.candidates[i].citationMetadata ?? {};

        if (aggregatedResponse.candidates[i].citationMetadata) {
          aggregatedResponse.candidates[i].citationMetadata!.citationSources =
            aggregatedResponse.candidates[
              i
            ].citationMetadata!.citationSources.concat(existingMetadata);
        }
      }
      aggregatedResponse.candidates[i].finishReason =
        response.candidates[i].finishReason;
      aggregatedResponse.candidates[i].finishMessage =
        response.candidates[i].finishMessage;
      aggregatedResponse.candidates[i].safetyRatings =
        response.candidates[i].safetyRatings;
      if ('parts' in response.candidates[i].content) {
        for (const part of response.candidates[i].content.parts) {
          if (part.text) {
            aggregatedResponse.candidates[i].content.parts[0].text += part.text;
          }
        }
      }
    }
  }
  aggregatedResponse.promptFeedback =
    responses[responses.length - 1].promptFeedback;
  return aggregatedResponse;
}

/**
 * Process model responses from generateContent
 * @ignore
 */
export function processNonStream(response: any): GenerateContentResult {
  if (response !== undefined) {
    // ts-ignore
    const responseJson = response.json();
    return {
      response: responseJson,
    };
  }

  return {
    response: {candidates: []},
  };
}
