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

import {GoogleAuth} from 'google-auth-library';
import {constants} from '../../util';
import {GenerativeModel, GenerativeModelPreview} from '../generative_models';
import {ChatSession, ChatSessionPreview} from '../chat_session';
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
  SafetyRating,
  SafetySetting,
  StreamGenerateContentResult,
  Tool,
} from '../../types/content';
import * as StreamFunctions from '../../functions/post_fetch_processing';
import * as GenerateContentFunctions from '../../functions/generate_content';
import * as CountTokensFunctions from '../../functions/count_tokens';

const PROJECT = 'test_project';
const LOCATION = 'test_location';
const googleAuth = new GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/cloud-platform',
});
const TEST_CHAT_MESSSAGE_TEXT = 'How are you doing today?';
const TEST_TOKEN = 'testtoken';
const TEST_USER_CHAT_MESSAGE = [
  {role: constants.USER_ROLE, parts: [{text: TEST_CHAT_MESSSAGE_TEXT}]},
];
const TEST_SAFETY_RATINGS: SafetyRating[] = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    probability: HarmProbability.NEGLIGIBLE,
  },
];
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
  usage_metadata: {prompt_token_count: 0, candidates_token_count: 0},
};
const TEST_USER_CHAT_MESSAGE_WITH_GCS_FILE = [
  {
    role: constants.USER_ROLE,
    parts: [
      {text: TEST_CHAT_MESSSAGE_TEXT},
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
      {text: TEST_CHAT_MESSSAGE_TEXT},
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
const TEST_GENERATION_CONFIG = {
  candidate_count: 1,
  stop_sequences: ['hello'],
};
const TEST_ENDPOINT_BASE_PATH = 'test.googleapis.com';
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
const fetchResponseObj = {
  status: 200,
  statusText: 'OK',
  ok: true,
  headers: {'Content-Type': 'application/json'},
  url: 'url',
};
const TEST_EMPTY_MODEL_RESPONSE = {
  candidates: [],
};
const TEST_CANDIDATES_MISSING_ROLE = [
  {
    index: 1,
    content: {parts: [{text: 'Im doing great! How are you?'}]},
    finish_reason: 0,
    finish_message: '',
    safety_ratings: TEST_SAFETY_RATINGS,
  },
];
const TEST_MODEL_RESPONSE_MISSING_ROLE = {
  candidates: TEST_CANDIDATES_MISSING_ROLE,
  usage_metadata: {prompt_token_count: 0, candidates_token_count: 0},
};
const TEST_REQUEST_OPTIONS = {
  timeoutMillis: 0,
};
async function* testGenerator(): AsyncGenerator<GenerateContentResponse> {
  yield {
    candidates: TEST_CANDIDATES,
  };
}

describe('GenerativeModel startChat', () => {
  it('returns ChatSession when pass no arg', () => {
    const model = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: googleAuth,
    });
    const chat = model.startChat();

    expect(chat).toBeInstanceOf(ChatSession);
  });
  it('returns ChatSession when pass an arg', () => {
    const model = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: googleAuth,
    });
    const chat = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
    });

    expect(chat).toBeInstanceOf(ChatSession);
  });
  it('set timeout info in ChatSession', () => {
    const model = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: googleAuth,
      requestOptions: TEST_REQUEST_OPTIONS,
    });
    const chat = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
    });

    expect(chat.requestOptions).toEqual(TEST_REQUEST_OPTIONS);
  });
});

describe('GenerativeModelPreview startChat', () => {
  it('returns ChatSessionPreview when pass no arg', () => {
    const model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: googleAuth,
    });
    const chat = model.startChat();

    expect(chat).toBeInstanceOf(ChatSessionPreview);
  });
  it('returns ChatSessionPreview when pass an arg', () => {
    const model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: googleAuth,
    });
    const chat = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
    });

    expect(chat).toBeInstanceOf(ChatSessionPreview);
  });
  it('set timeout info in ChatSession', () => {
    const model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: googleAuth,
      requestOptions: TEST_REQUEST_OPTIONS,
    });
    const chat = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
    });

    expect(chat.requestOptions).toEqual(TEST_REQUEST_OPTIONS);
  });
});

describe('GenerativeModel generateContent', () => {
  let model: GenerativeModel;
  let fetchSpy: jasmine.Spy;
  let expectedResult: GenerateContentResult;

  beforeEach(() => {
    model = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: googleAuth,
    });
    spyOnProperty(model, 'token', 'get').and.resolveTo(TEST_TOKEN);
    expectedResult = {
      response: TEST_MODEL_RESPONSE,
    };
    const fetchResult = new Response(
      JSON.stringify(expectedResult),
      fetchResponseObj
    );
    fetchSpy = spyOn(global, 'fetch').and.resolveTo(fetchResult);
  });

  it('returns a GenerateContentResponse', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE,
    };
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    const resp = await model.generateContent(req);
    expect(resp).toEqual(expectedResult);
  });
  it('send timeout options to functions', async () => {
    const modelWithRequestOptions = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: googleAuth,
      requestOptions: TEST_REQUEST_OPTIONS,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    spyOnProperty(modelWithRequestOptions, 'token', 'get').and.resolveTo(
      TEST_TOKEN
    );
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContent'
    );
    await modelWithRequestOptions.generateContent(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][8].timeoutMillis).toEqual(0);
  });
  it('returns a GenerateContentResponse when passed a string', async () => {
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE,
    };
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    const resp = await model.generateContent(TEST_CHAT_MESSSAGE_TEXT);
    expect(resp).toEqual(expectedResult);
  });

  it('returns a GenerateContentResponse when passed a GCS URI', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE_WITH_GCS_FILE,
    };
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE,
    };
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    const resp = await model.generateContent(req);
    expect(resp).toEqual(expectedResult);
  });

  it('raises an error when passed an invalid GCS URI', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE_WITH_INVALID_GCS_FILE,
    };
    await expectAsync(model.generateContent(req)).toBeRejectedWithError(
      URIError
    );
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
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    const resp = await model.generateContent(req);
    expect(resp).toEqual(expectedResult);
  });

  it('updates the base API endpoint when provided', async () => {
    model = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: googleAuth,
      apiEndpoint: TEST_ENDPOINT_BASE_PATH,
    });
    spyOnProperty(model, 'token', 'get').and.resolveTo(TEST_TOKEN);
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE,
    };
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    await model.generateContent(req);
    expect(fetchSpy.calls.allArgs()[0][0].toString()).toContain(
      TEST_ENDPOINT_BASE_PATH
    );
  });

  it('default the base API endpoint when base API not provided', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE,
    };
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    await model.generateContent(req);
    expect(fetchSpy.calls.allArgs()[0][0].toString()).toContain(
      `${LOCATION}-aiplatform.googleapis.com`
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
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    await model.generateContent(reqWithEmptyConfigs);
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
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    await model.generateContent(reqWithEmptyConfigs);
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
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    const resp = await model.generateContent(req);
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
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    const resp = await model.generateContent(req);
    expect(resp).toEqual(expectedResult);
  });

  it('throws ClientError when functionResponse is not immedidately following functionCall case1', async () => {
    const req: GenerateContentRequest = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weater like in Boston?'}]},
        {
          role: 'function',
          parts: TEST_FUNCTION_RESPONSE_PART,
        },
      ],
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const expectedErrorMessage =
      '[VertexAI.ClientError]: Please ensure that function response turn comes immediately after a function call turn.';
    await model.generateContent(req).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });

  it('throws ClientError when functionResponse is not immedidately following functionCall case2', async () => {
    const req: GenerateContentRequest = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weater like in Boston?'}]},
        {
          role: 'function',
          parts: TEST_FUNCTION_RESPONSE_PART,
        },
      ],
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const expectedErrorMessage =
      '[VertexAI.ClientError]: Please ensure that function response turn comes immediately after a function call turn.';
    await model.generateContent(req).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });
});

