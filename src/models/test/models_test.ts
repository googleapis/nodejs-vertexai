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
  GoogleSearchRetrievalTool,
  HarmBlockThreshold,
  HarmCategory,
  HarmProbability,
  RequestOptions,
  SafetyRating,
  SafetySetting,
  StreamGenerateContentResult,
  Tool,
} from '../../types/content';
import * as PostFetchFunctions from '../../functions/post_fetch_processing';
import * as GenerateContentFunctions from '../../functions/generate_content';
import * as CountTokensFunctions from '../../functions/count_tokens';
import {createFakeGoogleAuth} from '../../testing/fake_google_auth';

const PROJECT = 'test_project';
const LOCATION = 'test_location';
const TEST_TOKEN = 'testtoken';
const FAKE_GOOGLE_AUTH = createFakeGoogleAuth({
  scopes: 'https://www.googleapis.com/auth/cloud-platform',
  accessToken: TEST_TOKEN,
});
const TEST_CHAT_MESSSAGE_TEXT = 'How are you doing today?';
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
const TEST_CANDIDATES2 = [
  {
    index: 1,
    content: {
      role: constants.MODEL_ROLE,
      parts: [{text: 'Goodbye. Wish you the best.'}],
    },
  },
];
const TEST_MODEL_RESPONSE = {
  candidates: TEST_CANDIDATES,
  usageMetadata: {promptTokenCount: 0, candidatesTokenCount: 0},
};
const TEST_USER_CHAT_MESSAGE_WITH_GCS_FILE = [
  {
    role: constants.USER_ROLE,
    parts: [
      {text: TEST_CHAT_MESSSAGE_TEXT},
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
      {text: TEST_CHAT_MESSSAGE_TEXT},
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
const TEST_GENERATION_CONFIG = {
  candidateCount: 1,
  stopSequences: ['hello'],
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
const TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL: GoogleSearchRetrievalTool[] = [
  {
    googleSearchRetrieval: {
      disableAttribution: false,
    },
  },
];
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
const fetchResponseObj = {
  status: 200,
  statusText: 'OK',
  ok: true,
  headers: {'Content-Type': 'application/json'},
  url: 'url',
};
const TEST_REQUEST_OPTIONS = {
  timeout: 0,
};
const TEST_SYSTEM_INSTRUCTION = {
  role: constants.SYSTEM_ROLE,
  parts: [{text: 'system instruction'}],
};
const TEST_SYSTEM_INSTRUCTION_1 = {
  role: constants.SYSTEM_ROLE,
  parts: [{text: 'system instruction1'}],
};
const TEST_SYSTEM_INSTRUCTION_WRONG_ROLE = {
  role: 'WRONG_ROLE',
  parts: [{text: 'system instruction'}],
};
async function* testGenerator(): AsyncGenerator<GenerateContentResponse> {
  yield {
    candidates: TEST_CANDIDATES,
  };
}
const DATE_NOW_PRECISION_MILLIS = 2;
async function* testGeneratorMultiStream(): AsyncGenerator<GenerateContentResponse> {
  yield {
    candidates: TEST_CANDIDATES,
  };
  await new Promise(resolve => setTimeout(resolve, 200));
  yield {
    candidates: TEST_CANDIDATES2,
  };
}

class ChatSessionForTest extends ChatSession {
  public override readonly requestOptions?: RequestOptions;
}

class ChatSessionPreviewForTest extends ChatSessionPreview {
  public override readonly requestOptions?: RequestOptions;
}

describe('GenerativeModel startChat', () => {
  it('returns ChatSession when pass no arg', () => {
    const model = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    const chat = model.startChat();

    expect(chat).toBeInstanceOf(ChatSession);
  });
  it('returns ChatSession when pass an arg', () => {
    const model = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
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
      googleAuth: FAKE_GOOGLE_AUTH,
      requestOptions: TEST_REQUEST_OPTIONS,
    });
    const chat = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
    }) as ChatSessionForTest;

    expect(chat.requestOptions).toEqual(TEST_REQUEST_OPTIONS);
  });
  it('pass tools to remote endpoint from GenerativeModel constructor', async () => {
    const expectedResult = TEST_MODEL_RESPONSE;
    const fetchResult = Promise.resolve(
      new Response(JSON.stringify(expectedResult), fetchResponseObj)
    );
    const fetchSpy = spyOn(global, 'fetch').and.returnValue(fetchResult);
    const req = 'How are you doing today?';
    const model = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    });
    const chat = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
    });
    const expectedBody =
      '{"contents":[{"role":"user","parts":[{"text":"How are you doing today?"}]},{"role":"user","parts":[{"text":"How are you doing today?"}]}],"tools":[{"googleSearchRetrieval":{"disableAttribution":false}}]}';
    await chat.sendMessage(req);
    // @ts-ignore
    const actualBody = fetchSpy.calls.allArgs()[0][1].body;
    expect(actualBody).toEqual(expectedBody);
  });
  it('pass tools to remote endpoint from startChat', async () => {
    const expectedResult = TEST_MODEL_RESPONSE;
    const fetchResult = Promise.resolve(
      new Response(JSON.stringify(expectedResult), fetchResponseObj)
    );
    const fetchSpy = spyOn(global, 'fetch').and.returnValue(fetchResult);
    const req = 'How are you doing today?';
    const model = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    });
    const chat = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    });
    const expectedBody =
      '{"contents":[{"role":"user","parts":[{"text":"How are you doing today?"}]},{"role":"user","parts":[{"text":"How are you doing today?"}]}],"tools":[{"googleSearchRetrieval":{"disableAttribution":false}}]}';
    await chat.sendMessage(req);
    // @ts-ignore
    const actualBody = fetchSpy.calls.allArgs()[0][1].body;
    expect(actualBody).toEqual(expectedBody);
  });
  it('pass system instruction to remote endpoint from GenerativeModel constructor', async () => {
    const expectedResult = TEST_MODEL_RESPONSE;
    const fetchResult = Promise.resolve(
      new Response(JSON.stringify(expectedResult), fetchResponseObj)
    );
    const fetchSpy = spyOn(global, 'fetch').and.returnValue(fetchResult);
    const req = 'How are you doing today?';
    const model = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      systemInstruction: TEST_SYSTEM_INSTRUCTION,
    });
    const chat = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
    });
    const expectedBody =
      '{"contents":[{"role":"user","parts":[{"text":"How are you doing today?"}]},{"role":"user","parts":[{"text":"How are you doing today?"}]}],"systemInstruction":{"role":"system","parts":[{"text":"system instruction"}]}}';
    await chat.sendMessage(req);
    // @ts-ignore
    const actualBody = fetchSpy.calls.allArgs()[0][1].body;
    expect(actualBody).toEqual(
      expectedBody,
      `unit test failed in chat.sendMessage with ${actualBody} not equal to ${expectedBody}`
    );
  });
  it('pass system instruction to remote endpoint from startChat', async () => {
    const expectedResult = TEST_MODEL_RESPONSE;
    const fetchResult = Promise.resolve(
      new Response(JSON.stringify(expectedResult), fetchResponseObj)
    );
    const fetchSpy = spyOn(global, 'fetch').and.returnValue(fetchResult);
    const req = 'How are you doing today?';
    const model = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      systemInstruction: TEST_SYSTEM_INSTRUCTION_1,
    });
    const chat = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
      // this is different from constructor
      systemInstruction: TEST_SYSTEM_INSTRUCTION,
    });
    const expectedBody =
      '{"contents":[{"role":"user","parts":[{"text":"How are you doing today?"}]},{"role":"user","parts":[{"text":"How are you doing today?"}]}],"systemInstruction":{"role":"system","parts":[{"text":"system instruction"}]}}';
    await chat.sendMessage(req);
    // @ts-ignore
    const actualBody = fetchSpy.calls.allArgs()[0][1].body;
    expect(actualBody).toEqual(
      expectedBody,
      `unit test failed in chat.sendMessage with ${actualBody} not equal to ${expectedBody}`
    );
  });
  it('pass system instruction with wrong role to remote endpoint from GenerativeModel constructor', async () => {
    const expectedResult = TEST_MODEL_RESPONSE;
    const fetchResult = Promise.resolve(
      new Response(JSON.stringify(expectedResult), fetchResponseObj)
    );
    const fetchSpy = spyOn(global, 'fetch').and.returnValue(fetchResult);
    const req = 'How are you doing today?';
    const model = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      systemInstruction: TEST_SYSTEM_INSTRUCTION_WRONG_ROLE,
    });
    const chat = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
    });
    const expectedBody =
      '{"contents":[{"role":"user","parts":[{"text":"How are you doing today?"}]},{"role":"user","parts":[{"text":"How are you doing today?"}]}],"systemInstruction":{"role":"system","parts":[{"text":"system instruction"}]}}';
    await chat.sendMessage(req);
    // @ts-ignore
    const actualBody = fetchSpy.calls.allArgs()[0][1].body;
    expect(actualBody).toEqual(
      expectedBody,
      `unit test failed in chat.sendMessage with ${actualBody} not equal to ${expectedBody}`
    );
  });
  it('pass system instruction with wrong role to remote endpoint from startChat', async () => {
    const expectedResult = TEST_MODEL_RESPONSE;
    const fetchResult = Promise.resolve(
      new Response(JSON.stringify(expectedResult), fetchResponseObj)
    );
    const fetchSpy = spyOn(global, 'fetch').and.returnValue(fetchResult);
    const req = 'How are you doing today?';
    const model = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      systemInstruction: TEST_SYSTEM_INSTRUCTION_1,
    });
    const chat = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
      // this is different from constructor
      systemInstruction: TEST_SYSTEM_INSTRUCTION_WRONG_ROLE,
    });
    const expectedBody =
      '{"contents":[{"role":"user","parts":[{"text":"How are you doing today?"}]},{"role":"user","parts":[{"text":"How are you doing today?"}]}],"systemInstruction":{"role":"system","parts":[{"text":"system instruction"}]}}';
    await chat.sendMessage(req);
    // @ts-ignore
    const actualBody = fetchSpy.calls.allArgs()[0][1].body;
    expect(actualBody).toEqual(
      expectedBody,
      `unit test failed in chat.sendMessage with ${actualBody} not equal to ${expectedBody}`
    );
  });
});

