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
  ClientError,
  CountTokensRequest,
  FinishReason,
  FunctionDeclarationSchemaType,
  GenerateContentRequest,
  GenerateContentResponse,
  GenerateContentResponseHandler,
  GenerateContentResult,
  GoogleApiError,
  HarmBlockThreshold,
  HarmCategory,
  HarmProbability,
  RequestOptions,
  SafetyRating,
  SafetySetting,
  StreamGenerateContentResult,
  Tool,
  ToolConfig,
} from '../../types';
import {constants} from '../../util';
import {countTokens} from '../count_tokens';
import {generateContent, generateContentStream} from '../generate_content';
import * as StreamFunctions from '../post_fetch_processing';

const TEST_LOCATION = 'test-location';
const TEST_RESOURCE_PATH = 'test-resource-path';
const TEST_TOKEN = 'testtoken';
const TEST_TOKEN_PROMISE = Promise.resolve(TEST_TOKEN);
const TEST_API_ENDPOINT = 'test-api-endpoint';
const TEST_CHAT_MESSAGE_TEXT = 'How are you doing today?';
const TEST_USER_CHAT_MESSAGE = [
  {role: constants.USER_ROLE, parts: [{text: TEST_CHAT_MESSAGE_TEXT}]},
];

const CONTENTS = [
  {
    role: 'user',
    parts: [{text: 'What is the weater like in Boston?'}],
  },
];

const TEST_USER_CHAT_MESSAGE_WITH_GCS_FILE = [
  {
    role: constants.USER_ROLE,
    parts: [
      {text: TEST_CHAT_MESSAGE_TEXT},
      {
        fileData: {
          fileUri: 'gs://test_bucket/test_image.jpeg',
          mimeType: 'image/jpeg',
        },
      },
    ],
  },
];

const TEST_USER_CHAT_MESSAGE_WITH_INVALID_GCS_FILE = [
  {
    role: constants.USER_ROLE,
    parts: [
      {text: TEST_CHAT_MESSAGE_TEXT},
      {fileData: {fileUri: 'test_image.jpeg', mimeType: 'image/jpeg'}},
    ],
  },
];

const TEST_SAFETY_SETTINGS: SafetySetting[] = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

const TEST_REQUEST_OPTIONS: RequestOptions = {
  timeout: 0,
};
const TEST_SAFETY_RATINGS: SafetyRating[] = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    probability: HarmProbability.NEGLIGIBLE,
  },
];
const TEST_GENERATION_CONFIG = {
  candidateCount: 1,
  stopSequences: ['hello'],
};
const TEST_CANDIDATES = [
  {
    index: 1,
    content: {
      role: constants.MODEL_ROLE,
      parts: [{text: 'Im doing great! How are you?'}],
    },
    finishReason: FinishReason.STOP,
    finishMessage: '',
    safetyRatings: TEST_SAFETY_RATINGS,
    citationMetadata: {
      citations: [
        {
          startIndex: 367,
          endIndex: 491,
          uri: 'https://www.numerade.com/ask/question/why-does-the-uncertainty-principle-make-it-impossible-to-predict-a-trajectory-for-the-clectron-95172/',
        },
      ],
    },
  },
];
const TEST_MODEL_RESPONSE = {
  candidates: TEST_CANDIDATES,
  usageMetadata: {promptTokenCount: 0, candidatesTokenCount: 0},
};
const TEST_CANDIDATE_WITH_INVALID_DATA = [
  {
    index: 1,
    content: {
      role: constants.MODEL_ROLE,
      parts: [],
    },
  },
];
const TEST_MODEL_RESPONSE_WITH_INVALID_DATA = {
  candidates: TEST_CANDIDATE_WITH_INVALID_DATA,
};
const TEST_FUNCTION_CALL_RESPONSE = {
  functionCall: {
    name: 'get_current_weather',
    args: {
      location: 'LA',
      unit: 'fahrenheit',
    },
  },
};

const TEST_CANDIDATES_WITH_FUNCTION_CALL = [
  {
    index: 1,
    content: {
      role: constants.MODEL_ROLE,
      parts: [TEST_FUNCTION_CALL_RESPONSE],
    },
    finishReason: FinishReason.STOP,
    finishMessage: '',
    safetyRatings: TEST_SAFETY_RATINGS,
  },
];
const TEST_MODEL_RESPONSE_WITH_FUNCTION_CALL = {
  candidates: TEST_CANDIDATES_WITH_FUNCTION_CALL,
};

