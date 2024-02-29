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
  CountTokensRequest,
  FinishReason,
  FunctionDeclarationSchemaType,
  GenerateContentRequest,
  GenerateContentResponse,
  GenerateContentResult,
  HarmBlockThreshold,
  HarmCategory,
  HarmProbability,
  RequestOptions,
  SafetyRating,
  SafetySetting,
  StreamGenerateContentResult,
  Tool,
} from '../../types';
import {constants} from '../../util';
import {countTokens} from '../count_tokens';
import {generateContent, generateContentStream} from '../generate_content';
import * as StreamFunctions from '../post_fetch_processing';

const TEST_PROJECT = 'test-project';
const TEST_LOCATION = 'test-location';
const TEST_PUBLISHER_MODEL_ENDPOINT = 'test-publisher-model-endpoint';
const TEST_TOKEN = 'testtoken';
const TEST_TOKEN_PROMISE = Promise.resolve(TEST_TOKEN);
const TEST_API_ENDPOINT = 'test-api-endpoint';
const TEST_CHAT_MESSAGE_TEXT = 'How are you doing today?';
const TEST_USER_CHAT_MESSAGE = [
  {role: constants.USER_ROLE, parts: [{text: TEST_CHAT_MESSAGE_TEXT}]},
];

const TEST_USER_CHAT_MESSAGE_WITH_GCS_FILE = [
  {
    role: constants.USER_ROLE,
    parts: [
      {text: TEST_CHAT_MESSAGE_TEXT},
      {
        file_data: {
          file_uri: 'gs://test_bucket/test_image.jpeg',
          mime_type: 'image/jpeg',
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
      {file_data: {file_uri: 'test_image.jpeg', mime_type: 'image/jpeg'}},
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
  timeoutMillis: 0,
};
const TEST_SAFETY_RATINGS: SafetyRating[] = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    probability: HarmProbability.NEGLIGIBLE,
  },
];
const TEST_GENERATION_CONFIG = {
  candidate_count: 1,
  stop_sequences: ['hello'],
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
      citationSources: [
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

const TEST_FUNCTION_RESPONSE_PART = [
  {
    functionResponse: {
      name: 'get_current_weather',
      response: {name: 'get_current_weather', content: {weather: 'super nice'}},
    },
  },
];

const TEST_CANDIDATES_MISSING_ROLE = [
  {
    index: 1,
    content: {parts: [{text: 'Im doing great! How are you?'}]},
    finish_reason: 0,
    finish_message: '',
    safety_ratings: TEST_SAFETY_RATINGS,
  },
];

const TEST_ENDPOINT_BASE_PATH = 'test.googleapis.com';
const TEST_GCS_FILENAME = 'gs://test_bucket/test_image.jpeg';

const TEST_MULTIPART_MESSAGE = [
  {
    role: constants.USER_ROLE,
    parts: [
      {text: 'What is in this picture?'},
      {file_data: {file_uri: TEST_GCS_FILENAME, mime_type: 'image/jpeg'}},
    ],
  },
];

const BASE_64_IMAGE =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const INLINE_DATA_FILE_PART = {
  inline_data: {
    data: BASE_64_IMAGE,
    mime_type: 'image/jpeg',
  },
};

const TEST_MULTIPART_MESSAGE_BASE64 = [
  {
    role: constants.USER_ROLE,
    parts: [{text: 'What is in this picture?'}, INLINE_DATA_FILE_PART],
  },
];

const TEST_TOOLS_WITH_FUNCTION_DECLARATION: Tool[] = [
  {
    function_declarations: [
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
      TEST_PROJECT,
      TEST_PUBLISHER_MODEL_ENDPOINT,
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
        TEST_PROJECT,
        TEST_PUBLISHER_MODEL_ENDPOINT,
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
    const expectedErrorMessage =
      '[VertexAI.GoogleGenerativeAIError]: got status: 500 Internal Server Error. {"code":500,"message":"service is having downtime","status":"INTERNAL_SERVER_ERROR"}';
    spyOn(global, 'fetch').and.resolveTo(response);

    await expectAsync(
      countTokens(
        TEST_LOCATION,
        TEST_PROJECT,
        TEST_PUBLISHER_MODEL_ENDPOINT,
        TEST_TOKEN_PROMISE,
        req,
        TEST_API_ENDPOINT
      )
    ).toBeRejected();
    // TODO: update jasmine version or use flush to uncomment
    // await countTokens(
    //   TEST_LOCATION,
    //   TEST_PROJECT,
    //   TEST_PUBLISHER_MODEL_ENDPOINT,
    //   TEST_TOKEN_PROMISE,
    //   req,
    //   TEST_API_ENDPOINT
    // ).catch(e => {
    //   expect(e.message).toEqual(expectedErrorMessage);
    // });
  });

  it('throw ClientError when not OK and 4XX', async () => {
    const fetch400Obj = {
      status: 400,
      statusText: 'Bad Request',
      ok: false,
    };
    const body = {
      code: 400,
      message: 'request is invalid',
      status: 'INVALID_ARGUMENT',
    };
    const response = new Response(JSON.stringify(body), fetch400Obj);
    const expectedErrorMessage =
      '[VertexAI.ClientError]: got status: 400 Bad Request. {"code":400,"message":"request is invalid","status":"INVALID_ARGUMENT"}';
    spyOn(global, 'fetch').and.resolveTo(response);

    await expectAsync(
      countTokens(
        TEST_LOCATION,
        TEST_PROJECT,
        TEST_PUBLISHER_MODEL_ENDPOINT,
        TEST_TOKEN_PROMISE,
        req,
        TEST_API_ENDPOINT
      )
    ).toBeRejected();
    // TODO: update jasmine version or use flush to uncomment
    // await countTokens(
    //   TEST_LOCATION,
    //   TEST_PROJECT,
    //   TEST_PUBLISHER_MODEL_ENDPOINT,
    //   TEST_TOKEN_PROMISE,
    //   req,
    //   TEST_API_ENDPOINT
    // ).catch(e => {
    //   expect(e.message).toEqual(expectedErrorMessage);
    // });
  });
});

describe('generateContent', () => {
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
      generateContent(
        TEST_LOCATION,
        TEST_PROJECT,
        TEST_PUBLISHER_MODEL_ENDPOINT,
        TEST_TOKEN_PROMISE,
        req,
        TEST_API_ENDPOINT,
        TEST_GENERATION_CONFIG,
        TEST_SAFETY_SETTINGS,
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
    fetchSpy = spyOn(global, 'fetch').and.resolveTo(fetchResult);
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    const resp = await generateContent(
      TEST_LOCATION,
      TEST_PROJECT,
      TEST_PUBLISHER_MODEL_ENDPOINT,
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
    fetchSpy = spyOn(global, 'fetch').and.resolveTo(fetchResult);
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    const resp = await generateContent(
      TEST_LOCATION,
      TEST_PROJECT,
      TEST_PUBLISHER_MODEL_ENDPOINT,
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
    fetchSpy = spyOn(global, 'fetch').and.resolveTo(fetchResult);
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    const resp = await generateContent(
      TEST_LOCATION,
      TEST_PROJECT,
      TEST_PUBLISHER_MODEL_ENDPOINT,
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
        TEST_PROJECT,
        TEST_PUBLISHER_MODEL_ENDPOINT,
        TEST_TOKEN_PROMISE,
        req,
        TEST_API_ENDPOINT
      )
    ).toBeRejectedWithError(URIError);
  });

  it('returns a GenerateContentResponse when passed safety_settings and generation_config', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
      safety_settings: TEST_SAFETY_SETTINGS,
      generation_config: TEST_GENERATION_CONFIG,
    };
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE,
    };
    fetchSpy = spyOn(global, 'fetch').and.resolveTo(fetchResult);
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    const resp = await generateContent(
      TEST_LOCATION,
      TEST_PROJECT,
      TEST_PUBLISHER_MODEL_ENDPOINT,
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
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE,
    };
    fetchSpy = spyOn(global, 'fetch').and.resolveTo(fetchResult);
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    await generateContent(
      TEST_LOCATION,
      TEST_PROJECT,
      TEST_PUBLISHER_MODEL_ENDPOINT,
      TEST_TOKEN_PROMISE,
      req,
      TEST_ENDPOINT_BASE_PATH
    );
    expect(fetchSpy.calls.allArgs()[0][0].toString()).toContain(
      TEST_ENDPOINT_BASE_PATH
    );
  });

  it('removes top_k when it is set to 0', async () => {
    const reqWithEmptyConfigs: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE_WITH_GCS_FILE,
      generation_config: {top_k: 0},
      safety_settings: [],
    };
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE,
    };
    fetchSpy = spyOn(global, 'fetch').and.resolveTo(fetchResult);
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    await generateContent(
      TEST_LOCATION,
      TEST_PROJECT,
      TEST_PUBLISHER_MODEL_ENDPOINT,
      TEST_TOKEN_PROMISE,
      reqWithEmptyConfigs,
      TEST_API_ENDPOINT
    );
    const requestArgs = fetchSpy.calls.allArgs()[0][1];
    if (typeof requestArgs === 'object' && requestArgs) {
      expect(JSON.stringify(requestArgs['body'])).not.toContain('top_k');
    }
  });

  it('includes top_k when it is within 1 - 40', async () => {
    const reqWithEmptyConfigs: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE_WITH_GCS_FILE,
      generation_config: {top_k: 1},
      safety_settings: [],
    };
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE,
    };
    fetchSpy = spyOn(global, 'fetch').and.resolveTo(fetchResult);
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    await generateContent(
      TEST_LOCATION,
      TEST_PROJECT,
      TEST_PUBLISHER_MODEL_ENDPOINT,
      TEST_TOKEN_PROMISE,
      reqWithEmptyConfigs,
      TEST_API_ENDPOINT
    );
    const requestArgs = fetchSpy.calls.allArgs()[0][1];
    if (typeof requestArgs === 'object' && requestArgs) {
      expect(JSON.stringify(requestArgs['body'])).toContain('top_k');
    }
  });

  it('aggregates citation metadata', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE,
    };
    fetchSpy = spyOn(global, 'fetch').and.resolveTo(fetchResult);
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    const resp = await generateContent(
      TEST_LOCATION,
      TEST_PROJECT,
      TEST_PUBLISHER_MODEL_ENDPOINT,
      TEST_TOKEN_PROMISE,
      req,
      TEST_API_ENDPOINT
    );
    expect(
      resp.response.candidates[0].citationMetadata?.citationSources.length
    ).toEqual(
      TEST_MODEL_RESPONSE.candidates[0].citationMetadata.citationSources.length
    );
  });

  it('returns a FunctionCall when passed a FunctionDeclaration', async () => {
    const req: GenerateContentRequest = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weater like in Boston?'}]},
      ],
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE_WITH_FUNCTION_CALL,
    };
    fetchSpy = spyOn(global, 'fetch').and.resolveTo(fetchResult);
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    const resp = await generateContent(
      TEST_LOCATION,
      TEST_PROJECT,
      TEST_PUBLISHER_MODEL_ENDPOINT,
      TEST_TOKEN_PROMISE,
      req,
      TEST_API_ENDPOINT
    );
    expect(resp).toEqual(expectedResult);
  });

  it('throws ClientError when functionResponse is not immedidately following functionCall case1', async () => {
    const req: GenerateContentRequest = {
      contents: [
        {
          role: 'user',
          parts: [{text: 'What is the weater like in Boston?'}],
        },
        {
          role: 'function',
          parts: TEST_FUNCTION_RESPONSE_PART,
        },
      ],
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const expectedErrorMessage =
      '[VertexAI.ClientError]: Please ensure that function response turn comes immediately after a function call turn.';
    await generateContent(
      TEST_LOCATION,
      TEST_PROJECT,
      TEST_PUBLISHER_MODEL_ENDPOINT,
      TEST_TOKEN_PROMISE,
      req,
      TEST_API_ENDPOINT
    ).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });

  it('throws ClientError when functionResponse is not immedidately following functionCall case2', async () => {
    const req: GenerateContentRequest = {
      contents: [
        {
          role: 'user',
          parts: [{text: 'What is the weater like in Boston?'}],
        },
        {
          role: 'function',
          parts: TEST_FUNCTION_RESPONSE_PART,
        },
      ],
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const expectedErrorMessage =
      '[VertexAI.ClientError]: Please ensure that function response turn comes immediately after a function call turn.';
    await generateContent(
      TEST_LOCATION,
      TEST_PROJECT,
      TEST_PUBLISHER_MODEL_ENDPOINT,
      TEST_TOKEN_PROMISE,
      req,
      TEST_API_ENDPOINT
    ).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
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
        TEST_PROJECT,
        TEST_PUBLISHER_MODEL_ENDPOINT,
        TEST_TOKEN_PROMISE,
        req,
        TEST_API_ENDPOINT,
        TEST_GENERATION_CONFIG,
        TEST_SAFETY_SETTINGS,
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
      TEST_PROJECT,
      TEST_PUBLISHER_MODEL_ENDPOINT,
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
      TEST_PROJECT,
      TEST_PUBLISHER_MODEL_ENDPOINT,
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
      TEST_PROJECT,
      TEST_PUBLISHER_MODEL_ENDPOINT,
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
      TEST_PROJECT,
      TEST_PUBLISHER_MODEL_ENDPOINT,
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
    const resp = await generateContentStream(
      TEST_LOCATION,
      TEST_PROJECT,
      TEST_PUBLISHER_MODEL_ENDPOINT,
      TEST_TOKEN_PROMISE,
      req,
      TEST_API_ENDPOINT
    );
    expect(resp).toEqual(expectedStreamResult);
  });
  it('throws ClientError when functionResponse is not immedidately following functionCall case1', async () => {
    const req: GenerateContentRequest = {
      contents: [
        {
          role: 'user',
          parts: [{text: 'What is the weater like in Boston?'}],
        },
        {
          role: 'function',
          parts: TEST_FUNCTION_RESPONSE_PART,
        },
      ],
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const expectedErrorMessage =
      '[VertexAI.ClientError]: Please ensure that function response turn comes immediately after a function call turn.';
    await generateContentStream(
      TEST_LOCATION,
      TEST_PROJECT,
      TEST_PUBLISHER_MODEL_ENDPOINT,
      TEST_TOKEN_PROMISE,
      req,
      TEST_API_ENDPOINT
    ).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });

  it('throws ClientError when functionResponse is not immedidately following functionCall case2', async () => {
    const req: GenerateContentRequest = {
      contents: [
        {
          role: 'user',
          parts: [{text: 'What is the weater like in Boston?'}],
        },
        {
          role: 'function',
          parts: TEST_FUNCTION_RESPONSE_PART,
        },
      ],
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const expectedErrorMessage =
      '[VertexAI.ClientError]: Please ensure that function response turn comes immediately after a function call turn.';
    await generateContentStream(
      TEST_LOCATION,
      TEST_PROJECT,
      TEST_PUBLISHER_MODEL_ENDPOINT,
      TEST_TOKEN_PROMISE,
      req,
      TEST_API_ENDPOINT
    ).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });
});