describe('GenerativeModelPreview startChat', () => {
  it('returns ChatSessionPreview when pass no arg', () => {
    const model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    const chat = model.startChat();

    expect(chat).toBeInstanceOf(ChatSessionPreview);
  });
  it('returns ChatSessionPreview when pass an arg', () => {
    const model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
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
      googleAuth: FAKE_GOOGLE_AUTH,
      requestOptions: TEST_REQUEST_OPTIONS,
    });
    const chat = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
    }) as ChatSessionPreviewForTest;

    expect(chat.requestOptions).toEqual(TEST_REQUEST_OPTIONS);
  });
  it('in preview, pass tools to remote endpoint from GenerativeModelPreview constructor', async () => {
    const expectedResult = TEST_MODEL_RESPONSE;
    const fetchResult = Promise.resolve(
      new Response(JSON.stringify(expectedResult), fetchResponseObj)
    );
    const fetchSpy = spyOn(global, 'fetch').and.returnValue(fetchResult);
    const req = 'How are you doing today?';
    const model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    });
    const chat = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
    });
    const expectedBody =
      '{"contents":[{"role":"user","parts":[{"text":"How are you doing today?"}]},{"role":"user","parts":[{"text":"How are you doing today?"}]}],"tools":[{"googleSearchRetrieval":{"disableAttribution":false}}]}';
    await chat.sendMessage(req);
    // @ts-ignore
    const actualBody = fetchSpy.calls.allArgs()[0][1].body;
    expect(actualBody).toEqual(expectedBody);
  });
  it('in preview, pass tools to remote endpoint from startChat', async () => {
    const expectedResult = TEST_MODEL_RESPONSE;
    const fetchResult = Promise.resolve(
      new Response(JSON.stringify(expectedResult), fetchResponseObj)
    );
    const fetchSpy = spyOn(global, 'fetch').and.returnValue(fetchResult);
    const req = 'How are you doing today?';
    const model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    });
    const chat = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    });
    const expectedBody =
      '{"contents":[{"role":"user","parts":[{"text":"How are you doing today?"}]},{"role":"user","parts":[{"text":"How are you doing today?"}]}],"tools":[{"googleSearchRetrieval":{"disableAttribution":false}}]}';
    await chat.sendMessage(req);
    // @ts-ignore
    const actualBody = fetchSpy.calls.allArgs()[0][1].body;
    expect(actualBody).toEqual(expectedBody);
  });
  it('pass system instruction to remote endpoint from GenerativeModelPreview constructor', async () => {
    const expectedResult = TEST_MODEL_RESPONSE;
    const fetchResult = Promise.resolve(
      new Response(JSON.stringify(expectedResult), fetchResponseObj)
    );
    const fetchSpy = spyOn(global, 'fetch').and.returnValue(fetchResult);
    const req = 'How are you doing today?';
    const model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      systemInstruction: TEST_SYSTEM_INSTRUCTION,
    });
    const chat = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
    });
    const expectedBody =
      '{"contents":[{"role":"user","parts":[{"text":"How are you doing today?"}]},{"role":"user","parts":[{"text":"How are you doing today?"}]}],"systemInstruction":{"role":"system","parts":[{"text":"system instruction"}]}}';
    await chat.sendMessage(req);
    // @ts-ignore
    const actualBody = fetchSpy.calls.allArgs()[0][1].body;
    expect(actualBody).toEqual(
      expectedBody,
      `unit test failed in chat.sendMessage with ${actualBody} not equal to ${expectedBody}`
    );
  });
  it('pass system instruction to remote endpoint from startChat', async () => {
    const expectedResult = TEST_MODEL_RESPONSE;
    const fetchResult = Promise.resolve(
      new Response(JSON.stringify(expectedResult), fetchResponseObj)
    );
    const fetchSpy = spyOn(global, 'fetch').and.returnValue(fetchResult);
    const req = 'How are you doing today?';
    const model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      systemInstruction: TEST_SYSTEM_INSTRUCTION_1,
    });
    const chat = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
      // this is different from constructor
      systemInstruction: TEST_SYSTEM_INSTRUCTION,
    });
    const expectedBody =
      '{"contents":[{"role":"user","parts":[{"text":"How are you doing today?"}]},{"role":"user","parts":[{"text":"How are you doing today?"}]}],"systemInstruction":{"role":"system","parts":[{"text":"system instruction"}]}}';
    await chat.sendMessage(req);
    // @ts-ignore
    const actualBody = fetchSpy.calls.allArgs()[0][1].body;
    expect(actualBody).toEqual(
      expectedBody,
      `unit test failed in chat.sendMessage with ${actualBody} not equal to ${expectedBody}`
    );
  });
  it('pass system instruction with wrong role to remote endpoint from GenerativeModelPreview constructor', async () => {
    const expectedResult = TEST_MODEL_RESPONSE;
    const fetchResult = Promise.resolve(
      new Response(JSON.stringify(expectedResult), fetchResponseObj)
    );
    const fetchSpy = spyOn(global, 'fetch').and.returnValue(fetchResult);
    const req = 'How are you doing today?';
    const model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      systemInstruction: TEST_SYSTEM_INSTRUCTION_WRONG_ROLE,
    });
    const chat = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
    });
    const expectedBody =
      '{"contents":[{"role":"user","parts":[{"text":"How are you doing today?"}]},{"role":"user","parts":[{"text":"How are you doing today?"}]}],"systemInstruction":{"role":"system","parts":[{"text":"system instruction"}]}}';
    await chat.sendMessage(req);
    // @ts-ignore
    const actualBody = fetchSpy.calls.allArgs()[0][1].body;
    expect(actualBody).toEqual(
      expectedBody,
      `unit test failed in chat.sendMessage with ${actualBody} not equal to ${expectedBody}`
    );
  });
  it('pass system instruction with wrong role to remote endpoint from startChat', async () => {
    const expectedResult = TEST_MODEL_RESPONSE;
    const fetchResult = Promise.resolve(
      new Response(JSON.stringify(expectedResult), fetchResponseObj)
    );
    const fetchSpy = spyOn(global, 'fetch').and.returnValue(fetchResult);
    const req = 'How are you doing today?';
    const model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      systemInstruction: TEST_SYSTEM_INSTRUCTION_1,
    });
    const chat = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
      // this is different from constructor
      systemInstruction: TEST_SYSTEM_INSTRUCTION_WRONG_ROLE,
    });
    const expectedBody =
      '{"contents":[{"role":"user","parts":[{"text":"How are you doing today?"}]},{"role":"user","parts":[{"text":"How are you doing today?"}]}],"systemInstruction":{"role":"system","parts":[{"text":"system instruction"}]}}';
    await chat.sendMessage(req);
    // @ts-ignore
    const actualBody = fetchSpy.calls.allArgs()[0][1].body;
    expect(actualBody).toEqual(
      expectedBody,
      `unit test failed in chat.sendMessage with ${actualBody} not equal to ${expectedBody}`
    );
  });
});

