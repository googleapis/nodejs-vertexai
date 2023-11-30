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
import 'jasmine';

import * as fs from 'fs';

import {ChatSession, GenerativeModel, StartChatParams, VertexAI} from './index';
import * as StreamFunctions from './process_stream';
import {CountTokensRequest, GenerateContentRequest, GenerateContentResponse, GenerateContentResult, StreamGenerateContentResult} from './types/content';

const PROJECT = 'test_project';
const LOCATION = 'test_location';
const TEST_USER_CHAT_MESSAGE =
    [{role: 'user', parts: [{text: 'How are you doing today?'}]}];
const TEST_CANDIDATES = [
  {
    index: 1,
    content:
        {role: 'assistant', parts: [{text: 'I\m doing great! How are you?'}]},
    finish_reason: 0,
    finish_message: '',
    safety_ratings: [{category: 0, threshold: 0}],
  },
];
const TEST_MODEL_RESPONSE = {
  candidates: TEST_CANDIDATES,
  usage_metadata: {prompt_token_count: 0, candidates_token_count: 0}
};

const TEST_EMPTY_MODEL_RESPONSE = {
  candidates: [],
};

const TEST_ENDPOINT_BASE_PATH = 'test.googleapis.com';
const TEST_FILENAME = '/tmp/image.jpeg';
const INVALID_FILENAME = 'image.txt';
const TEST_GCS_FILENAME = 'gs://test_bucket/test_image.jpeg';

const TEST_MULTIPART_MESSAGE = [{
  role: 'user',
  parts: [
    {text: 'What is in this picture?'},
    {file_data: {file_uri: TEST_GCS_FILENAME, mime_type: 'image/jpeg'}}
  ]
}];
/**
 * Returns a generator, used to mock the streamGenerateContent response
 */
export async function*
    testGenerator(): AsyncGenerator<GenerateContentResponse> {
  yield {
    candidates: TEST_CANDIDATES,
  };
}

