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
  Citation,
  CitationMetadata,
  CountTokensResponse,
  GenerateContentCandidate,
  GenerateContentResponse,
  GenerateContentResult,
  GroundingMetadata,
  Part,
  StreamGenerateContentResult,
} from '../types/content';
import {ClientError, GoogleGenerativeAIError} from '../types/errors';

export async function throwErrorIfNotOK(response: Response | undefined) {
  if (response === undefined) {
    throw new GoogleGenerativeAIError('response is undefined');
  }
  if (!response.ok) {
    const status: number = response.status;
    const statusText: string = response.statusText;
    const errorBody = await response.json();
    const errorMessage = `got status: ${status} ${statusText}. ${JSON.stringify(
      errorBody
    )}`;
    if (status >= 400 && status < 500) {
      throw new ClientError(errorMessage);
    }
    throw new GoogleGenerativeAIError(errorMessage);
  }
}

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
    yield addCandidateFunctionCalls(value);
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
export async function processStream(
  response: Response | undefined
): Promise<StreamGenerateContentResult> {
  if (response === undefined) {
    throw new GoogleGenerativeAIError(
      'Error processing stream because response === undefined'
    );
  }
  if (!response.body) {
    throw new GoogleGenerativeAIError(
      'Error processing stream because response.body not found'
    );
  }
  const inputStream = response.body!.pipeThrough(
    new TextDecoderStream('utf8', {fatal: true})
  );
  const responseStream = getResponseStream(
    inputStream
  ) as ReadableStream<GenerateContentResponse>;
  const [stream1, stream2] = responseStream.tee();
  return Promise.resolve({
    stream: generateResponseSequence(stream1),
    response: getResponsePromise(stream2),
  });
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
function getResponseStream(
  inputStream: ReadableStream<string>
): ReadableStream<unknown> {
  const reader = inputStream.getReader();
  const stream = new ReadableStream<unknown>({
    start(controller) {
      let currentText = '';
      return pump();
      function pump(): Promise<(() => Promise<void>) | undefined> {
        return reader.read().then(({value, done}) => {
          if (done) {
            if (currentText.trim()) {
              controller.error(
                new GoogleGenerativeAIError(
                  'Failed to parse final chunk of stream'
                )
              );
              return;
            }
            controller.close();
            return;
          }

          currentText += value;
          let match = currentText.match(responseLineRE);
          let parsedResponse: unknown;
          while (match) {
            try {
              parsedResponse = JSON.parse(match[1]);
            } catch (e) {
              controller.error(
                new GoogleGenerativeAIError(
                  `Error parsing JSON response from stream chunk: "${match[1]}"`
                )
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
 * @VisibleForTesting
 */
export function aggregateResponses(
  responses: GenerateContentResponse[]
): GenerateContentResponse {
  const lastResponse = responses[responses.length - 1];

  if (lastResponse === undefined) {
    throw new GoogleGenerativeAIError(
      'Error aggregating stream chunks because the final response in stream chunk is undefined'
    );
  }

  const aggregatedResponse: GenerateContentResponse = {
    candidates: [],
    promptFeedback: lastResponse.promptFeedback,
    usageMetadata: lastResponse.usageMetadata,
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
      const citationMetadataAggregated: CitationMetadata | undefined =
        aggregateCitationMetadataForCandidate(
          response.candidates[i],
          aggregatedResponse.candidates[i]
        );
      if (citationMetadataAggregated) {
        aggregatedResponse.candidates[i].citationMetadata =
          citationMetadataAggregated;
      }
      const finishResonOfChunk = response.candidates[i].finishReason;
      if (finishResonOfChunk) {
        aggregatedResponse.candidates[i].finishReason =
          response.candidates[i].finishReason;
      }
      const finishMessageOfChunk = response.candidates[i].finishMessage;
      if (finishMessageOfChunk) {
        aggregatedResponse.candidates[i].finishMessage = finishMessageOfChunk;
      }
      const safetyRatingsOfChunk = response.candidates[i].safetyRatings;
      if (safetyRatingsOfChunk) {
        aggregatedResponse.candidates[i].safetyRatings = safetyRatingsOfChunk;
      }
      if ('parts' in response.candidates[i].content) {
        for (const part of response.candidates[i].content.parts) {
          if (part.text) {
            aggregatedResponse.candidates[i].content.parts[0].text += part.text;
          }
          if (part.functionCall) {
            aggregatedResponse.candidates[i].content.parts[0].functionCall =
              part.functionCall;
            // the empty 'text' key should be removed if functionCall is in the
            // response
            delete aggregatedResponse.candidates[i].content.parts[0].text;
          }
        }
      }
      const groundingMetadataAggregated: GroundingMetadata | undefined =
        aggregateGroundingMetadataForCandidate(
          response.candidates[i],
          aggregatedResponse.candidates[i]
        );
      if (groundingMetadataAggregated) {
        aggregatedResponse.candidates[i].groundingMetadata =
          groundingMetadataAggregated;
      }
    }
  }
  aggregatedResponse.promptFeedback =
    responses[responses.length - 1].promptFeedback;
  return aggregatedResponse;
}

function aggregateCitationMetadataForCandidate(
  candidateChunk: GenerateContentCandidate,
  aggregatedCandidate: GenerateContentCandidate
): CitationMetadata | undefined {
  if (!candidateChunk.citationMetadata) {
    return;
  }
  const emptyCitationMetadata: CitationMetadata = {
    citations: [],
  };
  const citationMetadataAggregated: CitationMetadata =
    aggregatedCandidate.citationMetadata ?? emptyCitationMetadata;
  const citationMetadataChunk: CitationMetadata =
    candidateChunk.citationMetadata!;
  if (citationMetadataChunk.citations) {
    citationMetadataAggregated.citations =
      citationMetadataAggregated.citations!.concat(
        citationMetadataChunk.citations
      );
  }
  return citationMetadataAggregated;
}

function aggregateGroundingMetadataForCandidate(
  candidateChunk: GenerateContentCandidate,
  aggregatedCandidate: GenerateContentCandidate
): GroundingMetadata | undefined {
  if (!candidateChunk.groundingMetadata) {
    return;
  }
  const emptyGroundingMetadata: GroundingMetadata = {
    webSearchQueries: [],
    groundingAttributions: [],
  };
  const groundingMetadataAggregated: GroundingMetadata =
    aggregatedCandidate.groundingMetadata ?? emptyGroundingMetadata;
  const groundingMetadataChunk: GroundingMetadata =
    candidateChunk.groundingMetadata!;
  if (groundingMetadataChunk.webSearchQueries) {
    groundingMetadataAggregated.webSearchQueries =
      groundingMetadataAggregated.webSearchQueries!.concat(
        groundingMetadataChunk.webSearchQueries
      );
  }
  if (groundingMetadataChunk.groundingAttributions) {
    groundingMetadataAggregated.groundingAttributions =
      groundingMetadataAggregated.groundingAttributions!.concat(
        groundingMetadataChunk.groundingAttributions
      );
  }
  return groundingMetadataAggregated;
}

function addCandidateFunctionCalls(
  response: GenerateContentResponse
): GenerateContentResponse {
  if (!response.candidates) {
    return response;
  }
  for (const candidate of response.candidates) {
    if (
      !candidate.content ||
      !candidate.content.parts ||
      candidate.content.parts.length === 0
    ) {
      continue;
    }
    const functionCalls = candidate.content.parts
      .filter((part: Part) => !!part.functionCall)
      .map((part: Part) => part.functionCall!);
    if (functionCalls.length > 0) {
      candidate.functionCalls = functionCalls;
    }
  }
  return response;
}

/**
 * Process model responses from generateContent
 * @ignore
 */
export async function processUnary(
  response: Response | undefined
): Promise<GenerateContentResult> {
  if (response !== undefined) {
    // ts-ignore
    const responseJson = await response.json();
    return Promise.resolve({
      response: addCandidateFunctionCalls(responseJson),
    });
  }

  return Promise.resolve({
    response: {candidates: []},
  });
}

/**
 * Process model responses from countTokens
 * @ignore
 */
export async function processCountTokenResponse(
  response: Response | undefined
): Promise<CountTokensResponse> {
  if (response) {
    // ts-ignore
    return response.json();
  }

  return Promise.resolve({} as CountTokensResponse);
}