describe('GenerativeModel generateContent', () => {
  let model: GenerativeModel;
  let fetchSpy: jasmine.Spy;
  let expectedResult: GenerateContentResponse;

  beforeEach(() => {
    model = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    expectedResult = TEST_MODEL_RESPONSE;
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
    const resp = await model.generateContent(req);
    expect(resp).toEqual(expectedResult);
  });
  it('gemini-pro model send correct resourcePath to functions', async () => {
    const modelWithShortName = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContent'
    );
    const expectedResourcePath =
      'projects/test_project/locations/test_location/publishers/google/models/gemini-pro';
    await modelWithShortName.generateContent(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][1]).toEqual(
      expectedResourcePath
    );
  });
  it('models/gemini-pro model send correct resourcePath to functions', async () => {
    const modelWithLongName = new GenerativeModel({
      model: 'models/gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContent'
    );
    const expectedResourcePath =
      'projects/test_project/locations/test_location/publishers/google/models/gemini-pro';
    await modelWithLongName.generateContent(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][1]).toEqual(
      expectedResourcePath
    );
  });
  it('projects/my-project/my-tuned-gemini-pro model send correct resourcePath to functions', async () => {
    const modelWithFullName = new GenerativeModel({
      model: 'projects/my-project/my-tuned-gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContent'
    );
    const expectedResourcePath = 'projects/my-project/my-tuned-gemini-pro';
    await modelWithFullName.generateContent(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][1]).toEqual(
      expectedResourcePath
    );
  });
  it('empty model raise ClientError', () => {
    const expectedErrorMessage =
      '[VertexAI.ClientError]: model parameter must not be empty.';
    try {
      new GenerativeModel({
        model: '',
        project: PROJECT,
        location: LOCATION,
        googleAuth: FAKE_GOOGLE_AUTH,
      });
    } catch (e) {
      // @ts-ignore
      expect(e.message).toEqual(expectedErrorMessage);
    }
  });
  it('invalid model raise ClientError', () => {
    const expectedErrorMessage =
      '[VertexAI.ClientError]: model parameter must be either a Model Garden model ID or a full resource name.';
    try {
      new GenerativeModel({
        model: 'invalid/my-tuned-mode',
        project: PROJECT,
        location: LOCATION,
        googleAuth: FAKE_GOOGLE_AUTH,
      });
    } catch (e) {
      // @ts-ignore
      expect(e.message).toEqual(expectedErrorMessage);
    }
  });
  it('send timeout options to functions', async () => {
    const modelWithRequestOptions = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      requestOptions: TEST_REQUEST_OPTIONS,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContent'
    );
    await modelWithRequestOptions.generateContent(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][8].timeout).toEqual(0);
  });
  it('set system instruction in constructor, should send system instruction to functions', async () => {
    const modelWithSystemInstruction = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      systemInstruction: TEST_SYSTEM_INSTRUCTION,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContent'
    );
    const expectedRequest = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'How are you doing today?',
            },
          ],
        },
      ],
      systemInstruction: {
        role: 'system',
        parts: [
          {
            text: 'system instruction',
          },
        ],
      },
    };
    await modelWithSystemInstruction.generateContent(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][3]).toEqual(expectedRequest);
  });
  it('set system instruction in generateContent, should send system instruction to functions', async () => {
    const modelWithSystemInstruction = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
      systemInstruction: TEST_SYSTEM_INSTRUCTION,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContent'
    );
    const expectedRequest = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'How are you doing today?',
            },
          ],
        },
      ],
      systemInstruction: {
        role: 'system',
        parts: [
          {
            text: 'system instruction',
          },
        ],
      },
    };
    await modelWithSystemInstruction.generateContent(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][3]).toEqual(expectedRequest);
  });
  it('set system instruction in constructor, wrong role, should send system instruction to functions', async () => {
    const modelWithSystemInstruction = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      systemInstruction: TEST_SYSTEM_INSTRUCTION_WRONG_ROLE,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContent'
    );
    const expectedRequest = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'How are you doing today?',
            },
          ],
        },
      ],
      systemInstruction: {
        role: 'system',
        parts: [
          {
            text: 'system instruction',
          },
        ],
      },
    };
    await modelWithSystemInstruction.generateContent(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][3]).toEqual(expectedRequest);
  });
  it('set system instruction in generateContent, wrong role, should send system instruction to functions', async () => {
    const modelWithSystemInstruction = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
      systemInstruction: TEST_SYSTEM_INSTRUCTION_WRONG_ROLE,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContent'
    );
    const expectedRequest = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'How are you doing today?',
            },
          ],
        },
      ],
      systemInstruction: {
        role: 'system',
        parts: [
          {
            text: 'system instruction',
          },
        ],
      },
    };
    await modelWithSystemInstruction.generateContent(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][3]).toEqual(expectedRequest);
  });
  it('returns a GenerateContentResponse when passed a string', async () => {
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE,
    };
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

  it('returns a GenerateContentResponse when passed safetySettings and generationConfig', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
      safetySettings: TEST_SAFETY_SETTINGS,
      generationConfig: TEST_GENERATION_CONFIG,
    };
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE,
    };
    const resp = await model.generateContent(req);
    expect(resp).toEqual(expectedResult);
  });

  it('updates the base API endpoint when provided', async () => {
    model = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      apiEndpoint: TEST_ENDPOINT_BASE_PATH,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    await model.generateContent(req);
    expect(fetchSpy.calls.allArgs()[0][0].toString()).toContain(
      TEST_ENDPOINT_BASE_PATH
    );
  });

  it('default the base API endpoint when base API not provided', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    await model.generateContent(req);
    expect(fetchSpy.calls.allArgs()[0][0].toString()).toContain(
      `${LOCATION}-aiplatform.googleapis.com`
    );
  });

  it('removes topK when it is set to 0', async () => {
    const reqWithEmptyConfigs: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE_WITH_GCS_FILE,
      generationConfig: {topK: 0},
      safetySettings: [],
    };
    await model.generateContent(reqWithEmptyConfigs);
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
    await model.generateContent(reqWithEmptyConfigs);
    const requestArgs = fetchSpy.calls.allArgs()[0][1];
    if (typeof requestArgs === 'object' && requestArgs) {
      expect(JSON.stringify(requestArgs['body'])).toContain('topK');
    }
  });

  it('aggregates citation metadata', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const resp = await model.generateContent(req);
    expect(
      resp.response.candidates![0].citationMetadata?.citations.length
    ).toEqual(
      TEST_MODEL_RESPONSE.candidates[0].citationMetadata.citations.length
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
    spyOn(PostFetchFunctions, 'processUnary').and.resolveTo(expectedResult);
    const resp = await model.generateContent(req);
    expect(resp).toEqual(expectedResult);
  });

  it('pass tools to remote endpoint when tools are passed via constructor', async () => {
    model = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    });
    const expectedBody =
      '{"contents":[{"role":"user","parts":[{"text":"How are you doing today?"}]}],"tools":[{"functionDeclarations":[{"name":"get_current_weather","description":"get weather in a given location","parameters":{"type":"OBJECT","properties":{"location":{"type":"STRING"},"unit":{"type":"STRING","enum":["celsius","fahrenheit"]}},"required":["location"]}}]}]}';
    await model.generateContent(TEST_CHAT_MESSSAGE_TEXT);
    // @ts-ignore
    const actualBody = fetchSpy.calls.allArgs()[0][1].body;
    expect(actualBody).toEqual(expectedBody);
  });
  it('pass tools to remote endpoint when tools are passed via generateContent', async () => {
    model = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    });
    const req: GenerateContentRequest = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weater like in Boston?'}]},
      ],
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    };
    const expectedBody =
      '{"contents":[{"role":"user","parts":[{"text":"What is the weater like in Boston?"}]}],"tools":[{"googleSearchRetrieval":{"disableAttribution":false}}]}';
    await model.generateContent(req);
    // @ts-ignore
    const actualBody = fetchSpy.calls.allArgs()[0][1].body;
    expect(actualBody).toEqual(expectedBody);
  });
});