describe('GenerativeModelPreview generateContent', () => {
  let model: GenerativeModelPreview;
  let fetchSpy: jasmine.Spy;
  let expectedResult: GenerateContentResult;

  beforeEach(() => {
    model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: googleAuth,
    });
    spyOnProperty(model, 'token', 'get').and.resolveTo(TEST_TOKEN);
    expectedResult = {
      response: TEST_MODEL_RESPONSE,
    };
    const fetchResult = new Response(
      JSON.stringify(expectedResult),
      fetchResponseObj
    );
    fetchSpy = spyOn(global, 'fetch').and.resolveTo(fetchResult);
  });

  it('returns a GenerateContentResponse', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE,
    };
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    const resp = await model.generateContent(req);
    expect(resp).toEqual(expectedResult);
  });
  it('send timeout options to functions', async () => {
    const modelWithRequestOptions = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: googleAuth,
      requestOptions: TEST_REQUEST_OPTIONS,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    spyOnProperty(modelWithRequestOptions, 'token', 'get').and.resolveTo(
      TEST_TOKEN
    );
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContent'
    );
    await modelWithRequestOptions.generateContent(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][8].timeoutMillis).toEqual(0);
  });
  it('returns a GenerateContentResponse when passed a string', async () => {
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE,
    };
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    const resp = await model.generateContent(TEST_CHAT_MESSSAGE_TEXT);
    expect(resp).toEqual(expectedResult);
  });

  it('returns a GenerateContentResponse when passed a GCS URI', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE_WITH_GCS_FILE,
    };
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE,
    };
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    const resp = await model.generateContent(req);
    expect(resp).toEqual(expectedResult);
  });

  it('raises an error when passed an invalid GCS URI', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE_WITH_INVALID_GCS_FILE,
    };
    await expectAsync(model.generateContent(req)).toBeRejectedWithError(
      URIError
    );
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
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    const resp = await model.generateContent(req);
    expect(resp).toEqual(expectedResult);
  });

  it('updates the base API endpoint when provided', async () => {
    model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: googleAuth,
      apiEndpoint: TEST_ENDPOINT_BASE_PATH,
    });
    spyOnProperty(model, 'token', 'get').and.resolveTo(TEST_TOKEN);
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE,
    };
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    await model.generateContent(req);
    expect(fetchSpy.calls.allArgs()[0][0].toString()).toContain(
      TEST_ENDPOINT_BASE_PATH
    );
  });

  it('default the base API endpoint when base API not provided', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE,
    };
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    await model.generateContent(req);
    expect(fetchSpy.calls.allArgs()[0][0].toString()).toContain(
      `${LOCATION}-aiplatform.googleapis.com`
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
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    await model.generateContent(reqWithEmptyConfigs);
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
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    await model.generateContent(reqWithEmptyConfigs);
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
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    const resp = await model.generateContent(req);
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
    spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
    const resp = await model.generateContent(req);
    expect(resp).toEqual(expectedResult);
  });

  it('throws ClientError when functionResponse is not immedidately following functionCall case1', async () => {
    const req: GenerateContentRequest = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weater like in Boston?'}]},
        {
          role: 'function',
          parts: TEST_FUNCTION_RESPONSE_PART,
        },
      ],
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const expectedErrorMessage =
      '[VertexAI.ClientError]: Please ensure that function response turn comes immediately after a function call turn.';
    await model.generateContent(req).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });

  it('throws ClientError when functionResponse is not immedidately following functionCall case2', async () => {
    const req: GenerateContentRequest = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weater like in Boston?'}]},
        {
          role: 'function',
          parts: TEST_FUNCTION_RESPONSE_PART,
        },
      ],
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const expectedErrorMessage =
      '[VertexAI.ClientError]: Please ensure that function response turn comes immediately after a function call turn.';
    await model.generateContent(req).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });
});

describe('GenerativeModel generateContentStream', () => {
  let model: GenerativeModel;
  let expectedStreamResult: StreamGenerateContentResult;
  let fetchSpy: jasmine.Spy;

  beforeEach(() => {
    model = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: googleAuth,
    });
    spyOnProperty(model, 'token', 'get').and.resolveTo(TEST_TOKEN);
    expectedStreamResult = {
      response: Promise.resolve(TEST_MODEL_RESPONSE),
      stream: testGenerator(),
    };
    const fetchResult = new Response(
      JSON.stringify(expectedStreamResult),
      fetchResponseObj
    );
    fetchSpy = spyOn(global, 'fetch').and.resolveTo(fetchResult);
  });

  it('returns a GenerateContentResponse when passed text content', async () => {
    const req: GenerateContentRequest = {contents: TEST_USER_CHAT_MESSAGE};
    const expectedResult: StreamGenerateContentResult = {
      response: Promise.resolve(TEST_MODEL_RESPONSE),
      stream: testGenerator(),
    };
    spyOn(StreamFunctions, 'processStream').and.resolveTo(expectedResult);
    const resp = await model.generateContentStream(req);
    expect(resp).toEqual(expectedResult);
  });
  it('send timeout options to functions', async () => {
    const modelWithRequestOptions = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: googleAuth,
      requestOptions: TEST_REQUEST_OPTIONS,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContentStream'
    );
    await modelWithRequestOptions.generateContentStream(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][8].timeoutMillis).toEqual(0);
  });
  it('returns a GenerateContentResponse when passed a string', async () => {
    const expectedResult: StreamGenerateContentResult = {
      response: Promise.resolve(TEST_MODEL_RESPONSE),
      stream: testGenerator(),
    };
    spyOn(StreamFunctions, 'processStream').and.resolveTo(expectedResult);
    const resp = await model.generateContentStream(TEST_CHAT_MESSSAGE_TEXT);
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
    spyOn(StreamFunctions, 'processStream').and.resolveTo(expectedResult);
    const resp = await model.generateContentStream(req);
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
    spyOn(StreamFunctions, 'processStream').and.resolveTo(expectedResult);
    const resp = await model.generateContentStream(req);
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
    spyOn(StreamFunctions, 'processStream').and.resolveTo(expectedStreamResult);
    const resp = await model.generateContentStream(req);
    expect(resp).toEqual(expectedStreamResult);
  });
  it('throws ClientError when functionResponse is not immedidately following functionCall case1', async () => {
    const req: GenerateContentRequest = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weater like in Boston?'}]},
        {
          role: 'function',
          parts: TEST_FUNCTION_RESPONSE_PART,
        },
      ],
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const expectedErrorMessage =
      '[VertexAI.ClientError]: Please ensure that function response turn comes immediately after a function call turn.';
    await model.generateContentStream(req).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });

  it('throws ClientError when functionResponse is not immedidately following functionCall case2', async () => {
    const req: GenerateContentRequest = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weater like in Boston?'}]},
        {
          role: 'function',
          parts: TEST_FUNCTION_RESPONSE_PART,
        },
      ],
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const expectedErrorMessage =
      '[VertexAI.ClientError]: Please ensure that function response turn comes immediately after a function call turn.';
    await model.generateContentStream(req).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });
});

