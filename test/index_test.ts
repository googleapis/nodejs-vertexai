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

/* tslint:disable */

import {
  ChatSession,
  GenerativeModel,
  StartChatParams,
  VertexAI,
} from '../src/index';
import * as StreamFunctions from '../src/process_stream';
import {
  CountTokensRequest,
  FinishReason,
  GenerateContentRequest,
  GenerateContentResponse,
  GenerateContentResult,
  HarmBlockThreshold,
  HarmCategory,
  HarmProbability,
  SafetyRating,
  SafetySetting,
  StreamGenerateContentResult,
} from '../src/types/content';
import {constants} from '../src/util';

const PROJECT = 'test_project';
const LOCATION = 'test_location';
const TEST_CHAT_MESSSAGE_TEXT = 'How are you doing today?';
const TEST_USER_CHAT_MESSAGE = [
  {role: constants.USER_ROLE, parts: [{text: TEST_CHAT_MESSSAGE_TEXT}]},
];
const TEST_TOKEN = 'testtoken';

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
  usage_metadata: {prompt_token_count: 0, candidates_token_count: 0},
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
const TEST_EMPTY_MODEL_RESPONSE = {
  candidates: [],
};

const TEST_ENDPOINT_BASE_PATH = 'test.googleapis.com';
const TEST_FILENAME = '/tmp/image.jpeg';
const INVALID_FILENAME = 'image.txt';
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

