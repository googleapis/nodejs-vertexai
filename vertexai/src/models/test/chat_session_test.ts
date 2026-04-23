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
import {ChatSession, ChatSessionPreview} from '../chat_session';
import {
  Content,
  FunctionDeclarationSchemaType,
  GenerateContentCandidate,
  GenerateContentRequest,
  GenerateContentResponse,
  HarmBlockThreshold,
  HarmCategory,
  RequestOptions,
  SafetySetting,
  StartChatSessionRequest,
  Tool,
} from '../../types';
import * as GenerateContentFunctions from '../../functions/generate_content';
import {createFakeGoogleAuth} from '../../testing/fake_google_auth';

const PROJECT = 'test_project';
const LOCATION = 'test_location';
const TEST_TOKEN = 'testtoken';
const FAKE_GOOGLE_AUTH = createFakeGoogleAuth({
  scopes: 'https://www.googleapis.com/auth/cloud-platform',
  accessToken: TEST_TOKEN,
});
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
const TEST_REQUEST_OPTIONS = {
  timeout: 0,
};
const TEST_SYSTEM_INSTRUCTION_TEXT = 'system instruction';
const TEST_SYSTEM_INSTRUCTION = {
  role: constants.SYSTEM_ROLE,
  parts: [{text: TEST_SYSTEM_INSTRUCTION_TEXT}],
};