describe('GenerativeModelPreview generateContent', () => {
  let model: GenerativeModelPreview;
  let fetchSpy: jasmine.Spy;
  let expectedResult: GenerateContentResponse;

  beforeEach(() => {
    model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    expectedResult = TEST_MODEL_RESPONSE;
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
    const resp = await model.generateContent(req);
    expect(resp).toEqual(expectedResult);
  });
  it('gemini-pro model send correct resourcePath to functions', async () => {
    const modelWithShortName = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContent'
    );
    const expectedResourcePath =
      'projects/test_project/locations/test_location/publishers/google/models/gemini-pro';
    await modelWithShortName.generateContent(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][1]).toEqual(
      expectedResourcePath
    );
  });
  it('models/gemini-pro model send correct resourcePath to functions', async () => {
    const modelWithLongName = new GenerativeModelPreview({
      model: 'models/gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContent'
    );
    const expectedResourcePath =
      'projects/test_project/locations/test_location/publishers/google/models/gemini-pro';
    await modelWithLongName.generateContent(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][1]).toEqual(
      expectedResourcePath
    );
  });
  it('projects/my-project/my-tuned-gemini-pro model send correct resourcePath to functions', async () => {
    const modelWithFullName = new GenerativeModelPreview({
      model: 'projects/my-project/my-tuned-gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContent'
    );
    const expectedResourcePath = 'projects/my-project/my-tuned-gemini-pro';
    await modelWithFullName.generateContent(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][1]).toEqual(
      expectedResourcePath
    );
  });
  it('empty model raise ClientError', () => {
    const expectedErrorMessage =
      '[VertexAI.ClientError]: model parameter must not be empty.';
    try {
      new GenerativeModelPreview({
        model: '',
        project: PROJECT,
        location: LOCATION,
        googleAuth: FAKE_GOOGLE_AUTH,
      });
    } catch (e) {
      // @ts-ignore
      expect(e.message).toEqual(expectedErrorMessage);
    }
  });
  it('invalid model raise ClientError', () => {
    const expectedErrorMessage =
      '[VertexAI.ClientError]: model parameter must be either a Model Garden model ID or a full resource name.';
    try {
      new GenerativeModelPreview({
        model: 'invalid/my-tuned-mode',
        project: PROJECT,
        location: LOCATION,
        googleAuth: FAKE_GOOGLE_AUTH,
      });
    } catch (e) {
      // @ts-ignore
      expect(e.message).toEqual(expectedErrorMessage);
    }
  });
  it('send timeout options to functions', async () => {
    const modelWithRequestOptions = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      requestOptions: TEST_REQUEST_OPTIONS,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContent'
    );
    await modelWithRequestOptions.generateContent(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][8].timeout).toEqual(0);
  });
  it('set system instruction in constructor, should send system instruction to functions', async () => {
    const modelWithSystemInstruction = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      systemInstruction: TEST_SYSTEM_INSTRUCTION,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContent'
    );
    const expectedRequest = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'How are you doing today?',
            },
          ],
        },
      ],
      systemInstruction: {
        role: 'system',
        parts: [
          {
            text: 'system instruction',
          },
        ],
      },
    };
    await modelWithSystemInstruction.generateContent(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][3]).toEqual(expectedRequest);
  });
  it('set system instruction in generateContent, should send system instruction to functions', async () => {
    const modelWithSystemInstruction = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
      systemInstruction: TEST_SYSTEM_INSTRUCTION,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContent'
    );
    const expectedRequest = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'How are you doing today?',
            },
          ],
        },
      ],
      systemInstruction: {
        role: 'system',
        parts: [
          {
            text: 'system instruction',
          },
        ],
      },
    };
    await modelWithSystemInstruction.generateContent(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][3]).toEqual(expectedRequest);
  });
  it('set system instruction in constructor, wrong role, should send system instruction to functions', async () => {
    const modelWithSystemInstruction = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      systemInstruction: TEST_SYSTEM_INSTRUCTION_WRONG_ROLE,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContent'
    );
    const expectedRequest = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'How are you doing today?',
            },
          ],
        },
      ],
      systemInstruction: {
        role: 'system',
        parts: [
          {
            text: 'system instruction',
          },
        ],
      },
    };
    await modelWithSystemInstruction.generateContent(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][3]).toEqual(expectedRequest);
  });
  it('set system instruction in generateContent, wrong role, should send system instruction to functions', async () => {
    const modelWithSystemInstruction = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
      systemInstruction: TEST_SYSTEM_INSTRUCTION_WRONG_ROLE,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContent'
    );
    const expectedRequest = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'How are you doing today?',
            },
          ],
        },
      ],
      systemInstruction: {
        role: 'system',
        parts: [
          {
            text: 'system instruction',
          },
        ],
      },
    };
    await modelWithSystemInstruction.generateContent(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][3]).toEqual(expectedRequest);
  });
  it('returns a GenerateContentResponse when passed a string', async () => {
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE,
    };
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

  it('returns a GenerateContentResponse when passed safetySettings and generationConfig', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
      safetySettings: TEST_SAFETY_SETTINGS,
      generationConfig: TEST_GENERATION_CONFIG,
    };
    const expectedResult: GenerateContentResult = {
      response: TEST_MODEL_RESPONSE,
    };
    const resp = await model.generateContent(req);
    expect(resp).toEqual(expectedResult);
  });

  it('updates the base API endpoint when provided', async () => {
    model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      apiEndpoint: TEST_ENDPOINT_BASE_PATH,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    await model.generateContent(req);
    expect(fetchSpy.calls.allArgs()[0][0].toString()).toContain(
      TEST_ENDPOINT_BASE_PATH
    );
  });

  it('default the base API endpoint when base API not provided', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    await model.generateContent(req);
    expect(fetchSpy.calls.allArgs()[0][0].toString()).toContain(
      `${LOCATION}-aiplatform.googleapis.com`
    );
  });

  it('removes topK when it is set to 0', async () => {
    const reqWithEmptyConfigs: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE_WITH_GCS_FILE,
      generationConfig: {topK: 0},
      safetySettings: [],
    };
    await model.generateContent(reqWithEmptyConfigs);
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
    await model.generateContent(reqWithEmptyConfigs);
    const requestArgs = fetchSpy.calls.allArgs()[0][1];
    if (typeof requestArgs === 'object' && requestArgs) {
      expect(JSON.stringify(requestArgs['body'])).toContain('topK');
    }
  });

  it('aggregates citation metadata', async () => {
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const resp = await model.generateContent(req);
    expect(
      resp.response.candidates![0].citationMetadata?.citations.length
    ).toEqual(
      TEST_MODEL_RESPONSE.candidates[0].citationMetadata.citations.length
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
    spyOn(PostFetchFunctions, 'processUnary').and.resolveTo(expectedResult);
    const resp = await model.generateContent(req);
    expect(resp).toEqual(expectedResult);
  });
  it('in preview, pass tools to remote endpoint when tools are passed via constructor', async () => {
    model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    });
    const expectedBody =
      '{"contents":[{"role":"user","parts":[{"text":"How are you doing today?"}]}],"tools":[{"functionDeclarations":[{"name":"get_current_weather","description":"get weather in a given location","parameters":{"type":"OBJECT","properties":{"location":{"type":"STRING"},"unit":{"type":"STRING","enum":["celsius","fahrenheit"]}},"required":["location"]}}]}]}';
    await model.generateContent(TEST_CHAT_MESSSAGE_TEXT);
    // @ts-ignore
    const actualBody = fetchSpy.calls.allArgs()[0][1].body;
    expect(actualBody).toEqual(expectedBody);
  });
  it('in preview, pass tools to remote endpoint when tools are passed via generateContent', async () => {
    model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    });
    const req: GenerateContentRequest = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weater like in Boston?'}]},
      ],
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    };
    const expectedBody =
      '{"contents":[{"role":"user","parts":[{"text":"What is the weater like in Boston?"}]}],"tools":[{"googleSearchRetrieval":{"disableAttribution":false}}]}';
    await model.generateContent(req);
    // @ts-ignore
    const actualBody = fetchSpy.calls.allArgs()[0][1].body;
    expect(actualBody).toEqual(expectedBody);
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
      googleAuth: FAKE_GOOGLE_AUTH,
    });

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
      stream: testGeneratorMultiStream(),
    };
    spyOn(PostFetchFunctions, 'processStream').and.resolveTo(expectedResult);
    const resp = await model.generateContentStream(req);
    let firstChunkTimestamp = 0;
    for await (const item of resp.stream) {
      if (firstChunkTimestamp === 0) {
        firstChunkTimestamp = Date.now();
      }
    }
    expect(Date.now() - firstChunkTimestamp).toBeGreaterThanOrEqual(
      200 - DATE_NOW_PRECISION_MILLIS
    );
  });
  it('gemini-pro model send correct resourcePath to functions', async () => {
    const modelWithShortName = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContentStream'
    );
    const expectedResourcePath =
      'projects/test_project/locations/test_location/publishers/google/models/gemini-pro';
    await modelWithShortName.generateContentStream(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][1]).toEqual(
      expectedResourcePath
    );
  });
  it('models/gemini-pro model send correct resourcePath to functions', async () => {
    const modelWithLongName = new GenerativeModel({
      model: 'models/gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContentStream'
    );
    const expectedResourcePath =
      'projects/test_project/locations/test_location/publishers/google/models/gemini-pro';
    await modelWithLongName.generateContentStream(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][1]).toEqual(
      expectedResourcePath
    );
  });
  it('projects/my-project/my-tuned-gemini-pro model send correct resourcePath to functions', async () => {
    const modelWithFullName = new GenerativeModel({
      model: 'projects/my-project/my-tuned-gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContentStream'
    );
    const expectedResourcePath = 'projects/my-project/my-tuned-gemini-pro';
    await modelWithFullName.generateContentStream(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][1]).toEqual(
      expectedResourcePath
    );
  });
  it('send timeout options to functions', async () => {
    const modelWithRequestOptions = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
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
    expect(generateContentSpy.calls.allArgs()[0][8].timeout).toEqual(0);
  });
  it('set system instruction in generateContent, should send system instruction to functions', async () => {
    const modelWithSystemInstruction = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
      systemInstruction: TEST_SYSTEM_INSTRUCTION,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContentStream'
    );
    const expectedRequest = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'How are you doing today?',
            },
          ],
        },
      ],
      systemInstruction: {
        role: 'system',
        parts: [
          {
            text: 'system instruction',
          },
        ],
      },
    };
    await modelWithSystemInstruction.generateContentStream(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][3]).toEqual(expectedRequest);
  });
  it('set system instruction in generateContent, wrong role, should send system instruction to functions', async () => {
    const modelWithSystemInstruction = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
      systemInstruction: TEST_SYSTEM_INSTRUCTION_WRONG_ROLE,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContentStream'
    );
    const expectedRequest = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'How are you doing today?',
            },
          ],
        },
      ],
      systemInstruction: {
        role: 'system',
        parts: [
          {
            text: 'system instruction',
          },
        ],
      },
    };
    await modelWithSystemInstruction.generateContentStream(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][3]).toEqual(expectedRequest);
  });
  it('returns a GenerateContentResponse when passed a string', async () => {
    const expectedResult: StreamGenerateContentResult = {
      response: Promise.resolve(TEST_MODEL_RESPONSE),
      stream: testGenerator(),
    };
    spyOn(PostFetchFunctions, 'processStream').and.resolveTo(expectedResult);
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
    spyOn(PostFetchFunctions, 'processStream').and.resolveTo(expectedResult);
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
    spyOn(PostFetchFunctions, 'processStream').and.resolveTo(expectedResult);
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
    spyOn(PostFetchFunctions, 'processStream').and.resolveTo(
      expectedStreamResult
    );
    const resp = await model.generateContentStream(req);
    expect(resp).toEqual(expectedStreamResult);
  });
  it('pass tools to remote endpoint when tools are passed via constructor', async () => {
    model = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    });
    const expectedResult: StreamGenerateContentResult = {
      response: Promise.resolve(TEST_MODEL_RESPONSE_WITH_FUNCTION_CALL),
      stream: testGenerator(),
    };
    spyOn(PostFetchFunctions, 'processStream').and.resolveTo(expectedResult);
    const expectedBody =
      '{"contents":[{"role":"user","parts":[{"text":"How are you doing today?"}]}],"tools":[{"functionDeclarations":[{"name":"get_current_weather","description":"get weather in a given location","parameters":{"type":"OBJECT","properties":{"location":{"type":"STRING"},"unit":{"type":"STRING","enum":["celsius","fahrenheit"]}},"required":["location"]}}]}]}';
    await model.generateContentStream(TEST_CHAT_MESSSAGE_TEXT);
    // @ts-ignore
    const actualBody = fetchSpy.calls.allArgs()[0][1].body;
    expect(actualBody).toEqual(expectedBody);
  });
  it('pass tools to remote endpoint when tools are passed via generateContent', async () => {
    model = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    });
    const expectedResult: StreamGenerateContentResult = {
      response: Promise.resolve(TEST_MODEL_RESPONSE_WITH_FUNCTION_CALL),
      stream: testGenerator(),
    };
    const req: GenerateContentRequest = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weater like in Boston?'}]},
      ],
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    };
    spyOn(PostFetchFunctions, 'processStream').and.resolveTo(expectedResult);
    const expectedBody =
      '{"contents":[{"role":"user","parts":[{"text":"What is the weater like in Boston?"}]}],"tools":[{"googleSearchRetrieval":{"disableAttribution":false}}]}';
    await model.generateContent(req);
    // @ts-ignore
    const actualBody = fetchSpy.calls.allArgs()[0][1].body;
    expect(actualBody).toEqual(expectedBody);
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
      googleAuth: FAKE_GOOGLE_AUTH,
    });
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
    spyOn(PostFetchFunctions, 'processStream').and.resolveTo(expectedResult);
    const resp = await model.generateContentStream(req);
    expect(resp).toEqual(expectedResult);
  });
  it('returns a GenerateContentResponse when passed text content', async () => {
    const req: GenerateContentRequest = {contents: TEST_USER_CHAT_MESSAGE};
    const expectedResult: StreamGenerateContentResult = {
      response: Promise.resolve(TEST_MODEL_RESPONSE),
      stream: testGeneratorMultiStream(),
    };
    spyOn(PostFetchFunctions, 'processStream').and.resolveTo(expectedResult);
    const resp = await model.generateContentStream(req);
    let firstChunkTimestamp = 0;
    for await (const item of resp.stream) {
      if (firstChunkTimestamp === 0) {
        firstChunkTimestamp = Date.now();
      }
    }
    expect(Date.now() - firstChunkTimestamp).toBeGreaterThanOrEqual(
      200 - DATE_NOW_PRECISION_MILLIS
    );
  });
  it('gemini-pro model send correct resourcePath to functions', async () => {
    const modelWithShortName = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContentStream'
    );
    const expectedResourcePath =
      'projects/test_project/locations/test_location/publishers/google/models/gemini-pro';
    await modelWithShortName.generateContentStream(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][1]).toEqual(
      expectedResourcePath
    );
  });
  it('models/gemini-pro model send correct resourcePath to functions', async () => {
    const modelWithLongName = new GenerativeModelPreview({
      model: 'models/gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContentStream'
    );
    const expectedResourcePath =
      'projects/test_project/locations/test_location/publishers/google/models/gemini-pro';
    await modelWithLongName.generateContentStream(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][1]).toEqual(
      expectedResourcePath
    );
  });
  it('projects/my-project/my-tuned-gemini-pro model send correct resourcePath to functions', async () => {
    const modelWithFullName = new GenerativeModelPreview({
      model: 'projects/my-project/my-tuned-gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContentStream'
    );
    const expectedResourcePath = 'projects/my-project/my-tuned-gemini-pro';
    await modelWithFullName.generateContentStream(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][1]).toEqual(
      expectedResourcePath
    );
  });

  it('send timeout options to functions', async () => {
    const modelWithRequestOptions = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
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
    expect(generateContentSpy.calls.allArgs()[0][8].timeout).toEqual(0);
  });

  it('set system instruction in generateContent, should send system instruction to functions', async () => {
    const modelWithSystemInstruction = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
      systemInstruction: TEST_SYSTEM_INSTRUCTION,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContentStream'
    );
    const expectedRequest = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'How are you doing today?',
            },
          ],
        },
      ],
      systemInstruction: {
        role: 'system',
        parts: [
          {
            text: 'system instruction',
          },
        ],
      },
    };
    await modelWithSystemInstruction.generateContentStream(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][3]).toEqual(expectedRequest);
  });
  it('set system instruction in generateContent, wrong role, should send system instruction to functions', async () => {
    const modelWithSystemInstruction = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    const req: GenerateContentRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
      systemInstruction: TEST_SYSTEM_INSTRUCTION_WRONG_ROLE,
    };
    const generateContentSpy = spyOn(
      GenerateContentFunctions,
      'generateContentStream'
    );
    const expectedRequest = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'How are you doing today?',
            },
          ],
        },
      ],
      systemInstruction: {
        role: 'system',
        parts: [
          {
            text: 'system instruction',
          },
        ],
      },
    };
    await modelWithSystemInstruction.generateContentStream(req);
    // @ts-ignore
    expect(generateContentSpy.calls.allArgs()[0][3]).toEqual(expectedRequest);
  });
  it('returns a GenerateContentResponse when passed a string', async () => {
    const expectedResult: StreamGenerateContentResult = {
      response: Promise.resolve(TEST_MODEL_RESPONSE),
      stream: testGenerator(),
    };
    spyOn(PostFetchFunctions, 'processStream').and.resolveTo(expectedResult);
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
    spyOn(PostFetchFunctions, 'processStream').and.resolveTo(expectedResult);
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
    spyOn(PostFetchFunctions, 'processStream').and.resolveTo(expectedResult);
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
    spyOn(PostFetchFunctions, 'processStream').and.resolveTo(
      expectedStreamResult
    );
    const resp = await model.generateContentStream(req);
    expect(resp).toEqual(expectedStreamResult);
  });
  it('in preivew, pass tools to remote endpoint when tools are passed via constructor', async () => {
    model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    });
    const expectedResult: StreamGenerateContentResult = {
      response: Promise.resolve(TEST_MODEL_RESPONSE_WITH_FUNCTION_CALL),
      stream: testGenerator(),
    };
    spyOn(PostFetchFunctions, 'processStream').and.resolveTo(expectedResult);
    const expectedBody =
      '{"contents":[{"role":"user","parts":[{"text":"How are you doing today?"}]}],"tools":[{"functionDeclarations":[{"name":"get_current_weather","description":"get weather in a given location","parameters":{"type":"OBJECT","properties":{"location":{"type":"STRING"},"unit":{"type":"STRING","enum":["celsius","fahrenheit"]}},"required":["location"]}}]}]}';
    await model.generateContentStream(TEST_CHAT_MESSSAGE_TEXT);
    // @ts-ignore
    const actualBody = fetchSpy.calls.allArgs()[0][1].body;
    expect(actualBody).toEqual(expectedBody);
  });
  it('in preview, pass tools to remote endpoint when tools are passed via generateContent', async () => {
    model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    });
    const expectedResult: StreamGenerateContentResult = {
      response: Promise.resolve(TEST_MODEL_RESPONSE_WITH_FUNCTION_CALL),
      stream: testGenerator(),
    };
    const req: GenerateContentRequest = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weater like in Boston?'}]},
      ],
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    };
    spyOn(PostFetchFunctions, 'processStream').and.resolveTo(expectedResult);
    const expectedBody =
      '{"contents":[{"role":"user","parts":[{"text":"What is the weater like in Boston?"}]}],"tools":[{"googleSearchRetrieval":{"disableAttribution":false}}]}';
    await model.generateContent(req);
    // @ts-ignore
    const actualBody = fetchSpy.calls.allArgs()[0][1].body;
    expect(actualBody).toEqual(expectedBody);
  });
});