describe('GenerativeModelPreview generateContentStream', () => {
  let model: GenerativeModelPreview;
  let expectedStreamResult: StreamGenerateContentResult;
  let fetchSpy: jasmine.Spy;

  beforeEach(() => {
    model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: googleAuth,
    });
    spyOnProperty(model, 'token', 'get').and.resolveTo(TEST_TOKEN);
    expectedStreamResult = {
      response: Promise.resolve(TEST_MODEL_RESPONSE),
      stream: testGenerator(),
    };
    const fetchResult = new Response(
      JSON.stringify(expectedStreamResult),
      fetchResponseObj
    );
    fetchSpy = spyOn(global, 'fetch').and.resolveTo(fetchResult);
  });

  it('returns a GenerateContentResponse when passed text content', async () => {
    const req: GenerateContentRequest = {contents: TEST_USER_CHAT_MESSAGE};
    const expectedResult: StreamGenerateContentResult = {
      response: Promise.resolve(TEST_MODEL_RESPONSE),
      stream: testGenerator(),
    };
    spyOn(StreamFunctions, 'processStream').and.resolveTo(expectedResult);
    const resp = await model.generateContentStream(req);
    expect(resp).toEqual(expectedResult);
  });

  it('send timeout options to functions', async () => {
    const modelWithRequestOptions = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: googleAuth,
      requestOptions: TEST_REQUEST_OPTIONS,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContentStream'
    );
    await modelWithRequestOptions.generateContentStream(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][8].timeoutMillis).toEqual(0);
  });

  it('returns a GenerateContentResponse when passed a string', async () => {
    const expectedResult: StreamGenerateContentResult = {
      response: Promise.resolve(TEST_MODEL_RESPONSE),
      stream: testGenerator(),
    };
    spyOn(StreamFunctions, 'processStream').and.resolveTo(expectedResult);
    const resp = await model.generateContentStream(TEST_CHAT_MESSSAGE_TEXT);
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
    spyOn(StreamFunctions, 'processStream').and.resolveTo(expectedResult);
    const resp = await model.generateContentStream(req);
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
    spyOn(StreamFunctions, 'processStream').and.resolveTo(expectedResult);
    const resp = await model.generateContentStream(req);
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
    spyOn(StreamFunctions, 'processStream').and.resolveTo(expectedStreamResult);
    const resp = await model.generateContentStream(req);
    expect(resp).toEqual(expectedStreamResult);
  });
  it('throws ClientError when functionResponse is not immedidately following functionCall case1', async () => {
    const req: GenerateContentRequest = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weater like in Boston?'}]},
        {
          role: 'function',
          parts: TEST_FUNCTION_RESPONSE_PART,
        },
      ],
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const expectedErrorMessage =
      '[VertexAI.ClientError]: Please ensure that function response turn comes immediately after a function call turn.';
    await model.generateContentStream(req).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });

  it('throws ClientError when functionResponse is not immedidately following functionCall case2', async () => {
    const req: GenerateContentRequest = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weater like in Boston?'}]},
        {
          role: 'function',
          parts: TEST_FUNCTION_RESPONSE_PART,
        },
      ],
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const expectedErrorMessage =
      '[VertexAI.ClientError]: Please ensure that function response turn comes immediately after a function call turn.';
    await model.generateContentStream(req).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });
});