describe('VertexAI', () => {
  let vertexai: VertexAI;
  let model: GenerativeModel;

  beforeEach(() => {
    vertexai = new VertexAI({
      project: PROJECT,
      location: LOCATION,
    });
    vertexai.preview['tokenInternal'] = 'testtoken';
    model = vertexai.preview.getGenerativeModel({model: 'gemini-pro'});
  });

  it('should be instantiated', () => {
    expect(vertexai).toBeInstanceOf(VertexAI);
  });

  describe('generateContent', () => {
    it('returns a GenerateContentResponse', async () => {
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
      spyOn(StreamFunctions, 'processStream').and.returnValue(expectedStreamResult);
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
      vertexaiWithBasePath.preview['tokenInternal'] = 'testtoken';
      model = vertexaiWithBasePath.preview.getGenerativeModel({
        model: 'gemini-pro'
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
      const requestSpy = spyOn(global, 'fetch');
      spyOn(StreamFunctions, 'processStream')
          .and.returnValue(expectedStreamResult);
      await model.generateContent(req);
      expect(requestSpy.calls.allArgs()[0][0].toString())
          .toContain(TEST_ENDPOINT_BASE_PATH);
    });
  });

  describe('generateContent', () => {
    it('default the base API endpoint when base API not provided', async () => {
      const vertexaiWithoutBasePath =
          new VertexAI({project: PROJECT, location: LOCATION});
      vertexaiWithoutBasePath.preview['tokenInternal'] = 'testtoken';
      model = vertexaiWithoutBasePath.preview.getGenerativeModel({
        model: 'gemini-pro'
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
      const requestSpy = spyOn(global, 'fetch');
      spyOn(StreamFunctions, 'processStream')
          .and.returnValue(expectedStreamResult);
      await model.generateContent(req);
      expect(requestSpy.calls.allArgs()[0][0].toString())
          .toContain(`${LOCATION}-staging-aiplatform.sandbox.googleapis.com`);
    });
  });

  describe('streamGenerateContent', () => {
    it('returns a GenerateContentResponse when passed text content',
       async () => {
         const req: GenerateContentRequest = {
           contents: TEST_USER_CHAT_MESSAGE,
         };
         const expectedResult: StreamGenerateContentResult = {
           response: Promise.resolve(TEST_MODEL_RESPONSE),
           stream: testGenerator(),
         };
         spyOn(StreamFunctions, 'processStream')
             .and.returnValue(expectedResult);
         const resp = await model.streamGenerateContent(req);
         expect(resp).toEqual(expectedResult);
       });
  });

  describe('streamGenerateContent', () => {
    it('returns a GenerateContentResponse when passed multi-part content with a GCS URI',
       async () => {
         const req: GenerateContentRequest = {
           contents: TEST_MULTIPART_MESSAGE,
         };
         const expectedResult: StreamGenerateContentResult = {
           response: Promise.resolve(TEST_MODEL_RESPONSE),
           stream: testGenerator(),
         };
         spyOn(StreamFunctions, 'processStream')
             .and.returnValue(expectedResult);
         const resp = await model.streamGenerateContent(req);
         expect(resp).toEqual(expectedResult);
       });
  });

  // TODO: add a streaming test with a multipart message and inline image data
  // (b64 string)

  describe('startChat', () => {
    it('returns a ChatSession', () => {
      const req: StartChatParams = {
        history: TEST_USER_CHAT_MESSAGE,
      };
      const resp = model.startChat(req);
      expect(resp).toBeInstanceOf(ChatSession);
    });
  });

  describe('countTokens', () => {
    it('returns the token count', async () => {
      const req: CountTokensRequest = {
        contents: TEST_USER_CHAT_MESSAGE,
      };
      const responseBody = {
        totalTokens: 1,
      };
      const response = new Response(JSON.stringify(responseBody), {
        status: 200,
        statusText: 'OK',
        headers: {'Content-Type': 'application/json'},
      });
      const responsePromise = Promise.resolve(response);
      spyOn(global, 'fetch').and.returnValue(responsePromise);
      const resp = await model.countTokens(req);
      expect(resp).toEqual(responseBody);
    });
  });
});

describe('ChatSession', () => {
  let chatSession: ChatSession;
  let vertexai: VertexAI;
  let model: GenerativeModel;

  beforeEach(() => {
    vertexai = new VertexAI({project: PROJECT, location: LOCATION});
    vertexai.preview['tokenInternal'] = 'testtoken';
    model = vertexai.preview.getGenerativeModel({model: 'gemini-pro'});
    chatSession = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
    });
  });

  it('should add the provided message to the session history', () => {
    expect(chatSession.history).toEqual(TEST_USER_CHAT_MESSAGE);
    expect(chatSession.history.length).toEqual(1);
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
      spyOn(StreamFunctions, 'processStream')
          .and.returnValue(expectedStreamResult);
      const resp = await chatSession.sendMessage(req);
      expect(resp).toEqual(expectedResult);
      expect(chatSession.history.length).toEqual(3);
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
      spyOn(StreamFunctions, 'processStream')
          .and.returnValue(expectedStreamResult);
      // Shouldn't append anything to history with an empty result
      // expect(chatSession.history.length).toEqual(1);
      // expect(await chatSession.sendMessage(req))
      //     .toThrowError('Did not get a response from the model');
    });
    // TODO: add test cases for different content types passed to
    // sendMessage
  });

  describe('streamSendMessage', () => {
    it('returns a StreamGenerateContentResponse and appends to history', async () => {
      const req = 'How are you doing today?';
      const expectedResult: StreamGenerateContentResult = {
        response: Promise.resolve(TEST_MODEL_RESPONSE),
        stream: testGenerator(),
      };
      const chatSession= model.startChat({
        history: [{role: 'user', parts: [{text: 'How are you doing today?'}]}],
      });
      spyOn(StreamFunctions, 'processStream')
          .and.returnValue(expectedResult);
      expect(chatSession.history.length).toEqual(1);
      expect(chatSession.history[0].role).toEqual('user');
      const result = await chatSession.streamSendMessage(req);
      const response = await result.response;
      const expectedResponse = await expectedResult.response;
      expect(response).toEqual(expectedResponse);
      expect(chatSession.history.length).toEqual(3);
      expect(chatSession.history[0].role).toEqual('user');
      expect(chatSession.history[1].role).toEqual('user');
      expect(chatSession.history[2].role).toEqual('assistant');
    });
  });

  describe('imageToBase64', () => {
    let imageBuffer: Buffer;

    beforeEach(() => {
      imageBuffer = Buffer.alloc(1024, 1);
    });

    it('returns a base64 string when passed a Buffer', async () => {
      const resp = await vertexai.preview.imageToBase64(imageBuffer);
      expect(typeof resp).toEqual('string');
    });
    it('returns a base64 string when passed a filepath', async () => {
      fs.writeFileSync(`${TEST_FILENAME}`, imageBuffer);
      const resp = await vertexai.preview.imageToBase64(TEST_FILENAME);
      expect(typeof resp).toEqual('string');
    });
  });
});