describe('ChatSession', () => {
  let chatSession: ChatSession;
  let chatSessionWithNoArgs: ChatSession;
  let chatSessionWithFunctionCall: ChatSession;
  let model: GenerativeModel;

  beforeEach(async () => {
    model = new GenerativeModel({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    chatSession = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
    });
    expect(await chatSession.getHistory()).toEqual(TEST_USER_CHAT_MESSAGE);
    chatSessionWithNoArgs = model.startChat();
    chatSessionWithFunctionCall = model.startChat({
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    });
  });

  describe('sendMessage', () => {
    const expectedResponse = TEST_MODEL_RESPONSE;
    const fetchResult = Promise.resolve(
      new Response(JSON.stringify(expectedResponse), fetchResponseObj)
    );
    beforeEach(() => {
      spyOn(global, 'fetch').and.returnValue(fetchResult);
    });
    it('returns a GenerateContentResponse and appends to history', async () => {
      const req = 'How are you doing today?';
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      const resp = await chatSession.sendMessage(req);
      expect(resp).toEqual(expectedResult);
      expect((await chatSession.getHistory()).length).toEqual(3);
    });
    it('gemini-pro model send correct resourcePath to functions', async () => {
      const modelWithShortName = new GenerativeModel({
        model: 'gemini-pro',
        project: PROJECT,
        location: LOCATION,
        googleAuth: FAKE_GOOGLE_AUTH,
      });
      const chatSessionWithShortName = modelWithShortName.startChat();
      const req = TEST_CHAT_MESSSAGE_TEXT;
      const generateContentSpy = spyOn(
        GenerateContentFunctions,
        'generateContent'
      ).and.callThrough();
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      spyOn(PostFetchFunctions, 'processUnary').and.resolveTo(expectedResult);
      const expectedResourcePath =
        'projects/test_project/locations/test_location/publishers/google/models/gemini-pro';
      await chatSessionWithShortName.sendMessage(req);
      // @ts-ignore
      expect(generateContentSpy.calls.allArgs()[0][1]).toEqual(
        expectedResourcePath
      );
    });
    it('models/gemini-pro model send correct resourcePath to functions', async () => {
      const modelWithLongName = new GenerativeModel({
        model: 'models/gemini-pro',
        project: PROJECT,
        location: LOCATION,
        googleAuth: FAKE_GOOGLE_AUTH,
      });
      const chatSessionWithLongName = modelWithLongName.startChat();
      const req = TEST_CHAT_MESSSAGE_TEXT;
      const generateContentSpy = spyOn(
        GenerateContentFunctions,
        'generateContent'
      ).and.callThrough();
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      spyOn(PostFetchFunctions, 'processUnary').and.resolveTo(expectedResult);
      const expectedResourcePath =
        'projects/test_project/locations/test_location/publishers/google/models/gemini-pro';
      await chatSessionWithLongName.sendMessage(req);
      // @ts-ignore
      expect(generateContentSpy.calls.allArgs()[0][1]).toEqual(
        expectedResourcePath
      );
    });
    it('projects/my-project/my-tuned-gemini-pro model send correct resourcePath to functions', async () => {
      const modelWithFullName = new GenerativeModel({
        model: 'projects/my-project/my-tuned-gemini-pro',
        project: PROJECT,
        location: LOCATION,
        googleAuth: FAKE_GOOGLE_AUTH,
      });
      const chatSessionWithFullName = modelWithFullName.startChat();
      const req = TEST_CHAT_MESSSAGE_TEXT;
      const generateContentSpy = spyOn(
        GenerateContentFunctions,
        'generateContent'
      ).and.callThrough();
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      spyOn(PostFetchFunctions, 'processUnary').and.resolveTo(expectedResult);
      const expectedResourcePath = 'projects/my-project/my-tuned-gemini-pro';
      await chatSessionWithFullName.sendMessage(req);
      // @ts-ignore
      expect(generateContentSpy.calls.allArgs()[0][1]).toEqual(
        expectedResourcePath
      );
    });
    it('send timeout to functions', async () => {
      const modelWithRequestOptions = new GenerativeModel({
        model: 'gemini-pro',
        project: PROJECT,
        location: LOCATION,
        googleAuth: FAKE_GOOGLE_AUTH,
        requestOptions: TEST_REQUEST_OPTIONS,
      });
      const chatSessionWithRequestOptions = modelWithRequestOptions.startChat({
        history: TEST_USER_CHAT_MESSAGE,
      }) as ChatSessionForTest;
      const req = 'How are you doing today?';
      const generateContentSpy: jasmine.Spy = spyOn(
        GenerateContentFunctions,
        'generateContent'
      ).and.resolveTo({
        response: TEST_MODEL_RESPONSE,
      });
      await chatSessionWithRequestOptions.sendMessage(req);
      expect(chatSessionWithRequestOptions.requestOptions).toEqual(
        TEST_REQUEST_OPTIONS
      );
      expect(generateContentSpy.calls.allArgs()[0][8].timeout).toEqual(0);
    });

    it('returns a GenerateContentResponse and appends to history when startChat is passed with no args', async () => {
      const req = 'How are you doing today?';
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      spyOn(PostFetchFunctions, 'processUnary').and.resolveTo(expectedResult);
      const resp = await chatSessionWithNoArgs.sendMessage(req);
      expect(resp).toEqual(expectedResult);
      expect((await chatSessionWithNoArgs.getHistory()).length).toEqual(2);
    });

    it('returns a GenerateContentResponse when passed multi-part content', async () => {
      const req = TEST_MULTIPART_MESSAGE[0]['parts'];
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      spyOn(PostFetchFunctions, 'processUnary').and.resolveTo(expectedResult);
      const resp = await chatSessionWithNoArgs.sendMessage(req);
      expect(resp).toEqual(expectedResult);
      expect((await chatSessionWithNoArgs.getHistory()).length).toEqual(2);
    });
    it('returns a FunctionCall and appends to history when passed a FunctionDeclaration', async () => {
      const functionCallChatMessage = 'What is the weather in LA?';
      const expectedFunctionCallResponse: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE_WITH_FUNCTION_CALL,
      };
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE_WITH_FUNCTION_CALL,
      };

      const streamSpy = spyOn(PostFetchFunctions, 'processUnary');

      streamSpy.and.resolveTo(expectedResult);
      const response1 = await chatSessionWithFunctionCall.sendMessage(
        functionCallChatMessage
      );
      expect(response1).toEqual(expectedFunctionCallResponse);
      expect((await chatSessionWithFunctionCall.getHistory()).length).toEqual(
        2
      );

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
      expect((await chatSessionWithFunctionCall.getHistory()).length).toEqual(
        4
      );
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
    const expectedStreamResult = {
      response: Promise.resolve(TEST_MODEL_RESPONSE),
      stream: testGenerator(),
    };
    const fetchResult = Promise.resolve(
      new Response(JSON.stringify(expectedStreamResult), fetchResponseObj)
    );
    beforeEach(() => {
      spyOn(global, 'fetch').and.returnValue(fetchResult);
    });
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
      spyOn(PostFetchFunctions, 'processStream').and.resolveTo(expectedResult);
      const history = await chatSession.getHistory();
      expect(history.length).toEqual(1);
      expect(history[0].role).toEqual(constants.USER_ROLE);
      const result = await chatSession.sendMessageStream(req);
      const response = await result.response;
      const expectedResponse = await expectedResult.response;
      const secondHistory = await chatSession.getHistory();
      expect(response).toEqual(expectedResponse);
      expect(secondHistory.length).toEqual(3);
      expect(secondHistory[0].role).toEqual(constants.USER_ROLE);
      expect(secondHistory[1].role).toEqual(constants.USER_ROLE);
      expect(secondHistory[2].role).toEqual(constants.MODEL_ROLE);
    });
    it('returns a StreamGenerateContentResponse in streaming mode', async () => {
      const req = 'How are you doing today?';
      const expectedResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGeneratorMultiStream(),
      };
      spyOn(PostFetchFunctions, 'processStream').and.resolveTo(expectedResult);

      const chatSession = model.startChat({
        history: [
          {
            role: constants.USER_ROLE,
            parts: [{text: 'How are you doing today?'}],
          },
        ],
      });
      const resp = await chatSession.sendMessageStream(req);

      let firstChunkTimestamp = 0;
      for await (const item of resp.stream) {
        if (firstChunkTimestamp === 0) {
          firstChunkTimestamp = Date.now();
        }
      }
      expect(Date.now() - firstChunkTimestamp).toBeGreaterThanOrEqual(
        200 - DATE_NOW_PRECISION_MILLIS
      );
    });
    it('gemini-pro model send correct resourcePath to functions', async () => {
      const modelWithShortName = new GenerativeModel({
        model: 'gemini-pro',
        project: PROJECT,
        location: LOCATION,
        googleAuth: FAKE_GOOGLE_AUTH,
      });
      const chatSessionWithShortName = modelWithShortName.startChat();
      const req = TEST_CHAT_MESSSAGE_TEXT;
      const generateContentSpy = spyOn(
        GenerateContentFunctions,
        'generateContentStream'
      ).and.callThrough();
      const expectedResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGeneratorMultiStream(),
      };
      spyOn(PostFetchFunctions, 'processStream').and.resolveTo(expectedResult);
      const expectedResourcePath =
        'projects/test_project/locations/test_location/publishers/google/models/gemini-pro';
      await chatSessionWithShortName.sendMessageStream(req);
      // @ts-ignore
      expect(generateContentSpy.calls.allArgs()[0][1]).toEqual(
        expectedResourcePath
      );
    });
    it('models/gemini-pro model send correct resourcePath to functions', async () => {
      const modelWithLongName = new GenerativeModel({
        model: 'models/gemini-pro',
        project: PROJECT,
        location: LOCATION,
        googleAuth: FAKE_GOOGLE_AUTH,
      });
      const chatSessionWithLongName = modelWithLongName.startChat();
      const req = TEST_CHAT_MESSSAGE_TEXT;
      const generateContentSpy = spyOn(
        GenerateContentFunctions,
        'generateContentStream'
      ).and.callThrough();
      const expectedResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGeneratorMultiStream(),
      };
      spyOn(PostFetchFunctions, 'processStream').and.resolveTo(expectedResult);
      const expectedResourcePath =
        'projects/test_project/locations/test_location/publishers/google/models/gemini-pro';
      await chatSessionWithLongName.sendMessageStream(req);
      // @ts-ignore
      expect(generateContentSpy.calls.allArgs()[0][1]).toEqual(
        expectedResourcePath
      );
    });
    it('projects/my-project/my-tuned-gemini-pro model send correct resourcePath to functions', async () => {
      const modelWithFullName = new GenerativeModel({
        model: 'projects/my-project/my-tuned-gemini-pro',
        project: PROJECT,
        location: LOCATION,
        googleAuth: FAKE_GOOGLE_AUTH,
      });
      const chatSessionWithFullName = modelWithFullName.startChat();
      const req = TEST_CHAT_MESSSAGE_TEXT;
      const generateContentSpy = spyOn(
        GenerateContentFunctions,
        'generateContentStream'
      ).and.callThrough();
      const expectedResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGeneratorMultiStream(),
      };
      spyOn(PostFetchFunctions, 'processStream').and.resolveTo(expectedResult);
      const expectedResourcePath = 'projects/my-project/my-tuned-gemini-pro';
      await chatSessionWithFullName.sendMessageStream(req);
      // @ts-ignore
      expect(generateContentSpy.calls.allArgs()[0][1]).toEqual(
        expectedResourcePath
      );
    });
    it('send timeout to functions', async () => {
      const modelWithRequestOptions = new GenerativeModel({
        model: 'gemini-pro',
        project: PROJECT,
        location: LOCATION,
        googleAuth: FAKE_GOOGLE_AUTH,
        requestOptions: TEST_REQUEST_OPTIONS,
      });
      const chatSessionWithRequestOptions = modelWithRequestOptions.startChat({
        history: TEST_USER_CHAT_MESSAGE,
      }) as ChatSessionForTest;
      const req = 'How are you doing today?';
      const generateContentSpy: jasmine.Spy = spyOn(
        GenerateContentFunctions,
        'generateContentStream'
      ).and.resolveTo({
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGenerator(),
      });
      await chatSessionWithRequestOptions.sendMessageStream(req);
      expect(chatSessionWithRequestOptions.requestOptions).toEqual(
        TEST_REQUEST_OPTIONS
      );
      expect(generateContentSpy.calls.allArgs()[0][8].timeout).toEqual(0);
    });

    it('returns a FunctionCall and appends to history when passed a FunctionDeclaration', async () => {
      const functionCallChatMessage = 'What is the weather in LA?';
      const expectedStreamResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE_WITH_FUNCTION_CALL),
        stream: testGenerator(),
      };

      const streamSpy = spyOn(PostFetchFunctions, 'processStream');

      streamSpy.and.resolveTo(expectedStreamResult);
      const response1 = await chatSessionWithFunctionCall.sendMessageStream(
        functionCallChatMessage
      );
      expect(response1).toEqual(expectedStreamResult);
      expect((await chatSessionWithFunctionCall.getHistory()).length).toEqual(
        2
      );

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
      expect((await chatSessionWithFunctionCall.getHistory()).length).toEqual(
        4
      );
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
  let chatSessionWithFunctionCall: ChatSessionPreview;
  let model: GenerativeModelPreview;
  let expectedStreamResult: StreamGenerateContentResult;

  beforeEach(async () => {
    model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
    chatSession = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
    });
    expect(await chatSession.getHistory()).toEqual(TEST_USER_CHAT_MESSAGE);
    chatSessionWithNoArgs = model.startChat();
    chatSessionWithFunctionCall = model.startChat({
      tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
    });
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
      const req = TEST_CHAT_MESSSAGE_TEXT;
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      spyOn(PostFetchFunctions, 'processUnary').and.resolveTo(expectedResult);
      const resp = await chatSession.sendMessage(req);
      expect(resp).toEqual(expectedResult);
      expect((await chatSession.getHistory()).length).toEqual(3);
    });

    it('gemini-pro model send correct resourcePath to functions', async () => {
      const modelWithShortName = new GenerativeModelPreview({
        model: 'gemini-pro',
        project: PROJECT,
        location: LOCATION,
        googleAuth: FAKE_GOOGLE_AUTH,
      });
      const chatSessionWithShortName = modelWithShortName.startChat();
      const req = TEST_CHAT_MESSSAGE_TEXT;
      const generateContentSpy = spyOn(
        GenerateContentFunctions,
        'generateContent'
      ).and.callThrough();
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      spyOn(PostFetchFunctions, 'processUnary').and.resolveTo(expectedResult);
      const expectedResourcePath =
        'projects/test_project/locations/test_location/publishers/google/models/gemini-pro';
      await chatSessionWithShortName.sendMessage(req);
      // @ts-ignore
      expect(generateContentSpy.calls.allArgs()[0][1]).toEqual(
        expectedResourcePath
      );
    });
    it('models/gemini-pro model send correct resourcePath to functions', async () => {
      const modelWithLongName = new GenerativeModelPreview({
        model: 'models/gemini-pro',
        project: PROJECT,
        location: LOCATION,
        googleAuth: FAKE_GOOGLE_AUTH,
      });
      const chatSessionWithLongName = modelWithLongName.startChat();
      const req = TEST_CHAT_MESSSAGE_TEXT;
      const generateContentSpy = spyOn(
        GenerateContentFunctions,
        'generateContent'
      ).and.callThrough();
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      spyOn(PostFetchFunctions, 'processUnary').and.resolveTo(expectedResult);
      const expectedResourcePath =
        'projects/test_project/locations/test_location/publishers/google/models/gemini-pro';
      await chatSessionWithLongName.sendMessage(req);
      // @ts-ignore
      expect(generateContentSpy.calls.allArgs()[0][1]).toEqual(
        expectedResourcePath
      );
    });
    it('projects/my-project/my-tuned-gemini-pro model send correct resourcePath to functions', async () => {
      const modelWithFullName = new GenerativeModelPreview({
        model: 'projects/my-project/my-tuned-gemini-pro',
        project: PROJECT,
        location: LOCATION,
        googleAuth: FAKE_GOOGLE_AUTH,
      });
      const chatSessionWithFullName = modelWithFullName.startChat();
      const req = TEST_CHAT_MESSSAGE_TEXT;
      const generateContentSpy = spyOn(
        GenerateContentFunctions,
        'generateContent'
      ).and.callThrough();
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      spyOn(PostFetchFunctions, 'processUnary').and.resolveTo(expectedResult);
      const expectedResourcePath = 'projects/my-project/my-tuned-gemini-pro';
      await chatSessionWithFullName.sendMessage(req);
      // @ts-ignore
      expect(generateContentSpy.calls.allArgs()[0][1]).toEqual(
        expectedResourcePath
      );
    });
    it('send timeout to functions', async () => {
      const modelWithRequestOptions = new GenerativeModelPreview({
        model: 'gemini-pro',
        project: PROJECT,
        location: LOCATION,
        googleAuth: FAKE_GOOGLE_AUTH,
        requestOptions: TEST_REQUEST_OPTIONS,
      });
      const chatSessionWithRequestOptions = modelWithRequestOptions.startChat({
        history: TEST_USER_CHAT_MESSAGE,
      }) as ChatSessionPreviewForTest;
      const req = TEST_CHAT_MESSSAGE_TEXT;
      const generateContentSpy: jasmine.Spy = spyOn(
        GenerateContentFunctions,
        'generateContent'
      ).and.resolveTo({
        response: TEST_MODEL_RESPONSE,
      });
      await chatSessionWithRequestOptions.sendMessage(req);
      expect(chatSessionWithRequestOptions.requestOptions).toEqual(
        TEST_REQUEST_OPTIONS
      );
      expect(generateContentSpy.calls.allArgs()[0][8].timeout).toEqual(0);
    });

    it('returns a GenerateContentResponse and appends to history when startChat is passed with no args', async () => {
      const req = TEST_CHAT_MESSSAGE_TEXT;
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      spyOn(PostFetchFunctions, 'processUnary').and.resolveTo(expectedResult);
      const resp = await chatSessionWithNoArgs.sendMessage(req);
      expect(resp).toEqual(expectedResult);
      expect((await chatSessionWithNoArgs.getHistory()).length).toEqual(2);
    });

    it('returns a GenerateContentResponse when passed multi-part content', async () => {
      const req = TEST_MULTIPART_MESSAGE[0]['parts'];
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      spyOn(PostFetchFunctions, 'processUnary').and.resolveTo(expectedResult);
      const resp = await chatSessionWithNoArgs.sendMessage(req);
      expect(resp).toEqual(expectedResult);
      expect((await chatSessionWithNoArgs.getHistory()).length).toEqual(2);
    });
    it('returns a FunctionCall and appends to history when passed a FunctionDeclaration', async () => {
      const functionCallChatMessage = 'What is the weather in LA?';
      const expectedFunctionCallResponse: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE_WITH_FUNCTION_CALL,
      };
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE_WITH_FUNCTION_CALL,
      };

      const streamSpy = spyOn(PostFetchFunctions, 'processUnary');

      streamSpy.and.resolveTo(expectedResult);
      const response1 = await chatSessionWithFunctionCall.sendMessage(
        functionCallChatMessage
      );
      expect(response1).toEqual(expectedFunctionCallResponse);
      expect((await chatSessionWithFunctionCall.getHistory()).length).toEqual(
        2
      );

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
      expect((await chatSessionWithFunctionCall.getHistory()).length).toEqual(
        4
      );
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
      const req = TEST_CHAT_MESSSAGE_TEXT;
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
      spyOn(PostFetchFunctions, 'processStream').and.resolveTo(expectedResult);
      const history = await chatSession.getHistory();
      expect(history.length).toEqual(1);
      expect(history[0].role).toEqual(constants.USER_ROLE);
      const result = await chatSession.sendMessageStream(req);
      const response = await result.response;
      const expectedResponse = await expectedResult.response;
      expect(response).toEqual(expectedResponse);
      const secondHistory = await chatSession.getHistory();
      expect(secondHistory.length).toEqual(3);
      expect(secondHistory[0].role).toEqual(constants.USER_ROLE);
      expect(secondHistory[1].role).toEqual(constants.USER_ROLE);
      expect(secondHistory[2].role).toEqual(constants.MODEL_ROLE);
    });
    it('returns a StreamGenerateContentResponse in streaming mode', async () => {
      const req = TEST_CHAT_MESSSAGE_TEXT;
      const expectedResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGeneratorMultiStream(),
      };
      spyOn(PostFetchFunctions, 'processStream').and.resolveTo(expectedResult);

      const chatSession = model.startChat({
        history: [
          {
            role: constants.USER_ROLE,
            parts: [{text: 'How are you doing today?'}],
          },
        ],
      });
      const resp = await chatSession.sendMessageStream(req);

      let firstChunkTimestamp = 0;
      for await (const item of resp.stream) {
        if (firstChunkTimestamp === 0) {
          firstChunkTimestamp = Date.now();
        }
      }
      expect(Date.now() - firstChunkTimestamp).toBeGreaterThanOrEqual(
        200 - DATE_NOW_PRECISION_MILLIS
      );
    });
    it('gemini-pro model send correct resourcePath to functions', async () => {
      const modelWithShortName = new GenerativeModelPreview({
        model: 'gemini-pro',
        project: PROJECT,
        location: LOCATION,
        googleAuth: FAKE_GOOGLE_AUTH,
      });
      const chatSessionWithShortName = modelWithShortName.startChat();
      const req = TEST_CHAT_MESSSAGE_TEXT;
      const generateContentSpy = spyOn(
        GenerateContentFunctions,
        'generateContentStream'
      ).and.callThrough();
      const expectedResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGeneratorMultiStream(),
      };
      spyOn(PostFetchFunctions, 'processStream').and.resolveTo(expectedResult);
      const expectedResourcePath =
        'projects/test_project/locations/test_location/publishers/google/models/gemini-pro';
      await chatSessionWithShortName.sendMessageStream(req);
      // @ts-ignore
      expect(generateContentSpy.calls.allArgs()[0][1]).toEqual(
        expectedResourcePath
      );
    });
    it('models/gemini-pro model send correct resourcePath to functions', async () => {
      const modelWithLongName = new GenerativeModelPreview({
        model: 'models/gemini-pro',
        project: PROJECT,
        location: LOCATION,
        googleAuth: FAKE_GOOGLE_AUTH,
      });
      const chatSessionWithLongName = modelWithLongName.startChat();
      const req = TEST_CHAT_MESSSAGE_TEXT;
      const generateContentSpy = spyOn(
        GenerateContentFunctions,
        'generateContentStream'
      ).and.callThrough();
      const expectedResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGeneratorMultiStream(),
      };
      spyOn(PostFetchFunctions, 'processStream').and.resolveTo(expectedResult);
      const expectedResourcePath =
        'projects/test_project/locations/test_location/publishers/google/models/gemini-pro';
      await chatSessionWithLongName.sendMessageStream(req);
      // @ts-ignore
      expect(generateContentSpy.calls.allArgs()[0][1]).toEqual(
        expectedResourcePath
      );
    });
    it('projects/my-project/my-tuned-gemini-pro model send correct resourcePath to functions', async () => {
      const modelWithFullName = new GenerativeModelPreview({
        model: 'projects/my-project/my-tuned-gemini-pro',
        project: PROJECT,
        location: LOCATION,
        googleAuth: FAKE_GOOGLE_AUTH,
      });
      const chatSessionWithFullName = modelWithFullName.startChat();
      const req = TEST_CHAT_MESSSAGE_TEXT;
      const generateContentSpy = spyOn(
        GenerateContentFunctions,
        'generateContentStream'
      ).and.callThrough();
      const expectedResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGeneratorMultiStream(),
      };
      spyOn(PostFetchFunctions, 'processStream').and.resolveTo(expectedResult);
      const expectedResourcePath = 'projects/my-project/my-tuned-gemini-pro';
      await chatSessionWithFullName.sendMessageStream(req);
      // @ts-ignore
      expect(generateContentSpy.calls.allArgs()[0][1]).toEqual(
        expectedResourcePath
      );
    });
    it('send timeout to functions', async () => {
      const modelWithRequestOptions = new GenerativeModelPreview({
        model: 'gemini-pro',
        project: PROJECT,
        location: LOCATION,
        googleAuth: FAKE_GOOGLE_AUTH,
        requestOptions: TEST_REQUEST_OPTIONS,
      });
      const chatSessionWithRequestOptions = modelWithRequestOptions.startChat({
        history: TEST_USER_CHAT_MESSAGE,
      }) as ChatSessionPreviewForTest;
      const req = TEST_CHAT_MESSSAGE_TEXT;
      const generateContentSpy: jasmine.Spy = spyOn(
        GenerateContentFunctions,
        'generateContentStream'
      ).and.resolveTo({
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGenerator(),
      });
      await chatSessionWithRequestOptions.sendMessageStream(req);
      expect(chatSessionWithRequestOptions.requestOptions).toEqual(
        TEST_REQUEST_OPTIONS
      );
      expect(generateContentSpy.calls.allArgs()[0][8].timeout).toEqual(0);
    });

    it('returns a FunctionCall and appends to history when passed a FunctionDeclaration', async () => {
      const functionCallChatMessage = 'What is the weather in LA?';
      const expectedStreamResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE_WITH_FUNCTION_CALL),
        stream: testGenerator(),
      };

      const streamSpy = spyOn(PostFetchFunctions, 'processStream');

      streamSpy.and.resolveTo(expectedStreamResult);
      const response1 = await chatSessionWithFunctionCall.sendMessageStream(
        functionCallChatMessage
      );
      expect(response1).toEqual(expectedStreamResult);
      expect((await chatSessionWithFunctionCall.getHistory()).length).toEqual(
        2
      );

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
      expect((await chatSessionWithFunctionCall.getHistory()).length).toEqual(
        4
      );
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
      googleAuth: FAKE_GOOGLE_AUTH,
    });
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
      googleAuth: FAKE_GOOGLE_AUTH,
      requestOptions: TEST_REQUEST_OPTIONS,
    });
    const req: CountTokensRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const countTokenSpy = spyOn(CountTokensFunctions, 'countTokens');
    await model.countTokens(req);
    // @ts-ignore
    expect(countTokenSpy.calls.allArgs()[0][5].timeout).toEqual(0);
  });
});