const TEST_ENDPOINT_BASE_PATH = 'test.googleapis.com';
const TEST_GCS_FILENAME = 'gs://test_bucket/test_image.jpeg';

const TEST_MULTIPART_MESSAGE = [
  {
    role: constants.USER_ROLE,
    parts: [
      {text: 'What is in this picture?'},
      {fileData: {fileUri: TEST_GCS_FILENAME, mimeType: 'image/jpeg'}},
    ],
  },
];

const BASE_64_IMAGE =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const INLINE_DATA_FILE_PART = {
  inlineData: {
    data: BASE_64_IMAGE,
    mimeType: 'image/jpeg',
  },
};

const TEST_MULTIPART_MESSAGE_BASE64 = [
  {
    role: constants.USER_ROLE,
    parts: [{text: 'What is in this picture?'}, INLINE_DATA_FILE_PART],
  },
];

const TEST_EMPTY_TOOLS: Tool[] = [];

const TEST_EMPTY_TOOL_CONFIG: ToolConfig = {};

const TEST_TOOLS_WITH_FUNCTION_DECLARATION: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'get_current_weather',
        description: 'get weather in a given location',
        parameters: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            location: {type: FunctionDeclarationSchemaType.STRING},
            unit: {
              type: FunctionDeclarationSchemaType.STRING,
              enum: ['celsius', 'fahrenheit'],
            },
          },
          required: ['location'],
        },
      },
    ],
  },
];

const TEST_TOOLS_WITH_RAG: Tool[] = [
  {
    retrieval: {vertexRagStore: {ragResources: [{ragCorpus: 'ragCorpus'}]}},
  },
];

const fetchResponseObj = {
  status: 200,
  statusText: 'OK',
  ok: true,
  headers: {'Content-Type': 'application/json'},
  url: 'url',
};

/**
 * Returns a generator, used to mock the generateContentStream response
 * @ignore
 */
export async function* testGenerator(): AsyncGenerator<GenerateContentResponse> {
  yield {
    candidates: TEST_CANDIDATES,
  };
}

function buildFetchResponse(body: any): Response {
  return new Response(JSON.stringify(body), fetchResponseObj);
}