describe('VertexAI', () => {
  let vertexai: VertexAI;
  let model: GenerativeModel;
  let expectedStreamResult: StreamGenerateContentResult;
  let fetchSpy: jasmine.Spy;

  beforeEach(() => {
    vertexai = new VertexAI({
      project: PROJECT,
      location: LOCATION,
    });
    spyOnProperty(vertexai.preview, 'token', 'get').and.resolveTo(TEST_TOKEN);
    model = vertexai.preview.getGenerativeModel({model: 'gemini-pro'});
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

  it('given undefined google auth options, should be instantiated', () => {
    expect(vertexai).toBeInstanceOf(VertexAI);
  });

  it('given specified google auth options, should be instantiated', () => {
    const googleAuthOptions = {
      scopes: 'test.scopes',
    };
    const vetexai1 = new VertexAI({
      project: PROJECT,
      location: LOCATION,
      googleAuthOptions: googleAuthOptions,
    });
    expect(vetexai1).toBeInstanceOf(VertexAI);
  });

  it('given inconsistent project ID, should throw error', () => {
    const googleAuthOptions = {
      projectId: 'another_project',
    };
    expect(() => {
      new VertexAI({
        project: PROJECT,
        location: LOCATION,
        googleAuthOptions: googleAuthOptions,
      });
    }).toThrow(
      new Error(
        'inconsistent project ID values. argument project got value test_project but googleAuthOptions.projectId got value another_project'
      )
    );
  });

  describe('generateContent', () => {
    it('returns a GenerateContentResponse', async () => {
      const req: GenerateContentRequest = {
        contents: TEST_USER_CHAT_MESSAGE,
      };
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      spyOn(StreamFunctions, 'processStream').and.returnValue(
        expectedStreamResult
      );
      const resp = await model.generateContent(req);
      expect(resp).toEqual(expectedResult);
    });
    it('returns a GenerateContentResponse when passed a string', async () => {
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      spyOn(StreamFunctions, 'processStream').and.returnValue(
        expectedStreamResult
      );
      const resp = await model.generateContent(TEST_CHAT_MESSSAGE_TEXT);
      expect(resp).toEqual(expectedResult);
    });
  });

  describe('generateContent', () => {
    it('returns a GenerateContentResponse when passed a GCS URI', async () => {
      const req: GenerateContentRequest = {
        contents: TEST_USER_CHAT_MESSAGE_WITH_GCS_FILE,
      };
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      const expectedStreamResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGenerator(),
      };
      spyOn(StreamFunctions, 'processStream').and.returnValue(
        expectedStreamResult
      );
      const resp = await model.generateContent(req);
      expect(resp).toEqual(expectedResult);
    });
  });

  describe('generateContent', () => {
    it('raises an error when passed an invalid GCS URI', async () => {
      const req: GenerateContentRequest = {
        contents: TEST_USER_CHAT_MESSAGE_WITH_INVALID_GCS_FILE,
      };
      await expectAsync(model.generateContent(req)).toBeRejectedWithError(
        URIError
      );
    });
  });

  describe('generateContent', () => {
    it('returns a GenerateContentResponse when passed safety_settings and generation_config', async () => {
      const req: GenerateContentRequest = {
        contents: TEST_USER_CHAT_MESSAGE,
        safety_settings: TEST_SAFETY_SETTINGS,
        generation_config: TEST_GENERATION_CONFIG,
      };
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      const expectedStreamResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGenerator(),
      };
      spyOn(StreamFunctions, 'processStream').and.returnValue(
        expectedStreamResult
      );
      const resp = await model.generateContent(req);
      expect(resp).toEqual(expectedResult);
    });
  });

  describe('generateContent', () => {
    it('updates the base API endpoint when provided', async () => {
      const vertexaiWithBasePath = new VertexAI({
        project: PROJECT,
        location: LOCATION,
        apiEndpoint: TEST_ENDPOINT_BASE_PATH,
      });
      spyOnProperty(vertexaiWithBasePath.preview, 'token', 'get').and.resolveTo(
        TEST_TOKEN
      );
      model = vertexaiWithBasePath.preview.getGenerativeModel({
        model: 'gemini-pro',
      });

      const req: GenerateContentRequest = {
        contents: TEST_USER_CHAT_MESSAGE,
      };
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      const expectedStreamResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGenerator(),
      };
      spyOn(StreamFunctions, 'processStream').and.returnValue(
        expectedStreamResult
      );
      await model.generateContent(req);
      expect(fetchSpy.calls.allArgs()[0][0].toString()).toContain(
        TEST_ENDPOINT_BASE_PATH
      );
    });
  });

  describe('generateContent', () => {
    it('default the base API endpoint when base API not provided', async () => {
      const vertexaiWithoutBasePath = new VertexAI({
        project: PROJECT,
        location: LOCATION,
      });
      spyOnProperty(
        vertexaiWithoutBasePath.preview,
        'token',
        'get'
      ).and.resolveTo(TEST_TOKEN);
      model = vertexaiWithoutBasePath.preview.getGenerativeModel({
        model: 'gemini-pro',
      });

      const req: GenerateContentRequest = {
        contents: TEST_USER_CHAT_MESSAGE,
      };
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      const expectedStreamResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGenerator(),
      };
      spyOn(StreamFunctions, 'processStream').and.returnValue(
        expectedStreamResult
      );
      await model.generateContent(req);
      expect(fetchSpy.calls.allArgs()[0][0].toString()).toContain(
        `${LOCATION}-aiplatform.googleapis.com`
      );
    });
  });

  describe('generateContent', () => {
    it('removes top_k when it is set to 0', async () => {
      const reqWithEmptyConfigs: GenerateContentRequest = {
        contents: TEST_USER_CHAT_MESSAGE_WITH_GCS_FILE,
        generation_config: {top_k: 0},
        safety_settings: [],
      };
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      const expectedStreamResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGenerator(),
      };
      // const fetchResult = Promise.resolve(
      //     new Response(JSON.stringify(expectedStreamResult),
      //     fetchResponseObj));
      // const requestSpy = spyOn(global, 'fetch').and.returnValue(fetchResult);
      spyOn(StreamFunctions, 'processStream').and.returnValue(
        expectedStreamResult
      );
      await model.generateContent(reqWithEmptyConfigs);
      const requestArgs = fetchSpy.calls.allArgs()[0][1];
      if (typeof requestArgs === 'object' && requestArgs) {
        expect(JSON.stringify(requestArgs['body'])).not.toContain('top_k');
      }
    });
  });

  describe('generateContent', () => {
    it('includes top_k when it is within 1 - 40', async () => {
      const reqWithEmptyConfigs: GenerateContentRequest = {
        contents: TEST_USER_CHAT_MESSAGE_WITH_GCS_FILE,
        generation_config: {top_k: 1},
        safety_settings: [],
      };
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      const expectedStreamResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGenerator(),
      };
      spyOn(StreamFunctions, 'processStream').and.returnValue(
        expectedStreamResult
      );
      await model.generateContent(reqWithEmptyConfigs);
      const requestArgs = fetchSpy.calls.allArgs()[0][1];
      if (typeof requestArgs === 'object' && requestArgs) {
        expect(JSON.stringify(requestArgs['body'])).toContain('top_k');
      }
    });
  });

  describe('generateContent', () => {
    it('aggregates citation metadata', async () => {
      const req: GenerateContentRequest = {
        contents: TEST_USER_CHAT_MESSAGE,
      };
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      const expectedStreamResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGenerator(),
      };
      spyOn(StreamFunctions, 'processStream').and.returnValue(
        expectedStreamResult
      );
      const resp = await model.generateContent(req);
      expect(
        resp.response.candidates[0].citationMetadata?.citationSources.length
      ).toEqual(
        TEST_MODEL_RESPONSE.candidates[0].citationMetadata.citationSources
          .length
      );
    });
  });

  describe('generateContentStream', () => {
    it('returns a GenerateContentResponse when passed text content', async () => {
      const req: GenerateContentRequest = {
        contents: TEST_USER_CHAT_MESSAGE,
      };
      const expectedResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGenerator(),
      };
      spyOn(StreamFunctions, 'processStream').and.returnValue(expectedResult);
      const resp = await model.generateContentStream(req);
      expect(resp).toEqual(expectedResult);
    });
    it('returns a GenerateContentResponse when passed a string', async () => {
      const expectedResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGenerator(),
      };
      spyOn(StreamFunctions, 'processStream').and.returnValue(expectedResult);
      const resp = await model.generateContentStream(TEST_CHAT_MESSSAGE_TEXT);
      expect(resp).toEqual(expectedResult);
    });
  });

  describe('generateContentStream', () => {
    it('returns a GenerateContentResponse when passed multi-part content with a GCS URI', async () => {
      const req: GenerateContentRequest = {
        contents: TEST_MULTIPART_MESSAGE,
      };
      const expectedResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGenerator(),
      };
      spyOn(StreamFunctions, 'processStream').and.returnValue(expectedResult);
      const resp = await model.generateContentStream(req);
      expect(resp).toEqual(expectedResult);
    });
  });

  // TODO: add a streaming test with a multipart message and inline image data
  // (b64 string)

  describe('startChat', () => {
    it('returns a ChatSession when passed a request arg', () => {
      const req: StartChatParams = {
        history: TEST_USER_CHAT_MESSAGE,
      };
      const resp = model.startChat(req);
      expect(resp).toBeInstanceOf(ChatSession);
    });
    it('returns a ChatSession when passed no request arg', () => {
      const resp = model.startChat();
      expect(resp).toBeInstanceOf(ChatSession);
    });
  });
});

