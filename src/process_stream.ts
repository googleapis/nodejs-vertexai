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

import {CitationSource, GenerateContentCandidate, GenerateContentResponse, GenerateContentResult, StreamGenerateContentResult,} from './types/content';

// eslint-disable-next-line no-useless-escape
const responseLineRE = /^data\: (.*)\r\n/;

// TODO: set a better type for `reader`. Setting it to
// `ReadableStreamDefaultReader` results in an error (diagnostic code 2304)
async function* generateResponseSequence(
  reader2: any
): AsyncGenerator<GenerateContentResponse> {
  while (true) {
    const {value, done} = await reader2.read();
    if (done) {
      break;
    }
    yield value;
  }
}

/**
 * Reads a raw stream from the fetch response and joins incomplete
 * chunks, returning a new stream that provides a single complete
 * GenerateContentResponse in each iteration.
 */
function readFromReader(
  reader: ReadableStreamDefaultReader
): ReadableStream<GenerateContentResponse> {
  let currentText = '';
  const stream = new ReadableStream<GenerateContentResponse>({
    start(controller) {
      return pump();
      function pump(): Promise<(() => Promise<void>) | undefined> {
        let streamReader;
        try {
          streamReader = reader.read().then(({value, done}) => {
            if (done) {
              controller.close();
              return;
            }
            const chunk = new TextDecoder().decode(value);
            currentText += chunk;
            const match = currentText.match(responseLineRE);
            if (match) {
              let parsedResponse: GenerateContentResponse;
              try {
                parsedResponse = JSON.parse(
                  match[1]
                ) as GenerateContentResponse;
              } catch (e) {
                throw new Error(`Error parsing JSON response: "${match[1]}"`);
              }
              currentText = '';
              if ('candidates' in parsedResponse) {
                controller.enqueue(parsedResponse);
              } else {
                console.warn(
                  `No candidates in this response: ${parsedResponse}`
                );
                controller.enqueue({
                  candidates: [],
                });
              }
            }
            return pump();
          });
        } catch (e) {
          throw new Error(`Error reading from stream ${e}.`);
        }
        return streamReader;
      }
    },
  });
  return stream;
}

/**
 * Aggregates an array of `GenerateContentResponse`s into a single
 * GenerateContentResponse.
 */
function aggregateResponses(
  responses: GenerateContentResponse[]
): GenerateContentResponse {
  const lastResponse = responses[responses.length - 1];

  if (lastResponse === undefined) {
    throw new Error(
      'Error processing stream because the response is undefined'
    );
  }

  const aggregatedResponse: GenerateContentResponse = {
    candidates: [],
    promptFeedback: lastResponse.promptFeedback,
  };
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
        if (!aggregatedResponse.candidates[i]
                 .citationMetadata?.citationSources) {
          aggregatedResponse.candidates[i].citationMetadata = {
            citationSources: [] as CitationSource[],
          };
        }


        let existingMetadata = response.candidates[i].citationMetadata ?? {};

        if (aggregatedResponse.candidates[i].citationMetadata) {
          aggregatedResponse.candidates[i].citationMetadata!.citationSources =
              aggregatedResponse.candidates[i]
                  .citationMetadata!.citationSources.concat(existingMetadata);
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

// TODO: improve error handling throughout stream processing
/**
 * Processes model responses from streamGenerateContent
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
  const reader = response.body.getReader();
  const responseStream = readFromReader(reader);
  const [stream1, stream2] = responseStream.tee();
  const reader1 = stream1.getReader();
  const reader2 = stream2.getReader();
  const allResponses: GenerateContentResponse[] = [];
  const responsePromise = new Promise<GenerateContentResponse>(
    // eslint-disable-next-line no-async-promise-executor
    async resolve => {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const {value, done} = await reader1.read();
        if (done) {
          resolve(aggregateResponses(allResponses));
          return;
        }
        allResponses.push(value);
      }
    }
  );
  return {
    response: responsePromise,
    stream: generateResponseSequence(reader2),
  };
}

/**
 * Process model responses from generateContent
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