describe('ChatSession', () => {
  let chatSession: ChatSession;
  let chatSessionWithNoArgs: ChatSession;
  let chatSessionWithEmptyResponse: ChatSession;
  let chatSessionWithFunctionCall: ChatSession;
  let model: GenerativeModel;
  let expectedStreamResult: StreamGenerateContentResult;

  beforeEach(() => {
    model = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: googleAuth,
    });
    chatSession = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
    });
    spyOnProperty(chatSession, 'token', 'get').and.resolveTo(TEST_TOKEN);
    expect(chatSession.history).toEqual(TEST_USER_CHAT_MESSAGE);
    chatSessionWithNoArgs = model.startChat();
    spyOnProperty(chatSessionWithNoArgs, 'token', 'get').and.resolveTo(
      TEST_TOKEN
    );
    chatSessionWithEmptyResponse = model.startChat();
    spyOnProperty(chatSessionWithEmptyResponse, 'token', 'get').and.resolveTo(
      TEST_TOKEN
    );
    chatSessionWithFunctionCall = model.startChat({
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    });
    spyOnProperty(chatSessionWithFunctionCall, 'token', 'get').and.resolveTo(
      TEST_TOKEN
    );
    expectedStreamResult = {
      response: Promise.resolve(TEST_MODEL_RESPONSE),
      stream: testGenerator(),
    };
    const fetchResult = Promise.resolve(
      new Response(JSON.stringify(expectedStreamResult), fetchResponseObj)
    );
    spyOn(global, 'fetch').and.returnValue(fetchResult);
  });

  describe('sendMessage', () => {
    it('returns a GenerateContentResponse and appends to history', async () => {
      const req = 'How are you doing today?';
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
      const resp = await chatSession.sendMessage(req);
      expect(resp).toEqual(expectedResult);
      expect(chatSession.history.length).toEqual(3);
    });
    it('send timeout to functions', async () => {
      const modelWithRequestOptions = new GenerativeModel({
        model: 'gemini-pro',
        project: PROJECT,
        location: LOCATION,
        googleAuth: googleAuth,
        requestOptions: TEST_REQUEST_OPTIONS,
      });
      const chatSessionWithRequestOptions = modelWithRequestOptions.startChat({
        history: TEST_USER_CHAT_MESSAGE,
      });
      const req = 'How are you doing today?';
      const generateContentSpy: jasmine.Spy = spyOn(
        GenerateContentFunctions,
        'generateContent'
      ).and.resolveTo({
        response: TEST_MODEL_RESPONSE,
      });
      spyOnProperty(
        chatSessionWithRequestOptions,
        'token',
        'get'
      ).and.resolveTo(TEST_TOKEN);
      await chatSessionWithRequestOptions.sendMessage(req);
      expect(chatSessionWithRequestOptions.requestOptions).toEqual(
        TEST_REQUEST_OPTIONS
      );
      expect(generateContentSpy.calls.allArgs()[0][8].timeoutMillis).toEqual(0);
    });

    it('returns a GenerateContentResponse and appends to history when startChat is passed with no args', async () => {
      const req = 'How are you doing today?';
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
      const resp = await chatSessionWithNoArgs.sendMessage(req);
      expect(resp).toEqual(expectedResult);
      expect(chatSessionWithNoArgs.history.length).toEqual(2);
    });

    it('throws an error when the model returns an empty response', async () => {
      const req = 'How are you doing today?';
      const expectedResult: GenerateContentResult = {
        response: TEST_EMPTY_MODEL_RESPONSE,
      };
      spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
      await expectAsync(
        chatSessionWithEmptyResponse.sendMessage(req)
      ).toBeRejected();
      expect(chatSessionWithEmptyResponse.history.length).toEqual(0);
    });
    it('returns a GenerateContentResponse when passed multi-part content', async () => {
      const req = TEST_MULTIPART_MESSAGE[0]['parts'];
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
      const resp = await chatSessionWithNoArgs.sendMessage(req);
      expect(resp).toEqual(expectedResult);
      console.log(chatSessionWithNoArgs.history, 'hihii');
      expect(chatSessionWithNoArgs.history.length).toEqual(2);
    });
    it('returns a FunctionCall and appends to history when passed a FunctionDeclaration', async () => {
      const functionCallChatMessage = 'What is the weather in LA?';
      const expectedFunctionCallResponse: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE_WITH_FUNCTION_CALL,
      };
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE_WITH_FUNCTION_CALL,
      };

      const streamSpy = spyOn(StreamFunctions, 'processNonStream');

      streamSpy.and.resolveTo(expectedResult);
      const response1 = await chatSessionWithFunctionCall.sendMessage(
        functionCallChatMessage
      );
      expect(response1).toEqual(expectedFunctionCallResponse);
      expect(chatSessionWithFunctionCall.history.length).toEqual(2);

      // Send a follow-up message with a FunctionResponse
      const expectedFollowUpResponse: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      const expectedFollowUpResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      streamSpy.and.resolveTo(expectedFollowUpResult);
      const response2 = await chatSessionWithFunctionCall.sendMessage(
        TEST_FUNCTION_RESPONSE_PART
      );
      expect(response2).toEqual(expectedFollowUpResponse);
      expect(chatSessionWithFunctionCall.history.length).toEqual(4);
    });

    it('throw ClientError when request has no content', async () => {
      const expectedErrorMessage =
        '[VertexAI.ClientError]: No content is provided for sending chat message.';
      await chatSessionWithNoArgs.sendMessage([]).catch(e => {
        expect(e.message).toEqual(expectedErrorMessage);
      });
    });

    it('throw ClientError when request mix functionCall part with other types of part', async () => {
      const chatRequest = [
        'what is the weather like in LA',
        TEST_FUNCTION_RESPONSE_PART[0],
      ];
      const expectedErrorMessage =
        '[VertexAI.ClientError]: Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message.';
      await chatSessionWithNoArgs.sendMessage(chatRequest).catch(e => {
        expect(e.message).toEqual(expectedErrorMessage);
      });
    });
  });

  describe('sendMessageStream', () => {
    it('returns a StreamGenerateContentResponse and appends to history', async () => {
      const req = 'How are you doing today?';
      const expectedResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGenerator(),
      };
      const chatSession = model.startChat({
        history: [
          {
            role: constants.USER_ROLE,
            parts: [{text: 'How are you doing today?'}],
          },
        ],
      });
      spyOnProperty(chatSession, 'token', 'get').and.resolveTo(TEST_TOKEN);
      spyOn(StreamFunctions, 'processStream').and.resolveTo(expectedResult);
      expect(chatSession.history.length).toEqual(1);
      expect(chatSession.history[0].role).toEqual(constants.USER_ROLE);
      const result = await chatSession.sendMessageStream(req);
      const response = await result.response;
      const expectedResponse = await expectedResult.response;
      expect(response).toEqual(expectedResponse);
      expect(chatSession.history.length).toEqual(3);
      expect(chatSession.history[0].role).toEqual(constants.USER_ROLE);
      expect(chatSession.history[1].role).toEqual(constants.USER_ROLE);
      expect(chatSession.history[2].role).toEqual(constants.MODEL_ROLE);
    });
    it('send timeout to functions', async () => {
      const modelWithRequestOptions = new GenerativeModel({
        model: 'gemini-pro',
        project: PROJECT,
        location: LOCATION,
        googleAuth: googleAuth,
        requestOptions: TEST_REQUEST_OPTIONS,
      });
      const chatSessionWithRequestOptions = modelWithRequestOptions.startChat({
        history: TEST_USER_CHAT_MESSAGE,
      });
      const req = 'How are you doing today?';
      const generateContentSpy: jasmine.Spy = spyOn(
        GenerateContentFunctions,
        'generateContentStream'
      ).and.resolveTo({
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGenerator(),
      });
      spyOnProperty(
        chatSessionWithRequestOptions,
        'token',
        'get'
      ).and.resolveTo(TEST_TOKEN);
      await chatSessionWithRequestOptions.sendMessageStream(req);
      expect(chatSessionWithRequestOptions.requestOptions).toEqual(
        TEST_REQUEST_OPTIONS
      );
      expect(generateContentSpy.calls.allArgs()[0][8].timeoutMillis).toEqual(0);
    });
    it('returns a StreamGenerateContentResponse and appends role if missing', async () => {
      const req = 'How are you doing today?';
      const expectedResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE_MISSING_ROLE),
        stream: testGenerator(),
      };
      const chatSession = model.startChat({
        history: [
          {
            role: constants.USER_ROLE,
            parts: [{text: 'How are you doing today?'}],
          },
        ],
      });
      spyOnProperty(chatSession, 'token', 'get').and.resolveTo(TEST_TOKEN);
      spyOn(StreamFunctions, 'processStream').and.resolveTo(expectedResult);
      expect(chatSession.history.length).toEqual(1);
      expect(chatSession.history[0].role).toEqual(constants.USER_ROLE);
      const result = await chatSession.sendMessageStream(req);
      const response = await result.response;
      const expectedResponse = await expectedResult.response;
      expect(response).toEqual(expectedResponse);
      expect(chatSession.history.length).toEqual(3);
      expect(chatSession.history[0].role).toEqual(constants.USER_ROLE);
      expect(chatSession.history[1].role).toEqual(constants.USER_ROLE);
      expect(chatSession.history[2].role).toEqual(constants.MODEL_ROLE);
    });

    it('returns a FunctionCall and appends to history when passed a FunctionDeclaration', async () => {
      const functionCallChatMessage = 'What is the weather in LA?';
      const expectedStreamResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE_WITH_FUNCTION_CALL),
        stream: testGenerator(),
      };

      const streamSpy = spyOn(StreamFunctions, 'processStream');

      streamSpy.and.resolveTo(expectedStreamResult);
      const response1 = await chatSessionWithFunctionCall.sendMessageStream(
        functionCallChatMessage
      );
      expect(response1).toEqual(expectedStreamResult);
      expect(chatSessionWithFunctionCall.history.length).toEqual(2);

      // Send a follow-up message with a FunctionResponse
      const expectedFollowUpStreamResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGenerator(),
      };
      streamSpy.and.resolveTo(expectedFollowUpStreamResult);
      const response2 = await chatSessionWithFunctionCall.sendMessageStream(
        TEST_FUNCTION_RESPONSE_PART
      );
      expect(response2).toEqual(expectedFollowUpStreamResult);
      expect(chatSessionWithFunctionCall.history.length).toEqual(4);
    });

    it('throw ClientError when request has no content', async () => {
      const expectedErrorMessage =
        '[VertexAI.ClientError]: No content is provided for sending chat message.';
      await chatSessionWithNoArgs.sendMessageStream([]).catch(e => {
        expect(e.message).toEqual(expectedErrorMessage);
      });
    });

    it('throw ClientError when request mix functionCall part with other types of part', async () => {
      const chatRequest = [
        'what is the weather like in LA',
        TEST_FUNCTION_RESPONSE_PART[0],
      ];
      const expectedErrorMessage =
        '[VertexAI.ClientError]: Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message.';
      await chatSessionWithNoArgs.sendMessageStream(chatRequest).catch(e => {
        expect(e.message).toEqual(expectedErrorMessage);
      });
    });
  });
});