describe('countTokens', () => {
  it('returns the token count', async () => {
    const vertexai = new VertexAI({
      project: PROJECT,
      location: LOCATION,
    });
    spyOnProperty(vertexai.preview, 'token', 'get').and.resolveTo(TEST_TOKEN);
    const model = vertexai.preview.getGenerativeModel({model: 'gemini-pro'});
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
});

describe('ChatSession', () => {
  let chatSession: ChatSession;
  let chatSessionWithNoArgs: ChatSession;
  let vertexai: VertexAI;
  let model: GenerativeModel;
  let expectedStreamResult: StreamGenerateContentResult;

  beforeEach(() => {
    vertexai = new VertexAI({project: PROJECT, location: LOCATION});
    spyOnProperty(vertexai.preview, 'token', 'get').and.resolveTo(TEST_TOKEN);
    model = vertexai.preview.getGenerativeModel({model: 'gemini-pro'});
    chatSession = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
    });
    expect(chatSession.history).toEqual(TEST_USER_CHAT_MESSAGE);
    chatSessionWithNoArgs = model.startChat();
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
      const expectedStreamResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGenerator(),
      };
      spyOn(StreamFunctions, 'processStream').and.returnValue(
        expectedStreamResult
      );
      const resp = await chatSession.sendMessage(req);
      expect(resp).toEqual(expectedResult);
      expect(chatSession.history.length).toEqual(3);
    });

    it('returns a GenerateContentResponse and appends to history when startChat is passed with no args', async () => {
      const req = 'How are you doing today?';
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      const expectedStreamResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGenerator(),
      };
      spyOn(StreamFunctions, 'processStream').and.returnValue(
        expectedStreamResult
      );
      const resp = await chatSessionWithNoArgs.sendMessage(req);
      expect(resp).toEqual(expectedResult);
      expect(chatSessionWithNoArgs.history.length).toEqual(2);
    });

    // TODO: unbreak this test. Currently chatSession.history is saving the
    // history from the test above instead of resetting and
    // expect.toThrowError() is erroring out before the expect condition is
    // called
    it('throws an error when the model returns an empty response', async () => {
      // Reset the chat session history

      const req = 'How are you doing today?';
      const expectedResult: GenerateContentResult = {
        response: TEST_EMPTY_MODEL_RESPONSE,
      };
      const expectedStreamResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGenerator(),
      };
      spyOn(StreamFunctions, 'processStream').and.returnValue(
        expectedStreamResult
      );
      // Shouldn't append anything to history with an empty result
      // expect(chatSession.history.length).toEqual(1);
      // expect(await chatSession.sendMessage(req))
      //     .toThrowError('Did not get a response from the model');
    });
    // TODO: add test cases for different content types passed to
    // sendMessage
  });

  describe('sendMessageStram', () => {
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
      spyOn(StreamFunctions, 'processStream').and.returnValue(expectedResult);
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
      spyOn(StreamFunctions, 'processStream').and.returnValue(expectedResult);
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
  });
});

