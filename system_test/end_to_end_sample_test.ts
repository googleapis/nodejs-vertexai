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

// @ts-ignore
import * as assert from 'assert';

import {ClientError, VertexAI, TextPart} from '../src';

// TODO: this env var isn't getting populated correctly
const PROJECT = process.env.GCLOUD_PROJECT;
const LOCATION = 'us-central1';
const TEXT_REQUEST = {
  contents: [{role: 'user', parts: [{text: 'How are you doing today?'}]}],
};

const TEXT_PART = {
  text: 'What is this a picture of?',
};

const GCS_FILE_PART = {
  file_data: {
    file_uri: 'gs://nodejs_vertex_system_test_resources/scones.jpg',
    mime_type: 'image/jpeg',
  },
};
const BASE_64_IMAGE =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const INLINE_DATA_FILE_PART = {
  inline_data: {
    data: BASE_64_IMAGE,
    mime_type: 'image/jpeg',
  },
};

const MULTI_PART_GCS_REQUEST = {
  contents: [{role: 'user', parts: [TEXT_PART, GCS_FILE_PART]}],
};
const MULTI_PART_BASE64_REQUEST = {
  contents: [{role: 'user', parts: [TEXT_PART, INLINE_DATA_FILE_PART]}],
};

// Initialize Vertex with your Cloud project and location
const vertex_ai = new VertexAI({project: 'long-door-651', location: LOCATION});

const generativeTextModel = vertex_ai.preview.getGenerativeModel({
  model: 'gemini-pro',
  generation_config: {
    max_output_tokens: 256,
  },
});
const generativeTextModelWithPrefix = vertex_ai.preview.getGenerativeModel({
  model: 'models/gemini-pro',
  generation_config: {
    max_output_tokens: 256,
  },
});
const textModelNoOutputLimit = vertex_ai.preview.getGenerativeModel({
  model: 'gemini-pro',
});

const generativeVisionModel = vertex_ai.preview.getGenerativeModel({
  model: 'gemini-pro-vision',
});
const generativeVisionModelWithPrefix = vertex_ai.preview.getGenerativeModel({
  model: 'models/gemini-pro-vision',
});

// TODO (b/316599049): update tests to use jasmine expect syntax:
// expect(...).toBeInstanceOf(...)
describe('generateContentStream', () => {
  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
  });

  it('should should return a stream and aggregated response when passed text', async () => {
    const streamingResp =
      await generativeTextModel.generateContentStream(TEXT_REQUEST);

    for await (const item of streamingResp.stream) {
      assert(
        item.candidates[0],
        `sys test failure on generateContentStream, for item ${item}`
      );
    }

    const aggregatedResp = await streamingResp.response;
    assert(
      aggregatedResp.candidates[0],
      `sys test failure on generateContentStream for aggregated response: ${aggregatedResp}`
    );
  });
  it('should not return a invalid unicode', async () => {
    const streamingResp = await generativeTextModel.generateContentStream({
      contents: [{role: 'user', parts: [{text: '创作一首古诗'}]}],
    });

    for await (const item of streamingResp.stream) {
      assert(
        item.candidates[0],
        `sys test failure on generateContentStream, for item ${item}`
      );
      for (const candidate of item.candidates) {
        for (const part of candidate.content.parts as TextPart[]) {
          assert(
            !part.text.includes('\ufffd'),
            `sys test failure on generateContentStream, for item ${item}`
          );
        }
      }
    }

    const aggregatedResp = await streamingResp.response;
    assert(
      aggregatedResp.candidates[0],
      `sys test failure on generateContentStream for aggregated response: ${aggregatedResp}`
    );
  });
  it('should return a stream and aggregated response when passed multipart base64 content', async () => {
    const streamingResp = await generativeVisionModel.generateContentStream(
      MULTI_PART_BASE64_REQUEST
    );

    for await (const item of streamingResp.stream) {
      assert(
        item.candidates[0],
        `sys test failure on generateContentStream, for item ${item}`
      );
    }

    const aggregatedResp = await streamingResp.response;
    assert(
      aggregatedResp.candidates[0],
      `sys test failure on generateContentStream for aggregated response: ${aggregatedResp}`
    );
  });
  it('should throw ClientError when having invalid input', async () => {
    const badRequest = {
      contents: [
        {
          role: 'user',
          parts: [
            {text: 'describe this image:'},
            {inline_data: {mime_type: 'image/png', data: 'invalid data'}},
          ],
        },
      ],
    };
    await generativeVisionModel.generateContentStream(badRequest).catch(e => {
      assert(
        e instanceof ClientError,
        `sys test failure on generateContentStream when having bad request should throw ClientError but actually thrown ${e}`
      );
      assert(
        e.message === '[VertexAI.ClientError]: got status: 400 Bad Request',
        `sys test failure on generateContentStream when having bad request got wrong error message: ${e.message}`
      );
    });
  });
  // TODO: this is returning a 500 on the system test project
  // it('should should return a stream and aggregated response when passed
  // multipart GCS content',
  //    async () => {
  //      const streamingResp = await
  //      generativeVisionModel.generateContentStream(
  //          MULTI_PART_GCS_REQUEST);

  //      for await (const item of streamingResp.stream) {
  //        assert(item.candidates[0]);
  //        console.log('stream chunk: ', item);
  //      }

  //      const aggregatedResp = await streamingResp.response;
  //      assert(aggregatedResp.candidates[0]);
  //      console.log('aggregated response: ', aggregatedResp);
  //    });
});