describe('GenerativeModelPreview countTokens', () => {
  it('returns the token count', async () => {
    const model = new GenerativeModelPreview({
      model: 'gemini-pro',
      project: PROJECT,
      location: LOCATION,
      googleAuth: FAKE_GOOGLE_AUTH,
    });
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
      googleAuth: FAKE_GOOGLE_AUTH,
      requestOptions: TEST_REQUEST_OPTIONS,
    });
    const req: CountTokensRequest = {
      contents: TEST_USER_CHAT_MESSAGE,
    };
    const countTokenSpy = spyOn(CountTokensFunctions, 'countTokens');
    await model.countTokens(req);
    // @ts-ignore
    expect(countTokenSpy.calls.allArgs()[0][5].timeout).toEqual(0);
  });
});

describe('GenerativeModel when exception at fetch', () => {
  const model = new GenerativeModel({
    model: 'gemini-pro',
    project: PROJECT,
    location: LOCATION,
    googleAuth: FAKE_GOOGLE_AUTH,
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
    googleAuth: FAKE_GOOGLE_AUTH,
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
    googleAuth: FAKE_GOOGLE_AUTH,
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
    googleAuth: FAKE_GOOGLE_AUTH,
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
    googleAuth: FAKE_GOOGLE_AUTH,
  });
  const message = 'hi';
  const chatSession = model.startChat();
  const countTokenReq: CountTokensRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  beforeEach(() => {
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
    googleAuth: FAKE_GOOGLE_AUTH,
  });
  const message = 'hi';
  const chatSession = model.startChat();
  const countTokenReq: CountTokensRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  beforeEach(() => {
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
    googleAuth: FAKE_GOOGLE_AUTH,
  });
  const message = 'hi';
  const chatSession = model.startChat();
  const countTokenReq: CountTokensRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  beforeEach(() => {
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
    googleAuth: FAKE_GOOGLE_AUTH,
  });
  const message = 'hi';
  const chatSession = model.startChat();
  const countTokenReq: CountTokensRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  beforeEach(() => {
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