describe('when exception at fetch', () => {
  const expectedErrorMessage =
    '[VertexAI.GoogleGenerativeAIError]: exception posting request';
  const vertexai = new VertexAI({
    project: PROJECT,
    location: LOCATION,
  });
  const model = vertexai.preview.getGenerativeModel({model: 'gemini-pro'});
  const chatSession = model.startChat();
  const message = 'hi';
  const req: GenerateContentRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  const countTokenReq: CountTokensRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  beforeEach(() => {
    spyOnProperty(vertexai.preview, 'token', 'get').and.resolveTo(TEST_TOKEN);
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

describe('when response is undefined', () => {
  const expectedErrorMessage =
    '[VertexAI.GoogleGenerativeAIError]: response is undefined';
  const vertexai = new VertexAI({
    project: PROJECT,
    location: LOCATION,
  });
  const model = vertexai.preview.getGenerativeModel({model: 'gemini-pro'});
  const req: GenerateContentRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  const message = 'hi';
  const chatSession = model.startChat();
  const countTokenReq: CountTokensRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  beforeEach(() => {
    spyOnProperty(vertexai.preview, 'token', 'get').and.resolveTo(TEST_TOKEN);
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

describe('when response is 4XX', () => {
  const expectedErrorMessage =
    '[VertexAI.ClientError]: got status: 400 Bad Request';
  const req: GenerateContentRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  const vertexai = new VertexAI({
    project: PROJECT,
    location: LOCATION,
  });
  const fetch400Obj = {
    status: 400,
    statusText: 'Bad Request',
    ok: false,
  };
  const body = {};
  const response = new Response(JSON.stringify(body), fetch400Obj);
  const model = vertexai.preview.getGenerativeModel({model: 'gemini-pro'});
  const message = 'hi';
  const chatSession = model.startChat();
  const countTokenReq: CountTokensRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  beforeEach(() => {
    spyOnProperty(vertexai.preview, 'token', 'get').and.resolveTo(TEST_TOKEN);
    spyOn(global, 'fetch').and.resolveTo(response);
  });

  it('generateContent should throw ClientError error', async () => {
    await expectAsync(model.generateContent(req)).toBeRejected();
    await model.generateContent(req).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });

  it('generateContentStream should throw ClientError error', async () => {
    await expectAsync(model.generateContentStream(req)).toBeRejected();
    await model.generateContentStream(req).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });

  it('sendMessage should throw ClientError error', async () => {
    await expectAsync(chatSession.sendMessage(message)).toBeRejected();
    await chatSession.sendMessage(message).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });

  it('countTokens should throw ClientError error', async () => {
    await expectAsync(model.countTokens(countTokenReq)).toBeRejected();
    await model.countTokens(countTokenReq).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });
});

describe('when response is not OK and not 4XX', () => {
  const expectedErrorMessage =
    '[VertexAI.GoogleGenerativeAIError]: got status: 500 Internal Server Error';
  const req: GenerateContentRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  const vertexai = new VertexAI({
    project: PROJECT,
    location: LOCATION,
  });
  const fetch500Obj = {
    status: 500,
    statusText: 'Internal Server Error',
    ok: false,
  };
  const body = {};
  const response = new Response(JSON.stringify(body), fetch500Obj);
  const model = vertexai.preview.getGenerativeModel({model: 'gemini-pro'});
  const message = 'hi';
  const chatSession = model.startChat();
  const countTokenReq: CountTokensRequest = {
    contents: TEST_USER_CHAT_MESSAGE,
  };
  beforeEach(() => {
    spyOnProperty(vertexai.preview, 'token', 'get').and.resolveTo(TEST_TOKEN);
    spyOn(global, 'fetch').and.resolveTo(response);
  });

  it('generateContent should throws GoogleGenerativeAIError', async () => {
    await expectAsync(model.generateContent(req)).toBeRejected();
    await model.generateContent(req).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });

  it('generateContentStream should throws GoogleGenerativeAIError', async () => {
    await expectAsync(model.generateContentStream(req)).toBeRejected();
    await model.generateContentStream(req).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });

  it('sendMessage should throws GoogleGenerativeAIError', async () => {
    await expectAsync(chatSession.sendMessage(message)).toBeRejected();
    await chatSession.sendMessage(message).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });

  it('countTokens should throws GoogleGenerativeAIError', async () => {
    await expectAsync(model.countTokens(countTokenReq)).toBeRejected();
    await model.countTokens(countTokenReq).catch(e => {
      expect(e.message).toEqual(expectedErrorMessage);
    });
  });
});