describe('ChatSessionPreview', () => {
  let chatSession: ChatSessionPreview;
  let chatSessionWithNoArgs: ChatSessionPreview;
  let chatSessionWithEmptyResponse: ChatSessionPreview;
  let chatSessionWithFunctionCall: ChatSessionPreview;
  let model: GenerativeModelPreview;
  let expectedStreamResult: StreamGenerateContentResult;

  beforeEach(() => {
    model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: googleAuth,
    });
    chatSession = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
    });
    spyOnProperty(chatSession, 'token', 'get').and.resolveTo(TEST_TOKEN);
    expect(chatSession.history).toEqual(TEST_USER_CHAT_MESSAGE);
    chatSessionWithNoArgs = model.startChat();
    spyOnProperty(chatSessionWithNoArgs, 'token', 'get').and.resolveTo(
      TEST_TOKEN
    );
    chatSessionWithEmptyResponse = model.startChat();
    spyOnProperty(chatSessionWithEmptyResponse, 'token', 'get').and.resolveTo(
      TEST_TOKEN
    );
    chatSessionWithFunctionCall = model.startChat({
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    });
    spyOnProperty(chatSessionWithFunctionCall, 'token', 'get').and.resolveTo(
      TEST_TOKEN
    );
    expectedStreamResult = {
      response: Promise.resolve(TEST_MODEL_RESPONSE),
      stream: testGenerator(),
    };
    const fetchResult = Promise.resolve(
      new Response(JSON.stringify(expectedStreamResult), fetchResponseObj)
    );
    spyOn(global, 'fetch').and.returnValue(fetchResult);
  });

  describe('sendMessage', () => {
    it('returns a GenerateContentResponse and appends to history', async () => {
      const req = 'How are you doing today?';
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
      const resp = await chatSession.sendMessage(req);
      expect(resp).toEqual(expectedResult);
      expect(chatSession.history.length).toEqual(3);
    });

    it('send timeout to functions', async () => {
      const modelWithRequestOptions = new GenerativeModelPreview({
        model: 'gemini-pro',
        project: PROJECT,
        location: LOCATION,
        googleAuth: googleAuth,
        requestOptions: TEST_REQUEST_OPTIONS,
      });
      const chatSessionWithRequestOptions = modelWithRequestOptions.startChat({
        history: TEST_USER_CHAT_MESSAGE,
      });
      const req = 'How are you doing today?';
      const generateContentSpy: jasmine.Spy = spyOn(
        GenerateContentFunctions,
        'generateContent'
      ).and.resolveTo({
        response: TEST_MODEL_RESPONSE,
      });
      spyOnProperty(
        chatSessionWithRequestOptions,
        'token',
        'get'
      ).and.resolveTo(TEST_TOKEN);
      await chatSessionWithRequestOptions.sendMessage(req);
      expect(chatSessionWithRequestOptions.requestOptions).toEqual(
        TEST_REQUEST_OPTIONS
      );
      expect(generateContentSpy.calls.allArgs()[0][8].timeoutMillis).toEqual(0);
    });

    it('returns a GenerateContentResponse and appends to history when startChat is passed with no args', async () => {
      const req = 'How are you doing today?';
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
      const resp = await chatSessionWithNoArgs.sendMessage(req);
      expect(resp).toEqual(expectedResult);
      expect(chatSessionWithNoArgs.history.length).toEqual(2);
    });

    it('throws an error when the model returns an empty response', async () => {
      const req = 'How are you doing today?';
      const expectedResult: GenerateContentResult = {
        response: TEST_EMPTY_MODEL_RESPONSE,
      };
      spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
      await expectAsync(
        chatSessionWithEmptyResponse.sendMessage(req)
      ).toBeRejected();
      expect(chatSessionWithEmptyResponse.history.length).toEqual(0);
    });
    it('returns a GenerateContentResponse when passed multi-part content', async () => {
      const req = TEST_MULTIPART_MESSAGE[0]['parts'];
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      spyOn(StreamFunctions, 'processNonStream').and.resolveTo(expectedResult);
      const resp = await chatSessionWithNoArgs.sendMessage(req);
      expect(resp).toEqual(expectedResult);
      console.log(chatSessionWithNoArgs.history, 'hihii');
      expect(chatSessionWithNoArgs.history.length).toEqual(2);
    });
    it('returns a FunctionCall and appends to history when passed a FunctionDeclaration', async () => {
      const functionCallChatMessage = 'What is the weather in LA?';
      const expectedFunctionCallResponse: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE_WITH_FUNCTION_CALL,
      };
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE_WITH_FUNCTION_CALL,
      };

      const streamSpy = spyOn(StreamFunctions, 'processNonStream');

      streamSpy.and.resolveTo(expectedResult);
      const response1 = await chatSessionWithFunctionCall.sendMessage(
        functionCallChatMessage
      );
      expect(response1).toEqual(expectedFunctionCallResponse);
      expect(chatSessionWithFunctionCall.history.length).toEqual(2);

      // Send a follow-up message with a FunctionResponse
      const expectedFollowUpResponse: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      const expectedFollowUpResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      streamSpy.and.resolveTo(expectedFollowUpResult);
      const response2 = await chatSessionWithFunctionCall.sendMessage(
        TEST_FUNCTION_RESPONSE_PART
      );
      expect(response2).toEqual(expectedFollowUpResponse);
      expect(chatSessionWithFunctionCall.history.length).toEqual(4);
    });

    it('throw ClientError when request has no content', async () => {
      const expectedErrorMessage =
        '[VertexAI.ClientError]: No content is provided for sending chat message.';
      await chatSessionWithNoArgs.sendMessage([]).catch(e => {
        expect(e.message).toEqual(expectedErrorMessage);
      });
    });

    it('throw ClientError when request mix functionCall part with other types of part', async () => {
      const chatRequest = [
        'what is the weather like in LA',
        TEST_FUNCTION_RESPONSE_PART[0],
      ];
      const expectedErrorMessage =
        '[VertexAI.ClientError]: Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message.';
      await chatSessionWithNoArgs.sendMessage(chatRequest).catch(e => {
        expect(e.message).toEqual(expectedErrorMessage);
      });
    });
  });

  describe('sendMessageStream', () => {
    it('returns a StreamGenerateContentResponse and appends to history', async () => {
      const req = 'How are you doing today?';
      const expectedResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGenerator(),
      };
      const chatSession = model.startChat({
        history: [
          {
            role: constants.USER_ROLE,
            parts: [{text: 'How are you doing today?'}],
          },
        ],
      });
      spyOnProperty(chatSession, 'token', 'get').and.resolveTo(TEST_TOKEN);
      spyOn(StreamFunctions, 'processStream').and.resolveTo(expectedResult);
      expect(chatSession.history.length).toEqual(1);
      expect(chatSession.history[0].role).toEqual(constants.USER_ROLE);
      const result = await chatSession.sendMessageStream(req);
      const response = await result.response;
      const expectedResponse = await expectedResult.response;
      expect(response).toEqual(expectedResponse);
      expect(chatSession.history.length).toEqual(3);
      expect(chatSession.history[0].role).toEqual(constants.USER_ROLE);
      expect(chatSession.history[1].role).toEqual(constants.USER_ROLE);
      expect(chatSession.history[2].role).toEqual(constants.MODEL_ROLE);
    });
    it('send timeout to functions', async () => {
      const modelWithRequestOptions = new GenerativeModelPreview({
        model: 'gemini-pro',
        project: PROJECT,
        location: LOCATION,
        googleAuth: googleAuth,
        requestOptions: TEST_REQUEST_OPTIONS,
      });
      const chatSessionWithRequestOptions = modelWithRequestOptions.startChat({
        history: TEST_USER_CHAT_MESSAGE,
      });
      const req = 'How are you doing today?';
      const generateContentSpy: jasmine.Spy = spyOn(
        GenerateContentFunctions,
        'generateContentStream'
      ).and.resolveTo({
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGenerator(),
      });
      spyOnProperty(
        chatSessionWithRequestOptions,
        'token',
        'get'
      ).and.resolveTo(TEST_TOKEN);
      await chatSessionWithRequestOptions.sendMessageStream(req);
      expect(chatSessionWithRequestOptions.requestOptions).toEqual(
        TEST_REQUEST_OPTIONS
      );
      expect(generateContentSpy.calls.allArgs()[0][8].timeoutMillis).toEqual(0);
    });
    it('returns a StreamGenerateContentResponse and appends role if missing', async () => {
      const req = 'How are you doing today?';
      const expectedResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE_MISSING_ROLE),
        stream: testGenerator(),
      };
      const chatSession = model.startChat({
        history: [
          {
            role: constants.USER_ROLE,
            parts: [{text: 'How are you doing today?'}],
          },
        ],
      });
      spyOnProperty(chatSession, 'token', 'get').and.resolveTo(TEST_TOKEN);
      spyOn(StreamFunctions, 'processStream').and.resolveTo(expectedResult);
      expect(chatSession.history.length).toEqual(1);
      expect(chatSession.history[0].role).toEqual(constants.USER_ROLE);
      const result = await chatSession.sendMessageStream(req);
      const response = await result.response;
      const expectedResponse = await expectedResult.response;
      expect(response).toEqual(expectedResponse);
      expect(chatSession.history.length).toEqual(3);
      expect(chatSession.history[0].role).toEqual(constants.USER_ROLE);
      expect(chatSession.history[1].role).toEqual(constants.USER_ROLE);
      expect(chatSession.history[2].role).toEqual(constants.MODEL_ROLE);
    });

    it('returns a FunctionCall and appends to history when passed a FunctionDeclaration', async () => {
      const functionCallChatMessage = 'What is the weather in LA?';
      const expectedStreamResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE_WITH_FUNCTION_CALL),
        stream: testGenerator(),
      };

      const streamSpy = spyOn(StreamFunctions, 'processStream');

      streamSpy.and.resolveTo(expectedStreamResult);
      const response1 = await chatSessionWithFunctionCall.sendMessageStream(
        functionCallChatMessage
      );
      expect(response1).toEqual(expectedStreamResult);
      expect(chatSessionWithFunctionCall.history.length).toEqual(2);

      // Send a follow-up message with a FunctionResponse
      const expectedFollowUpStreamResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGenerator(),
      };
      streamSpy.and.resolveTo(expectedFollowUpStreamResult);
      const response2 = await chatSessionWithFunctionCall.sendMessageStream(
        TEST_FUNCTION_RESPONSE_PART
      );
      expect(response2).toEqual(expectedFollowUpStreamResult);
      expect(chatSessionWithFunctionCall.history.length).toEqual(4);
    });

    it('throw ClientError when request has no content', async () => {
      const expectedErrorMessage =
        '[VertexAI.ClientError]: No content is provided for sending chat message.';
      await chatSessionWithNoArgs.sendMessageStream([]).catch(e => {
        expect(e.message).toEqual(expectedErrorMessage);
      });
    });

    it('throw ClientError when request mix functionCall part with other types of part', async () => {
      const chatRequest = [
        'what is the weather like in LA',
        TEST_FUNCTION_RESPONSE_PART[0],
      ];
      const expectedErrorMessage =
        '[VertexAI.ClientError]: Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message.';
      await chatSessionWithNoArgs.sendMessageStream(chatRequest).catch(e => {
        expect(e.message).toEqual(expectedErrorMessage);
      });
    });
  });
});

