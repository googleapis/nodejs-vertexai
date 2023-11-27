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

import {ChatSession, GenerativeModel, StartChatParams, VertexAI} from './index';
import * as StreamFunctions from './process_stream';
import {GenerateContentParams, GenerateContentResult} from './types/content';
import * as PostRequest from './util/post_request';

const PROJECT = 'test_project';
const LOCATION = 'test_location';
const MODEL_ID = 'test_model_id';
const TEST_USER_CHAT_MESSAGE =
    [{role: 'user', parts: [{text: 'How are you doing today?'}]}];
const TEST_MODEL_RESPONSE = [{
  candidates: [
    {
      index: 1,
      content:
          {role: 'assistant', parts: [{text: 'I\m doing great! How are you?'}]},
      finish_reason: 0,
      finish_message: '',
      safety_ratings: [{category: 0, threshold: 0}],
    },
  ],
  usage_metadata: {prompt_token_count: 0, candidates_token_count: 0}

}];

const TEST_ENDPOINT_BASE_PATH = 'test.googleapis.com';

describe('VertexAI', () => {
  let vertexai: VertexAI;
  let model: GenerativeModel;

  beforeEach(() => {
    vertexai = new VertexAI(PROJECT, LOCATION);
    vertexai.preview['tokenInternal'] = 'testtoken';
    model = vertexai.preview.getGenerativeModel({model: 'gemini-pro'});
  });

  it('should be instantiated', () => {
    expect(vertexai).toBeInstanceOf(VertexAI);
  });

  // TODO: update this test when stream and unary implementation is separated
  describe('generateContent', () => {
    it('returns a GenerateContentResponse when stream=false', async () => {
      const req: GenerateContentParams = {
        contents: TEST_USER_CHAT_MESSAGE,
        stream: false,
      };
      const expectedResult: GenerateContentResult = {
        responses: TEST_MODEL_RESPONSE,
      };
      spyOn(StreamFunctions, 'processStream').and.returnValue(expectedResult);
      const resp = await model.generateContent(req);
      expect(resp).toEqual(expectedResult);
    });
    // TODO: add test from stream=true here
  });

  describe('generateContent', () => {
    it('updates the base API endpoint when provided', async () => {
      const vertexaiWithBasePath =
          new VertexAI(PROJECT, LOCATION, TEST_ENDPOINT_BASE_PATH);
      vertexaiWithBasePath.preview['tokenInternal'] = 'testtoken';
      model = vertexaiWithBasePath.preview.getGenerativeModel({
        model: 'gemini-pro'
      });

      const req: GenerateContentParams = {
        contents: TEST_USER_CHAT_MESSAGE,
        stream: false,
      };
      const expectedResult: GenerateContentResult = {
        responses: TEST_MODEL_RESPONSE,
      };
      const requestSpy = spyOn(global, 'fetch');
      spyOn(StreamFunctions,
      'processStream').and.returnValue(expectedResult); await
      model.generateContent(req);
      expect(requestSpy.calls.allArgs()[0][0].toString())
          .toContain(TEST_ENDPOINT_BASE_PATH);
    });
  });

  describe('generateContent', () => {
    it('default the base API endpoint when base API not provided', async () => {
      const vertexaiWithoutBasePath =
          new VertexAI(PROJECT, LOCATION);
      vertexaiWithoutBasePath.preview['tokenInternal'] = 'testtoken';
      model = vertexaiWithoutBasePath.preview.getGenerativeModel({
        model: 'gemini-pro'
      });

      const req: GenerateContentParams = {
        contents: TEST_USER_CHAT_MESSAGE,
        stream: false,
      };
      const expectedResult: GenerateContentResult = {
        responses: TEST_MODEL_RESPONSE,
      };
      const requestSpy = spyOn(global, 'fetch');
      spyOn(StreamFunctions,
      'processStream').and.returnValue(expectedResult); await
      model.generateContent(req);
      expect(requestSpy.calls.allArgs()[0][0].toString())
          .toContain(`${LOCATION}-autopush-aiplatform.sandbox.googleapis.com`);
    });
  });

  describe('startChat', () => {
    it('returns a ChatSession', () => {
      const req: StartChatParams = {
        history: TEST_USER_CHAT_MESSAGE,
      };
      const resp = model.startChat(req);
      expect(resp).toBeInstanceOf(ChatSession);
    });
  });
});

describe('ChatSession', () => {
  let chatSession: ChatSession;
  let vertexai: VertexAI;

  beforeEach(() => {
    vertexai = new VertexAI(PROJECT, LOCATION);
    vertexai.preview['tokenInternal'] = 'testtoken';
    const model = vertexai.preview.getGenerativeModel({model: 'gemini-pro'});
    chatSession = model.startChat({
      history: TEST_USER_CHAT_MESSAGE,
    });
  });

  it('should add the provided message to the session history', () => {
    expect(chatSession.history).toEqual(TEST_USER_CHAT_MESSAGE);
    expect(chatSession.history.length).toEqual(1);
  });

  describe('sendMessage', () => {
    it('returns a GenerateContentResponse', async () => {
      const req = 'How are you doing today?';
      const expectedResult: GenerateContentResult = {
        responses: TEST_MODEL_RESPONSE,
        stream: StreamFunctions.emptyGenerator(),
      };
      spyOn(StreamFunctions, 'processStream').and.returnValue(expectedResult);
      const resp = await chatSession.sendMessage(req);
      expect(resp).toEqual(expectedResult);
      expect(chatSession.history.length).toEqual(3);
    });

    // TODO: add test cases for different content types passed to sendMessage
  });
});