describe('countTokens', () => {
  const req: CountTokensRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  let fetchSpy: jasmine.Spy;

  it('return expected response when OK', async () => {
    const expectedResponseBody = {
      totalTokens: 1,
    };
    const response = new Response(
      JSON.stringify(expectedResponseBody),
      fetchResponseObj
    );
    fetchSpy = spyOn(global, 'fetch').and.resolveTo(response);

    const resp = await countTokens(
      TEST_LOCATION,
      TEST_RESOURCE_PATH,
      TEST_TOKEN_PROMISE,
      req,
      TEST_API_ENDPOINT
    );

    expect(resp).toEqual(expectedResponseBody);
  });

  it('request rejected when timeout', async () => {
    fetchSpy = spyOn(global, 'fetch').and.resolveTo({
      ok: false,
      status: 500,
      statusText: 'AbortError',
    } as Response);
    await expectAsync(
      countTokens(
        TEST_LOCATION,
        TEST_RESOURCE_PATH,
        TEST_TOKEN_PROMISE,
        req,
        TEST_API_ENDPOINT,
        TEST_REQUEST_OPTIONS
      )
    ).toBeRejected();
    expect(fetchSpy.calls.allArgs()[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it('throw GoogleGenerativeError when not OK and not 4XX', async () => {
    const fetch500Obj = {
      status: 500,
      statusText: 'Internal Server Error',
      ok: false,
    };
    const body = {
      code: 500,
      message: 'service is having downtime',
      status: 'INTERNAL_SERVER_ERROR',
    };
    const response = new Response(JSON.stringify(body), fetch500Obj);
    spyOn(global, 'fetch').and.resolveTo(response);

    await expectAsync(
      countTokens(
        TEST_LOCATION,
        TEST_RESOURCE_PATH,
        TEST_TOKEN_PROMISE,
        req,
        TEST_API_ENDPOINT
      )
    ).toBeRejected();
  });

  it('throw ClientError when not OK and 4XX', async () => {
    const fetch400Obj = {
      status: 400,
      statusText: 'Bad Request',
      ok: false,
    };
    const body = {
      error: {
        code: 400,
        message: 'request is invalid',
        status: 'INVALID_ARGUMENT',
      },
    };
    const response = new Response(JSON.stringify(body), fetch400Obj);
    spyOn(global, 'fetch').and.resolveTo(response);

    let error: any;
    try {
      await countTokens(
        TEST_LOCATION,
        TEST_RESOURCE_PATH,
        TEST_TOKEN_PROMISE,
        req,
        TEST_API_ENDPOINT
      );
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(ClientError);
    expect(error.cause).toBeInstanceOf(GoogleApiError);
    expect(error.cause.code).toBe(400);
    expect(error.cause.status).toEqual('INVALID_ARGUMENT');
  });
});

describe('generateContent', () => {
  let fetchSpy: jasmine.Spy;

  beforeEach(() => {
    fetchSpy = spyOn(global, 'fetch');
  });

  it('request rejected when timeout', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    fetchSpy.and.resolveTo({
      ok: false,
      status: 500,
      statusText: 'AbortError',
    } as Response);
    await expectAsync(
      generateContent(
        TEST_LOCATION,
        TEST_RESOURCE_PATH,
        TEST_TOKEN_PROMISE,
        req,
        TEST_API_ENDPOINT,
        TEST_GENERATION_CONFIG,
        TEST_SAFETY_SETTINGS,
        TEST_EMPTY_TOOLS,
        TEST_EMPTY_TOOL_CONFIG,
        TEST_REQUEST_OPTIONS
      )
    ).toBeRejected();
    expect(fetchSpy.calls.allArgs()[0][1].signal).toBeInstanceOf(AbortSignal);
  });
  it('returns a GenerateContentResponse', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE,
    };
    fetchSpy.and.resolveTo(buildFetchResponse(TEST_MODEL_RESPONSE));
    const resp = await generateContent(
      TEST_LOCATION,
      TEST_RESOURCE_PATH,
      TEST_TOKEN_PROMISE,
      req,
      TEST_API_ENDPOINT
    );
    expect(resp).toEqual(expectedResult);
  });
  it('returns a GenerateContentResponse when passed a string', async () => {
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE,
    };
    fetchSpy.and.resolveTo(buildFetchResponse(TEST_MODEL_RESPONSE));
    const resp = await generateContent(
      TEST_LOCATION,
      TEST_RESOURCE_PATH,
      TEST_TOKEN_PROMISE,
      TEST_CHAT_MESSAGE_TEXT,
      TEST_API_ENDPOINT
    );
    expect(resp).toEqual(expectedResult);
  });

  it('returns a GenerateContentResponse when passed a GCS URI', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE_WITH_GCS_FILE,
    };
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE,
    };
    fetchSpy.and.resolveTo(buildFetchResponse(TEST_MODEL_RESPONSE));
    const resp = await generateContent(
      TEST_LOCATION,
      TEST_RESOURCE_PATH,
      TEST_TOKEN_PROMISE,
      req,
      TEST_API_ENDPOINT
    );
    expect(resp).toEqual(expectedResult);
  });

  it('raises an error when passed an invalid GCS URI', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE_WITH_INVALID_GCS_FILE,
    };
    await expectAsync(
      generateContent(
        TEST_LOCATION,
        TEST_RESOURCE_PATH,
        TEST_TOKEN_PROMISE,
        req,
        TEST_API_ENDPOINT
      )
    ).toBeRejectedWithError(URIError);
  });

  it('returns a GenerateContentResponse when passed safetySettings and generationConfig', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
      safetySettings: TEST_SAFETY_SETTINGS,
      generationConfig: TEST_GENERATION_CONFIG,
    };
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE,
    };
    fetchSpy.and.resolveTo(buildFetchResponse(TEST_MODEL_RESPONSE));
    const resp = await generateContent(
      TEST_LOCATION,
      TEST_RESOURCE_PATH,
      TEST_TOKEN_PROMISE,
      req,
      TEST_API_ENDPOINT
    );
    expect(resp).toEqual(expectedResult);
  });
  it('updates the base API endpoint when provided', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    fetchSpy.and.resolveTo(buildFetchResponse(TEST_MODEL_RESPONSE));
    await generateContent(
      TEST_LOCATION,
      TEST_RESOURCE_PATH,
      TEST_TOKEN_PROMISE,
      req,
      TEST_ENDPOINT_BASE_PATH
    );
    expect(fetchSpy.calls.allArgs()[0][0].toString()).toContain(
      TEST_ENDPOINT_BASE_PATH
    );
  });

  it('removes topK when it is set to 0', async () => {
    const reqWithEmptyConfigs: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE_WITH_GCS_FILE,
      generationConfig: {topK: 0},
      safetySettings: [],
    };
    fetchSpy.and.resolveTo(buildFetchResponse(TEST_MODEL_RESPONSE));
    await generateContent(
      TEST_LOCATION,
      TEST_RESOURCE_PATH,
      TEST_TOKEN_PROMISE,
      reqWithEmptyConfigs,
      TEST_API_ENDPOINT
    );
    const requestArgs = fetchSpy.calls.allArgs()[0][1];
    if (typeof requestArgs === 'object' && requestArgs) {
      expect(JSON.stringify(requestArgs['body'])).not.toContain('topK');
    }
  });

  it('includes topK when it is within 1 - 40', async () => {
    const reqWithEmptyConfigs: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE_WITH_GCS_FILE,
      generationConfig: {topK: 1},
      safetySettings: [],
    };
    fetchSpy.and.resolveTo(buildFetchResponse(TEST_MODEL_RESPONSE));
    await generateContent(
      TEST_LOCATION,
      TEST_RESOURCE_PATH,
      TEST_TOKEN_PROMISE,
      reqWithEmptyConfigs,
      TEST_API_ENDPOINT
    );
    const requestArgs = fetchSpy.calls.allArgs()[0][1];
    if (typeof requestArgs === 'object' && requestArgs) {
      expect(JSON.stringify(requestArgs['body'])).toContain('topK');
    }
  });

  it('aggregates citation metadata', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    fetchSpy.and.resolveTo(buildFetchResponse(TEST_MODEL_RESPONSE));
    const resp = await generateContent(
      TEST_LOCATION,
      TEST_RESOURCE_PATH,
      TEST_TOKEN_PROMISE,
      req,
      TEST_API_ENDPOINT
    );
    expect(
      resp.response.candidates![0].citationMetadata?.citations.length
    ).toEqual(
      TEST_MODEL_RESPONSE.candidates[0].citationMetadata.citations.length
    );
  });

  it('returns a FunctionCall when passed a FunctionDeclaration', async () => {
    const req: GenerateContentRequest = {
      contents: CONTENTS,
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE_WITH_FUNCTION_CALL,
    };
    fetchSpy.and.resolveTo(
      new Response(
        JSON.stringify(TEST_MODEL_RESPONSE_WITH_FUNCTION_CALL),
        fetchResponseObj
      )
    );

    const actualResult = await generateContent(
      TEST_LOCATION,
      TEST_RESOURCE_PATH,
      TEST_TOKEN_PROMISE,
      req,
      TEST_API_ENDPOINT
    );
    expect(actualResult).toEqual(expectedResult);
    expect(
      GenerateContentResponseHandler.getFunctionCallsFromCandidate(
        actualResult.response.candidates![0]
      )
    ).toHaveSize(1);
    expect(
      GenerateContentResponseHandler.getFunctionCallsFromCandidate(
        actualResult.response.candidates![0]
      )
    ).toEqual([
      expectedResult.response.candidates![0].content.parts[0].functionCall!,
    ]);
  });

  it('returns a empty FunctionCall list when response contains invalid data', async () => {
    const req: GenerateContentRequest = {
      contents: CONTENTS,
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE_WITH_INVALID_DATA,
    };
    fetchSpy.and.resolveTo(
      new Response(
        JSON.stringify(TEST_MODEL_RESPONSE_WITH_INVALID_DATA),
        fetchResponseObj
      )
    );

    const actualResult = await generateContent(
      TEST_LOCATION,
      TEST_RESOURCE_PATH,
      TEST_TOKEN_PROMISE,
      req,
      TEST_API_ENDPOINT
    );
    expect(actualResult).toEqual(expectedResult);
    expect(
      GenerateContentResponseHandler.getFunctionCallsFromCandidate(
        actualResult.response.candidates?.[0]
      )
    ).toHaveSize(0);
  });

  it('returns empty candidates when response is empty', async () => {
    const req: GenerateContentRequest = {
      contents: CONTENTS,
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    };
    fetchSpy.and.resolveTo(new Response(JSON.stringify({}), fetchResponseObj));

    const actualResult: GenerateContentResult = await generateContent(
      TEST_LOCATION,
      TEST_RESOURCE_PATH,
      TEST_TOKEN_PROMISE,
      req,
      TEST_API_ENDPOINT
    );
    expect(actualResult.response.candidates).not.toBeDefined();
  });

  it('should use v1 apiVersion', async () => {
    const request: GenerateContentRequest = {
      contents: CONTENTS,
    };
    fetchSpy.and.resolveTo(buildFetchResponse(TEST_MODEL_RESPONSE));
    await generateContent(
      TEST_LOCATION,
      TEST_RESOURCE_PATH,
      TEST_TOKEN_PROMISE,
      request,
      TEST_API_ENDPOINT
    );
    const vertexEndpoint = fetchSpy.calls.allArgs()[0][0];
    expect(vertexEndpoint).toContain('/v1/');
  });

  it('should use v1beta1 apiVersion when set RAG in tools', async () => {
    const request: GenerateContentRequest = {
      contents: CONTENTS,
      tools: TEST_TOOLS_WITH_RAG,
    };
    fetchSpy.and.resolveTo(buildFetchResponse(TEST_MODEL_RESPONSE));
    await generateContent(
      TEST_LOCATION,
      TEST_RESOURCE_PATH,
      TEST_TOKEN_PROMISE,
      request,
      TEST_API_ENDPOINT
    );
    const vertexEndpoint = fetchSpy.calls.allArgs()[0][0];
    expect(vertexEndpoint).toContain('/v1beta1/');
  });
});