describe('GenerativeModel countTokens', () => {
  it('returns the token count', async () => {
    const model = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: googleAuth,
    });
    spyOnProperty(model, 'token', 'get').and.resolveTo(TEST_TOKEN);
    const req: CountTokensRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const responseBody = {
      totalTokens: 1,
    };
    const response = new Response(
      JSON.stringify(responseBody),
      fetchResponseObj
    );
    spyOn(global, 'fetch').and.resolveTo(response);
    const resp = await model.countTokens(req);
    expect(resp).toEqual(responseBody);
  });
  it('send timeout to functions', async () => {
    const model = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: googleAuth,
      requestOptions: TEST_REQUEST_OPTIONS,
    });
    spyOnProperty(model, 'token', 'get').and.resolveTo(TEST_TOKEN);
    const req: CountTokensRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const countTokenSpy = spyOn(CountTokensFunctions, 'countTokens');
    await model.countTokens(req);
    // @ts-ignore
    expect(countTokenSpy.calls.allArgs()[0][6].timeoutMillis).toEqual(0);
  });
});

describe('GenerativeModelPreview countTokens', () => {
  it('returns the token count', async () => {
    const model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: googleAuth,
    });
    spyOnProperty(model, 'token', 'get').and.resolveTo(TEST_TOKEN);
    const req: CountTokensRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const responseBody = {
      totalTokens: 1,
    };
    const response = new Response(
      JSON.stringify(responseBody),
      fetchResponseObj
    );
    spyOn(global, 'fetch').and.resolveTo(response);
    const resp = await model.countTokens(req);
    expect(resp).toEqual(responseBody);
  });
  it('send timeout to functions', async () => {
    const model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: googleAuth,
      requestOptions: TEST_REQUEST_OPTIONS,
    });
    spyOnProperty(model, 'token', 'get').and.resolveTo(TEST_TOKEN);
    const req: CountTokensRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const countTokenSpy = spyOn(CountTokensFunctions, 'countTokens');
    await model.countTokens(req);
    // @ts-ignore
    expect(countTokenSpy.calls.allArgs()[0][6].timeoutMillis).toEqual(0);
  });
});