const MODEL_NAME = 'test_model';
const RESOURCE_PATH = `projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL_NAME}`;
const TEST_CHAT_MESSSAGE_TEXT_ROUND_1 = "what's the weather today?";
const TEST_CHAT_MESSSAGE_TEXT_ROUND_2 = [
  'how about tomorrow?',
  'Will it rain?',
];
const TEST_CHAT_MESSSAGE_CONTENT_ROUND_1 = {
  index: 0,
  content: {parts: [{text: TEST_CHAT_MESSSAGE_TEXT_ROUND_1}], role: 'user'},
} as GenerateContentCandidate;
const TEST_CHAT_MESSSAGE_CONTENT_ROUND_2 = {
  index: 0,
  content: {
    parts: TEST_CHAT_MESSSAGE_TEXT_ROUND_2.map(text => ({text})),
    role: 'user',
  },
} as GenerateContentCandidate;
const TEST_MODEL_RESPONSE_ROUND_1 = {
  response: {
    candidates: [
      {
        index: 0,
        content: {parts: [{text: "it's sunny today"}], role: 'model'},
      },
    ],
  } as GenerateContentResponse,
};
const TEST_MODEL_RESPONSE_ROUND_2 = {
  response: {
    candidates: [
      {
        index: 0,
        content: {parts: [{text: "it's rainy tomorrow"}], role: 'model'},
      },
    ],
  } as GenerateContentResponse,
};
describe('ChatSession', () => {
  const chatSessionTestCases = [
    (request: StartChatSessionRequest, requestOptions?: RequestOptions) =>
      new ChatSession(request, requestOptions),
    (request: StartChatSessionRequest, requestOptions?: RequestOptions) =>
      new ChatSessionPreview(request, requestOptions),
  ];

  describe('sendMessage should call internal functions and append response to history', () => {
    const testCases = [
      {
        name: 'when passed a string prompt in round 1 and list of strings in round 2',
        request: {
          resourcePath: RESOURCE_PATH,
          project: PROJECT,
          location: LOCATION,
          googleAuth: FAKE_GOOGLE_AUTH,
        },
        requestOptions: TEST_REQUEST_OPTIONS,
        sendMessageInputs: [
          TEST_CHAT_MESSSAGE_TEXT_ROUND_1,
          TEST_CHAT_MESSSAGE_TEXT_ROUND_2,
        ],
        generateContentCalledParams: [
          Object.values({
            location: LOCATION,
            resourcePath: RESOURCE_PATH,
            token: jasmine.any(Promise),
            request: jasmine.objectContaining({
              contents: [TEST_CHAT_MESSSAGE_CONTENT_ROUND_1.content],
            } as GenerateContentRequest),
            apiEndpoint: undefined,
            generationConfig: undefined,
            safetySettings: undefined,
            tools: undefined,
            toolConfig: undefined,
            requestOptions: TEST_REQUEST_OPTIONS,
          }),
          Object.values({
            location: LOCATION,
            resourcePath: RESOURCE_PATH,
            token: jasmine.any(Promise),
            request: jasmine.objectContaining({
              contents: [
                TEST_CHAT_MESSSAGE_CONTENT_ROUND_1.content,
                TEST_MODEL_RESPONSE_ROUND_1.response!.candidates![0].content,
                TEST_CHAT_MESSSAGE_CONTENT_ROUND_2.content,
              ],
            } as GenerateContentRequest),
            apiEndpoint: undefined,
            generationConfig: undefined,
            safetySettings: undefined,
            tools: undefined,
            toolConfig: undefined,
            requestOptions: TEST_REQUEST_OPTIONS,
          }),
        ],
        generateContentReturns: [
          TEST_MODEL_RESPONSE_ROUND_1,
          TEST_MODEL_RESPONSE_ROUND_2,
        ],
      },
      {
        name: 'when pass params at class constructor level',
        request: {
          resourcePath: RESOURCE_PATH,
          project: PROJECT,
          location: LOCATION,
          googleAuth: FAKE_GOOGLE_AUTH,
          systemInstruction: TEST_SYSTEM_INSTRUCTION,
          history: [] as Content[],
          safetySettings: TEST_SAFETY_SETTINGS,
          generationConfig: TEST_GENERATION_CONFIG,
          tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
          toolConfig: {},
          apiEndpoint: TEST_ENDPOINT_BASE_PATH,
        } as StartChatSessionRequest,
        requestOptions: TEST_REQUEST_OPTIONS,
        sendMessageInputs: [TEST_CHAT_MESSSAGE_TEXT_ROUND_1],
        generateContentCalledParams: [
          Object.values({
            location: LOCATION,
            resourcePath: RESOURCE_PATH,
            token: jasmine.any(Promise),
            request: jasmine.objectContaining({
              contents: [TEST_CHAT_MESSSAGE_CONTENT_ROUND_1.content],
            } as GenerateContentRequest),
            apiEndpoint: TEST_ENDPOINT_BASE_PATH,
            generationConfig: TEST_GENERATION_CONFIG,
            safetySettings: TEST_SAFETY_SETTINGS,
            tools: TEST_TOOLS_WITH_FUNCTION_DECLARATION,
            toolConfig: {},
            requestOptions: TEST_REQUEST_OPTIONS,
          }),
        ],
        generateContentReturns: [TEST_MODEL_RESPONSE_ROUND_1],
      },
      {
        name: 'when passed a string prompt and set history at class constructor level',
        request: {
          resourcePath: RESOURCE_PATH,
          project: PROJECT,
          location: LOCATION,
          googleAuth: FAKE_GOOGLE_AUTH,
          history: [TEST_CHAT_MESSSAGE_CONTENT_ROUND_1.content],
        },
        requestOptions: TEST_REQUEST_OPTIONS,
        sendMessageInputs: [TEST_CHAT_MESSSAGE_TEXT_ROUND_1],
        generateContentCalledParams: [
          Object.values({
            location: LOCATION,
            resourcePath: RESOURCE_PATH,
            token: jasmine.any(Promise),
            request: jasmine.objectContaining({
              contents: [
                TEST_CHAT_MESSSAGE_CONTENT_ROUND_1.content,
                TEST_CHAT_MESSSAGE_CONTENT_ROUND_1.content,
              ],
            } as GenerateContentRequest),
            apiEndpoint: undefined,
            generationConfig: undefined,
            safetySettings: undefined,
            tools: undefined,
            toolConfig: undefined,
            requestOptions: TEST_REQUEST_OPTIONS,
          }),
        ],
        generateContentReturns: [TEST_MODEL_RESPONSE_ROUND_1],
      },
    ].flatMap(testCase =>
      chatSessionTestCases.map(createChatSession => ({
        createChatSession,
        ...testCase,
      }))
    );

    testCases.forEach((testCase: any) => {
      it(`${testCase.name} when call sendMessage`, async () => {
        const chatSession = testCase.createChatSession(
          testCase.request,
          testCase.requestOptions
        );
        const generateContentSpy: jasmine.Spy = spyOn(
          GenerateContentFunctions,
          'generateContent'
        );
        generateContentSpy.and.returnValues(
          Promise.resolve(testCase.generateContentReturns[0]),
          Promise.resolve(testCase.generateContentReturns[1])
        );

        // Round 1.
        const round1Result = await chatSession.sendMessage(
          testCase.sendMessageInputs[0]
        );

        expect(generateContentSpy).toHaveBeenCalledWith(
          ...testCase.generateContentCalledParams[0]
        );
        expect(round1Result).toEqual(testCase.generateContentReturns[0]);
        let expectedHistory;
        if (testCase.request.history) {
          expectedHistory = [
            ...(testCase.request.history ?? []),
            TEST_CHAT_MESSSAGE_CONTENT_ROUND_1.content,
            testCase.generateContentReturns[0].response.candidates[0].content,
          ];
        } else {
          expectedHistory = [
            TEST_CHAT_MESSSAGE_CONTENT_ROUND_1.content,
            testCase.generateContentReturns[0].response.candidates[0].content,
          ];
        }
        expect(await chatSession.getHistory()).toEqual(expectedHistory);

        if (testCase.sendMessageInputs.length > 1) {
          // Round 2.
          const round2Result = await chatSession.sendMessage(
            testCase.sendMessageInputs[1]
          );

          expect(generateContentSpy).toHaveBeenCalledWith(
            ...testCase.generateContentCalledParams[1]
          );
          expect(round2Result).toEqual(testCase.generateContentReturns[1]);
          expect(await chatSession.getHistory()).toEqual([
            TEST_CHAT_MESSSAGE_CONTENT_ROUND_1.content,
            testCase.generateContentReturns[0].response.candidates[0].content,
            TEST_CHAT_MESSSAGE_CONTENT_ROUND_2.content,
            testCase.generateContentReturns[1].response.candidates[0].content,
          ]);
        }
      });

      it(`${testCase.name} when call sendMessageStream`, async () => {
        const chatSession = testCase.createChatSession(
          testCase.request,
          testCase.requestOptions
        );
        const generateContentSpy: jasmine.Spy = spyOn(
          GenerateContentFunctions,
          'generateContentStream'
        );
        generateContentSpy.and.returnValues(
          Promise.resolve(testCase.generateContentReturns[0]),
          Promise.resolve(testCase.generateContentReturns[1])
        );

        // Round 1.
        const round1Result = await chatSession.sendMessageStream(
          testCase.sendMessageInputs[0]
        );

        expect(generateContentSpy).toHaveBeenCalledWith(
          ...testCase.generateContentCalledParams[0]
        );
        expect(round1Result).toEqual(testCase.generateContentReturns[0]);
        let expectedHistory;
        if (testCase.request.history) {
          expectedHistory = [
            ...(testCase.request.history ?? []),
            TEST_CHAT_MESSSAGE_CONTENT_ROUND_1.content,
            testCase.generateContentReturns[0].response.candidates[0].content,
          ];
        } else {
          expectedHistory = [
            TEST_CHAT_MESSSAGE_CONTENT_ROUND_1.content,
            testCase.generateContentReturns[0].response.candidates[0].content,
          ];
        }
        expect(await chatSession.getHistory()).toEqual(expectedHistory);

        if (testCase.sendMessageInputs.length > 1) {
          // Round 2.
          const round2Result = await chatSession.sendMessageStream(
            testCase.sendMessageInputs[1]
          );

          expect(generateContentSpy).toHaveBeenCalledWith(
            ...testCase.generateContentCalledParams[1]
          );
          expect(round2Result).toEqual(testCase.generateContentReturns[1]);
          expect((await chatSession.getHistory()).slice(-4)).toEqual([
            TEST_CHAT_MESSSAGE_CONTENT_ROUND_1.content,
            testCase.generateContentReturns[0].response.candidates[0].content,
            TEST_CHAT_MESSSAGE_CONTENT_ROUND_2.content,
            testCase.generateContentReturns[1].response.candidates[0].content,
          ]);
        }
      });
    });
  });
});
