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
import {VertexAI} from '@google-cloud/vertexai';

const PROJECT = 'cloud-llm-preview1'; // TODO: change this to infer from Kokoro env
const LOCATION = 'us-central1';
const TEXT_REQUEST = {
  contents: [{role: 'user', parts: [{text: 'How are you doing today?'}]}],
};

const TEXT_PART = {
  text: 'What is this a picture of?',
};
const GCS_FILE_PART = {
  file_data: {
    file_uri: 'gs://generativeai-downloads/images/scones.jpg',
    mime_type: 'image/jpeg',
  },
};
const MULTI_PART_REQUEST = {
  contents: [{role: 'user', parts: [TEXT_PART, GCS_FILE_PART]}],
};

// Initialize Vertex with your Cloud project and location
const vertex_ai = new VertexAI({project: PROJECT, location: LOCATION});

const generativeTextModel = vertex_ai.preview.getGenerativeModel({
  model: 'gemini-pro',
});

const generativeVisionModel = vertex_ai.preview.getGenerativeModel({
  model: 'gemini-vision-pro',
});

async function testGenerateContentStreamText() {
  const streamingResp =
      await generativeTextModel.generateContentStream(TEXT_REQUEST);

  for await (const item of streamingResp.stream) {
    console.log('stream chunk:', item);
  }

  console.log('aggregated response: ', await streamingResp.response);
}

async function testGenerateContentStreamMultiPart() {
  const streamingResp =
      await generativeVisionModel.generateContentStream(MULTI_PART_REQUEST);

  for await (const item of streamingResp.stream) {
    console.log('stream chunk:', item);
  }

  console.log('aggregated response: ', await streamingResp.response);
}

async function testCountTokens() {
  const countTokensResp = await generativeVisionModel.countTokens(TEXT_REQUEST);
  console.log('count tokens response: ', countTokensResp);
}

testGenerateContentStreamText();
testGenerateContentStreamMultiPart();
testCountTokens();