describe('GenerativeModel when exception at fetch', () => {
  const model = new GenerativeModel({
    model: 'gemini-pro',
    project: PROJECT,
    location: LOCATION,
    googleAuth: googleAuth,
  });
  const chatSession = model.startChat();
  const message = 'hi';
  const req: GenerateContentRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  const countTokenReq: CountTokensRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  beforeEach(() => {
    spyOnProperty(model, 'token', 'get').and.resolveTo(TEST_TOKEN);
    spyOnProperty(chatSession, 'token', 'get').and.resolveTo(TEST_TOKEN);
    spyOn(global, 'fetch').and.throwError('error');
  });

  it('generateContent should throw GoogleGenerativeAI error', async () => {
    await expectAsync(model.generateContent(req)).toBeRejected();
  });

  it('generateContentStream should throw GoogleGenerativeAI error', async () => {
    await expectAsync(model.generateContentStream(req)).toBeRejected();
  });

  it('sendMessage should throw GoogleGenerativeAI error', async () => {
    await expectAsync(chatSession.sendMessage(message)).toBeRejected();
  });

  it('countTokens should throw GoogleGenerativeAI error', async () => {
    await expectAsync(model.countTokens(countTokenReq)).toBeRejected();
  });
});

describe('GenerativeModelPreview when exception at fetch', () => {
  const model = new GenerativeModelPreview({
    model: 'gemini-pro',
    project: PROJECT,
    location: LOCATION,
    googleAuth: googleAuth,
  });
  const chatSession = model.startChat();
  const message = 'hi';
  const req: GenerateContentRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  const countTokenReq: CountTokensRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  beforeEach(() => {
    spyOnProperty(model, 'token', 'get').and.resolveTo(TEST_TOKEN);
    spyOnProperty(chatSession, 'token', 'get').and.resolveTo(TEST_TOKEN);
    spyOn(global, 'fetch').and.throwError('error');
  });

  it('generateContent should throw GoogleGenerativeAI error', async () => {
    await expectAsync(model.generateContent(req)).toBeRejected();
  });

  it('generateContentStream should throw GoogleGenerativeAI error', async () => {
    await expectAsync(model.generateContentStream(req)).toBeRejected();
  });

  it('sendMessage should throw GoogleGenerativeAI error', async () => {
    await expectAsync(chatSession.sendMessage(message)).toBeRejected();
  });

  it('countTokens should throw GoogleGenerativeAI error', async () => {
    await expectAsync(model.countTokens(countTokenReq)).toBeRejected();
  });
});

describe('GenerativeModel when response is undefined', () => {
  const expectedErrorMessage =
    '[VertexAI.GoogleGenerativeAIError]: response is undefined';
  const model = new GenerativeModel({
    model: 'gemini-pro',
    project: PROJECT,
    location: LOCATION,
    googleAuth: googleAuth,
  });
  const req: GenerateContentRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  const message = 'hi';
  const chatSession = model.startChat();
  const countTokenReq: CountTokensRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  beforeEach(() => {
    spyOn(global, 'fetch').and.resolveTo();
    spyOnProperty(model, 'token', 'get').and.resolveTo(TEST_TOKEN);
    spyOnProperty(chatSession, 'token', 'get').and.resolveTo(TEST_TOKEN);
  });

  it('generateContent should throw GoogleGenerativeAI error', async () => {
    await expectAsync(model.generateContent(req)).toBeRejected();
    await model.generateContent(req).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });

  it('generateContentStream should throw GoogleGenerativeAI error', async () => {
    await expectAsync(model.generateContentStream(req)).toBeRejected();
    await model.generateContentStream(req).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });

  it('sendMessage should throw GoogleGenerativeAI error', async () => {
    await expectAsync(chatSession.sendMessage(message)).toBeRejected();
    await chatSession.sendMessage(message).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });

  it('countTokens should throw GoogleGenerativeAI error', async () => {
    await expectAsync(model.countTokens(countTokenReq)).toBeRejected();
    await model.countTokens(countTokenReq).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });
});

describe('GenerativeModelPreview when response is undefined', () => {
  const expectedErrorMessage =
    '[VertexAI.GoogleGenerativeAIError]: response is undefined';
  const model = new GenerativeModelPreview({
    model: 'gemini-pro',
    project: PROJECT,
    location: LOCATION,
    googleAuth: googleAuth,
  });
  const req: GenerateContentRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  const message = 'hi';
  const chatSession = model.startChat();
  const countTokenReq: CountTokensRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  beforeEach(() => {
    spyOn(global, 'fetch').and.resolveTo();
    spyOnProperty(model, 'token', 'get').and.resolveTo(TEST_TOKEN);
    spyOnProperty(chatSession, 'token', 'get').and.resolveTo(TEST_TOKEN);
  });

  it('generateContent should throw GoogleGenerativeAI error', async () => {
    await expectAsync(model.generateContent(req)).toBeRejected();
    await model.generateContent(req).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });

  it('generateContentStream should throw GoogleGenerativeAI error', async () => {
    await expectAsync(model.generateContentStream(req)).toBeRejected();
    await model.generateContentStream(req).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });

  it('sendMessage should throw GoogleGenerativeAI error', async () => {
    await expectAsync(chatSession.sendMessage(message)).toBeRejected();
    await chatSession.sendMessage(message).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });

  it('countTokens should throw GoogleGenerativeAI error', async () => {
    await expectAsync(model.countTokens(countTokenReq)).toBeRejected();
    await model.countTokens(countTokenReq).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });
});

describe('GeneratvieModel when response is 4XX', () => {
  const expectedErrorMessage =
    '[VertexAI.ClientError]: got status: 400 Bad Request. {"code":400,"message":"request is invalid","status":"INVALID_ARGUMENT"}';
  const req: GenerateContentRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
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
  const model = new GenerativeModel({
    model: 'gemini-pro',
    project: PROJECT,
    location: LOCATION,
    googleAuth: googleAuth,
  });
  const message = 'hi';
  const chatSession = model.startChat();
  const countTokenReq: CountTokensRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  beforeEach(() => {
    spyOnProperty(model, 'token', 'get').and.resolveTo(TEST_TOKEN);
    spyOnProperty(chatSession, 'token', 'get').and.resolveTo(TEST_TOKEN);
    spyOn(global, 'fetch').and.resolveTo(response);
  });

  it('generateContent should throw ClientError error', async () => {
    await expectAsync(model.generateContent(req)).toBeRejected();
    // TODO: update jasmine version or use flush to uncomment
    // await model.generateContent(req).catch(e => {
    //   expect(e.message).toEqual(expectedErrorMessage);
    // });
  });

  it('generateContentStream should throw ClientError error', async () => {
    await expectAsync(model.generateContentStream(req)).toBeRejected();
    // TODO: update jasmine version or use flush to uncomment
    // await model.generateContentStream(req).catch(e => {
    //   expect(e.message).toEqual(expectedErrorMessage);
    // });
  });

  it('sendMessage should throw ClientError error', async () => {
    await expectAsync(chatSession.sendMessage(message)).toBeRejected();
    // TODO: update jasmine version or use flush to uncomment
    // await chatSession.sendMessage(message).catch(e => {
    //   expect(e.message).toEqual(expectedErrorMessage);
    // });
  });

  it('countTokens should throw ClientError error', async () => {
    await expectAsync(model.countTokens(countTokenReq)).toBeRejected();
    // TODO: update jasmine version or use flush to uncomment
    // await model.countTokens(countTokenReq).catch(e => {
    //   expect(e.message).toEqual(expectedErrorMessage);
    // });
  });
});