describe('generateContentStream', () => {
  let expectedStreamResult: StreamGenerateContentResult;
  let fetchSpy: jasmine.Spy;
  let fetchResult: Response;

  beforeEach(() => {
    expectedStreamResult = {
      response: Promise.resolve(TEST_MODEL_RESPONSE),
      stream: testGenerator(),
    };
    fetchResult = new Response(
      JSON.stringify(expectedStreamResult),
      fetchResponseObj
    );
  });

  it('request rejected when timeout', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    fetchSpy = spyOn(global, 'fetch').and.resolveTo({
      ok: false,
      status: 500,
      statusText: 'AbortError',
    } as Response);
    await expectAsync(
      generateContentStream(
        TEST_LOCATION,
        TEST_RESOURCE_PATH,
        TEST_TOKEN_PROMISE,
        req,
        TEST_API_ENDPOINT,
        TEST_GENERATION_CONFIG,
        TEST_SAFETY_SETTINGS,
        TEST_EMPTY_TOOLS,
        TEST_EMPTY_TOOL_CONFIG,
        TEST_REQUEST_OPTIONS
      )
    ).toBeRejected();
    expect(fetchSpy.calls.allArgs()[0][1].signal).toBeInstanceOf(AbortSignal);
  });
  it('returns a GenerateContentResponse when passed text content', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const expectedResult: StreamGenerateContentResult = {
      response: Promise.resolve(TEST_MODEL_RESPONSE),
      stream: testGenerator(),
    };
    fetchSpy = spyOn(global, 'fetch').and.resolveTo(fetchResult);
    spyOn(StreamFunctions, 'processStream').and.resolveTo(expectedResult);
    const resp = await generateContentStream(
      TEST_LOCATION,
      TEST_RESOURCE_PATH,
      TEST_TOKEN_PROMISE,
      req,
      TEST_API_ENDPOINT
    );
    expect(resp).toEqual(expectedResult);
  });

  it('returns a GenerateContentResponse when passed a string', async () => {
    const expectedResult: StreamGenerateContentResult = {
      response: Promise.resolve(TEST_MODEL_RESPONSE),
      stream: testGenerator(),
    };
    fetchSpy = spyOn(global, 'fetch').and.resolveTo(fetchResult);
    spyOn(StreamFunctions, 'processStream').and.resolveTo(expectedResult);
    const resp = await generateContentStream(
      TEST_LOCATION,
      TEST_RESOURCE_PATH,
      TEST_TOKEN_PROMISE,
      TEST_API_ENDPOINT,
      TEST_CHAT_MESSAGE_TEXT
    );
    expect(resp).toEqual(expectedResult);
  });

  it('returns a GenerateContentResponse when passed multi-part content with a GCS URI', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_MULTIPART_MESSAGE,
    };
    const expectedResult: StreamGenerateContentResult = {
      response: Promise.resolve(TEST_MODEL_RESPONSE),
      stream: testGenerator(),
    };
    fetchSpy = spyOn(global, 'fetch').and.resolveTo(fetchResult);
    spyOn(StreamFunctions, 'processStream').and.resolveTo(expectedResult);
    const resp = await generateContentStream(
      TEST_LOCATION,
      TEST_RESOURCE_PATH,
      TEST_TOKEN_PROMISE,
      req,
      TEST_API_ENDPOINT
    );
    expect(resp).toEqual(expectedResult);
  });

  it('returns a GenerateContentResponse when passed multi-part content with base64 data', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_MULTIPART_MESSAGE_BASE64,
    };
    const expectedResult: StreamGenerateContentResult = {
      response: Promise.resolve(TEST_MODEL_RESPONSE),
      stream: testGenerator(),
    };
    fetchSpy = spyOn(global, 'fetch').and.resolveTo(fetchResult);
    spyOn(StreamFunctions, 'processStream').and.resolveTo(expectedResult);
    const resp = await generateContentStream(
      TEST_LOCATION,
      TEST_RESOURCE_PATH,
      TEST_TOKEN_PROMISE,
      req,
      TEST_API_ENDPOINT
    );
    expect(resp).toEqual(expectedResult);
  });
  it('returns a FunctionCall when passed a FunctionDeclaration', async () => {
    const req: GenerateContentRequest = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weater like in Boston?'}]},
      ],
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const expectedStreamResult: StreamGenerateContentResult = {
      response: Promise.resolve(TEST_MODEL_RESPONSE_WITH_FUNCTION_CALL),
      stream: testGenerator(),
    };
    fetchSpy = spyOn(global, 'fetch').and.resolveTo(fetchResult);
    spyOn(StreamFunctions, 'processStream').and.resolveTo(expectedStreamResult);
    const result = await generateContentStream(
      TEST_LOCATION,
      TEST_RESOURCE_PATH,
      TEST_TOKEN_PROMISE,
      req,
      TEST_API_ENDPOINT
    );
    expect(result).toEqual(expectedStreamResult);
    const response = await result.response;
    expect(
      GenerateContentResponseHandler.getFunctionCallsFromCandidate(
        response.candidates![0]
      )
    ).toHaveSize(1);
    expect(
      GenerateContentResponseHandler.getFunctionCallsFromCandidate(
        response.candidates![0]
      )
    ).toEqual([response.candidates![0].content.parts[0].functionCall!]);
  });

  it('returns an empty FunctionCall list when response contains invalid data', async () => {
    const req: GenerateContentRequest = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weater like in Boston?'}]},
      ],
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const expectedStreamResult: StreamGenerateContentResult = {
      response: Promise.resolve(TEST_MODEL_RESPONSE_WITH_INVALID_DATA),
      stream: testGenerator(),
    };
    fetchSpy = spyOn(global, 'fetch').and.resolveTo(fetchResult);
    spyOn(StreamFunctions, 'processStream').and.resolveTo(expectedStreamResult);

    const actualResult = await generateContentStream(
      TEST_LOCATION,
      TEST_RESOURCE_PATH,
      TEST_TOKEN_PROMISE,
      req,
      TEST_API_ENDPOINT
    );
    expect(actualResult).toEqual(expectedStreamResult);
    const response = await actualResult.response;
    expect(
      GenerateContentResponseHandler.getFunctionCallsFromCandidate(
        response.candidates?.[0]
      )
    ).toHaveSize(0);
  });
});