// TODO (b/316599049): add tests for generateContent and sendMessage

describe('sendMessageStream', () => {
  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
  });
  it('should should return a stream and populate history when generation_config is passed to startChat', async () => {
    const chat = generativeTextModel.startChat({
      generation_config: {
        max_output_tokens: 256,
      },
    });
    const chatInput1 = 'How can I learn more about Node.js?';
    const result1 = await chat.sendMessageStream(chatInput1);
    for await (const item of result1.stream) {
      assert(
        item.candidates[0],
        `sys test failure on sendMessageStream, for item ${item}`
      );
    }
    const resp = await result1.response;
    assert(
      resp.candidates[0],
      `sys test failure on sendMessageStream for aggregated response: ${resp}`
    );
    expect(chat.history.length).toBe(2);
  });
  it('should should return a stream and populate history when startChat is passed no request obj', async () => {
    const chat = generativeTextModel.startChat();
    const chatInput1 = 'How can I learn more about Node.js?';
    const result1 = await chat.sendMessageStream(chatInput1);
    for await (const item of result1.stream) {
      assert(
        item.candidates[0],
        `sys test failure on sendMessageStream, for item ${item}`
      );
    }
    const resp = await result1.response;
    assert(
      resp.candidates[0],
      `sys test failure on sendMessageStream for aggregated response: ${resp}`
    );
    expect(chat.history.length).toBe(2);
  });
  it('should return chunks as they come in', async () => {
    const chat = textModelNoOutputLimit.startChat({});
    const chatInput1 = 'Tell me a story in 1000 words';
    const result1 = await chat.sendMessageStream(chatInput1);
    let firstChunkTimestamp = 0;
    let aggregatedResultTimestamp = 0;

    // To verify streaming is working correcty, we check that there is >= 2
    // second difference between the first chunk and the aggregated result
    const streamThreshold = 2000;

    for await (const item of result1.stream) {
      if (firstChunkTimestamp === 0) {
        firstChunkTimestamp = Date.now();
      }
    }
    await result1.response;
    aggregatedResultTimestamp = Date.now();
    expect(aggregatedResultTimestamp - firstChunkTimestamp).toBeGreaterThan(
      streamThreshold
    );
  });
});

describe('countTokens', () => {
  it('should should return a CountTokensResponse', async () => {
    const countTokensResp = await generativeTextModel.countTokens(TEXT_REQUEST);
    assert(
      countTokensResp.totalTokens,
      `sys test failure on countTokens, ${countTokensResp}`
    );
  });
});

describe('generateContentStream using models/model-id', () => {
  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
  });

  it('should should return a stream and aggregated response when passed text', async () => {
    const streamingResp =
      await generativeTextModelWithPrefix.generateContentStream(TEXT_REQUEST);

    for await (const item of streamingResp.stream) {
      assert(
        item.candidates[0],
        `sys test failure on generateContentStream using models/gemini-pro, for item ${item}`
      );
    }

    const aggregatedResp = await streamingResp.response;
    assert(
      aggregatedResp.candidates[0],
      `sys test failure on generateContentStream using models/gemini-pro for aggregated response: ${aggregatedResp}`
    );
  });

  it('should should return a stream and aggregated response when passed multipart base64 content when using models/gemini-pro-vision', async () => {
    const streamingResp =
      await generativeVisionModelWithPrefix.generateContentStream(
        MULTI_PART_BASE64_REQUEST
      );

    for await (const item of streamingResp.stream) {
      assert(
        item.candidates[0],
        `sys test failure on generateContentStream using models/gemini-pro-vision, for item ${item}`
      );
    }

    const aggregatedResp = await streamingResp.response;
    assert(
      aggregatedResp.candidates[0],
      `sys test failure on generateContentStream using models/gemini-pro-visionfor aggregated response: ${aggregatedResp}`
    );
  });
});