describe('GeneratvieModelPreview when response is 4XX', () => {
  const expectedErrorMessage =
    '[VertexAI.ClientError]: got status: 400 Bad Request. {"code":400,"message":"request is invalid","status":"INVALID_ARGUMENT"}';
  const req: GenerateContentRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
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
  const model = new GenerativeModelPreview({
    model: 'gemini-pro',
    project: PROJECT,
    location: LOCATION,
    googleAuth: googleAuth,
  });
  const message = 'hi';
  const chatSession = model.startChat();
  const countTokenReq: CountTokensRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  beforeEach(() => {
    spyOnProperty(model, 'token', 'get').and.resolveTo(TEST_TOKEN);
    spyOnProperty(chatSession, 'token', 'get').and.resolveTo(TEST_TOKEN);
    spyOn(global, 'fetch').and.resolveTo(response);
  });

  it('generateContent should throw ClientError error', async () => {
    await expectAsync(model.generateContent(req)).toBeRejected();
    // TODO: update jasmine version or use flush to uncomment
    // await model.generateContent(req).catch(e => {
    //   expect(e.message).toEqual(expectedErrorMessage);
    // });
  });

  it('generateContentStream should throw ClientError error', async () => {
    await expectAsync(model.generateContentStream(req)).toBeRejected();
    // TODO: update jasmine version or use flush to uncomment
    // await model.generateContentStream(req).catch(e => {
    //   expect(e.message).toEqual(expectedErrorMessage);
    // });
  });

  it('sendMessage should throw ClientError error', async () => {
    await expectAsync(chatSession.sendMessage(message)).toBeRejected();
    // TODO: update jasmine version or use flush to uncomment
    // await chatSession.sendMessage(message).catch(e => {
    //   expect(e.message).toEqual(expectedErrorMessage);
    // });
  });

  it('countTokens should throw ClientError error', async () => {
    await expectAsync(model.countTokens(countTokenReq)).toBeRejected();
    // TODO: update jasmine version or use flush to uncomment
    // await model.countTokens(countTokenReq).catch(e => {
    //   expect(e.message).toEqual(expectedErrorMessage);
    // });
  });
});

describe('GenerativeModel when response is not OK and not 4XX', () => {
  const expectedErrorMessage =
    '[VertexAI.GoogleGenerativeAIError]: got status: 500 Internal Server Error. {"code":500,"message":"service is having downtime","status":"INTERNAL_SERVER_ERROR"}';
  const req: GenerateContentRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
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
  const model = new GenerativeModel({
    model: 'gemini-pro',
    project: PROJECT,
    location: LOCATION,
    googleAuth: googleAuth,
  });
  const message = 'hi';
  const chatSession = model.startChat();
  const countTokenReq: CountTokensRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  beforeEach(() => {
    spyOnProperty(model, 'token', 'get').and.resolveTo(TEST_TOKEN);
    spyOnProperty(chatSession, 'token', 'get').and.resolveTo(TEST_TOKEN);
    spyOn(global, 'fetch').and.resolveTo(response);
  });

  it('generateContent should throws GoogleGenerativeAIError', async () => {
    await expectAsync(model.generateContent(req)).toBeRejected();
    // TODO: update jasmine version or use flush to uncomment
    // await model.generateContent(req).catch(e => {
    //   expect(e.message).toEqual(expectedErrorMessage);
    // });
  });

  it('generateContentStream should throws GoogleGenerativeAIError', async () => {
    await expectAsync(model.generateContentStream(req)).toBeRejected();
    // TODO: update jasmine version or use flush to uncomment
    // await model.generateContentStream(req).catch(e => {
    //   expect(e.message).toEqual(expectedErrorMessage);
    // });
  });

  it('sendMessage should throws GoogleGenerativeAIError', async () => {
    await expectAsync(chatSession.sendMessage(message)).toBeRejected();
    // TODO: update jasmine version or use flush to uncomment
    // await chatSession.sendMessage(message).catch(e => {
    //   expect(e.message).toEqual(expectedErrorMessage);
    // });
  });

  it('countTokens should throws GoogleGenerativeAIError', async () => {
    await expectAsync(model.countTokens(countTokenReq)).toBeRejected();
    // TODO: update jasmine version or use flush to uncomment
    // await model.countTokens(countTokenReq).catch(e => {
    //   expect(e.message).toEqual(expectedErrorMessage);
    // });
  });
});

describe('GenerativeModelPreview when response is not OK and not 4XX', () => {
  const expectedErrorMessage =
    '[VertexAI.GoogleGenerativeAIError]: got status: 500 Internal Server Error. {"code":500,"message":"service is having downtime","status":"INTERNAL_SERVER_ERROR"}';
  const req: GenerateContentRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
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
  const model = new GenerativeModelPreview({
    model: 'gemini-pro',
    project: PROJECT,
    location: LOCATION,
    googleAuth: googleAuth,
  });
  const message = 'hi';
  const chatSession = model.startChat();
  const countTokenReq: CountTokensRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  beforeEach(() => {
    spyOnProperty(model, 'token', 'get').and.resolveTo(TEST_TOKEN);
    spyOnProperty(chatSession, 'token', 'get').and.resolveTo(TEST_TOKEN);
    spyOn(global, 'fetch').and.resolveTo(response);
  });

  it('generateContent should throws GoogleGenerativeAIError', async () => {
    await expectAsync(model.generateContent(req)).toBeRejected();
    // TODO: update jasmine version or use flush to uncomment
    // await model.generateContent(req).catch(e => {
    //   expect(e.message).toEqual(expectedErrorMessage);
    // });
  });

  it('generateContentStream should throws GoogleGenerativeAIError', async () => {
    await expectAsync(model.generateContentStream(req)).toBeRejected();
    // TODO: update jasmine version or use flush to uncomment
    // await model.generateContentStream(req).catch(e => {
    //   expect(e.message).toEqual(expectedErrorMessage);
    // });
  });

  it('sendMessage should throws GoogleGenerativeAIError', async () => {
    await expectAsync(chatSession.sendMessage(message)).toBeRejected();
    // TODO: update jasmine version or use flush to uncomment
    // await chatSession.sendMessage(message).catch(e => {
    //   expect(e.message).toEqual(expectedErrorMessage);
    // });
  });

  it('countTokens should throws GoogleGenerativeAIError', async () => {
    await expectAsync(model.countTokens(countTokenReq)).toBeRejected();
    // TODO: update jasmine version or use flush to uncomment
    // await model.countTokens(countTokenReq).catch(e => {
    //   expect(e.message).toEqual(expectedErrorMessage);
    // });
  });
});
