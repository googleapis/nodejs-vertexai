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

import {GoogleAuth} from 'google-auth-library';

import * as StreamFunctions from '../../functions/post_fetch_processing';
import {
  FinishReason,
  FunctionDeclarationSchemaType,
  GenerateContentResponse,
  GenerateContentResult,
  HarmCategory,
  HarmProbability,
  SafetyRating,
  StreamGenerateContentResult,
  Tool,
} from '../../types/content';
import {constants} from '../../util';
import {ChatSessionPreview} from '../chat_session';
import {GenerativeModelPreview} from '../generative_models';

const PROJECT = 'test_project';
const LOCATION = 'test_location';
const googleAuth = new GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/cloud-platform',
});
const TEST_CHAT_MESSSAGE_TEXT = 'How are you doing today?';
const TEST_USER_CHAT_MESSAGE = [
  {role: constants.USER_ROLE, parts: [{text: TEST_CHAT_MESSSAGE_TEXT}]},
];
const TEST_TOKEN = 'testtoken';

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
const TEST_MODEL_RESPONSE_MISSING_ROLE = {
  candidates: TEST_CANDIDATES_MISSING_ROLE,
  usage_metadata: {prompt_token_count: 0, candidates_token_count: 0},
};
const TEST_EMPTY_MODEL_RESPONSE = {
  candidates: [],
};

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

export async function* testGeneratorWithEmptyResponse(): AsyncGenerator<GenerateContentResponse> {
  yield {
    candidates: [],
  };
}

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
    spyOnProperty(model, 'token', 'get').and.resolveTo(TEST_TOKEN);
    chatSession = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
    });
    expect(chatSession.history).toEqual(TEST_USER_CHAT_MESSAGE);
    chatSessionWithNoArgs = model.startChat();
    chatSessionWithEmptyResponse = model.startChat();
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
      const req = 'How are you doing today?';
      const expectedResult: GenerateContentResult = {
        response: TEST_MODEL_RESPONSE,
      };
      spyOn(StreamFunctions, 'processNonStream').and.returnValue(
        expectedResult
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
      spyOn(StreamFunctions, 'processNonStream').and.returnValue(
        expectedResult
      );
      const resp = await chatSessionWithNoArgs.sendMessage(req);
      expect(resp).toEqual(expectedResult);
      expect(chatSessionWithNoArgs.history.length).toEqual(2);
    });

    it('throws an error when the model returns an empty response', async () => {
      const req = 'How are you doing today?';
      const expectedResult: GenerateContentResult = {
        response: TEST_EMPTY_MODEL_RESPONSE,
      };
      spyOn(StreamFunctions, 'processNonStream').and.returnValue(
        expectedResult
      );
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
      spyOn(StreamFunctions, 'processNonStream').and.returnValue(
        expectedResult
      );
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

      streamSpy.and.returnValue(expectedResult);
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
      streamSpy.and.returnValue(expectedFollowUpResult);
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

    it('returns a FunctionCall and appends to history when passed a FunctionDeclaration', async () => {
      const functionCallChatMessage = 'What is the weather in LA?';
      const expectedStreamResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE_WITH_FUNCTION_CALL),
        stream: testGenerator(),
      };

      const streamSpy = spyOn(StreamFunctions, 'processStream');

      streamSpy.and.returnValue(expectedStreamResult);
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
      streamSpy.and.returnValue(expectedFollowUpStreamResult);
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
