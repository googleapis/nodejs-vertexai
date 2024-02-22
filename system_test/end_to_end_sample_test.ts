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
import {
  ClientError,
  FunctionDeclarationsTool,
  GoogleSearchRetrievalTool,
  TextPart,
  VertexAI,
} from '../src';
import {FunctionDeclarationSchemaType} from '../src/types';

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
    file_uri: 'gs://generativeai-downloads/images/scones.jpg',
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

const FUNCTION_CALL_NAME = 'get_current_weather';

const TOOLS_WITH_FUNCTION_DECLARATION: FunctionDeclarationsTool[] = [
  {
    function_declarations: [
      {
        name: FUNCTION_CALL_NAME,
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

const WEATHER_FORECAST = 'super nice';
const FUNCTION_RESPONSE_PART = [
  {
    functionResponse: {
      name: FUNCTION_CALL_NAME,
      response: {
        name: FUNCTION_CALL_NAME,
        content: {weather: WEATHER_FORECAST},
      },
    },
  },
];

const FUNCTION_CALL = [
  {functionCall: {name: FUNCTION_CALL_NAME, args: {location: 'boston'}}},
];

// Initialize Vertex with your Cloud project and location
const vertex_ai = new VertexAI({
  project: PROJECT as string,
  location: LOCATION,
});

const generativeTextModel = vertex_ai.getGenerativeModel({
  model: 'gemini-1.0-pro',
  generation_config: {
    max_output_tokens: 256,
  },
});
const generativeTextModelPreview = vertex_ai.preview.getGenerativeModel({
  model: 'gemini-1.0-pro',
  generation_config: {
    max_output_tokens: 256,
  },
});
const generativeTextModelWithPrefix = vertex_ai.getGenerativeModel({
  model: 'models/gemini-1.0-pro',
  generation_config: {
    max_output_tokens: 256,
  },
});
const generativeTextModelWithPrefixPreview =
  vertex_ai.preview.getGenerativeModel({
    model: 'models/gemini-1.0-pro',
    generation_config: {
      max_output_tokens: 256,
    },
  });
const textModelNoOutputLimit = vertex_ai.getGenerativeModel({
  model: 'gemini-1.0-pro',
});
const textModelNoOutputLimitPreview = vertex_ai.preview.getGenerativeModel({
  model: 'gemini-1.0-pro',
});
const generativeVisionModel = vertex_ai.getGenerativeModel({
  model: 'gemini-1.0-pro-vision',
});
const generativeVisionModelPreview = vertex_ai.preview.getGenerativeModel({
  model: 'gemini-1.0-pro-vision',
});
const generativeVisionModelWithPrefix = vertex_ai.getGenerativeModel({
  model: 'models/gemini-1.0-pro-vision',
});
const generativeVisionModelWithPrefixPreview =
  vertex_ai.preview.getGenerativeModel({
    model: 'models/gemini-1.0-pro-vision',
  });
describe('generateContentStream', () => {
  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
  });

  it('should should return a stream and aggregated response when passed text', async () => {
    const streamingResp =
      await generativeTextModel.generateContentStream(TEXT_REQUEST);

    for await (const item of streamingResp.stream) {
      expect(item.candidates[0]).toBeTruthy(
        `sys test failure on generateContentStream, for item ${item}`
      );
    }

    const aggregatedResp = await streamingResp.response;
    expect(aggregatedResp.candidates[0]).toBeTruthy(
      `sys test failure on generateContentStream for testing candidates in aggregated response: ${aggregatedResp}`
    );
    expect(aggregatedResp.usageMetadata).toBeTruthy(
      `sys test failure on generateContentStream for testing usageMetadata in aggregated response: ${aggregatedResp}`
    );
  });
  it('in preview should should return a stream and aggregated response when passed text', async () => {
    const streamingResp =
      await generativeTextModelPreview.generateContentStream(TEXT_REQUEST);

    for await (const item of streamingResp.stream) {
      expect(item.candidates[0]).toBeTruthy(
        `sys test failure on generateContentStream in preview, for item ${item}`
      );
    }

    const aggregatedResp = await streamingResp.response;
    expect(aggregatedResp.candidates[0]).toBeTruthy(
      `sys test failure on generateContentStream in preview for testing candidates in aggregated response: ${aggregatedResp}`
    );
    expect(aggregatedResp.usageMetadata).toBeTruthy(
      `sys test failure on generateContentStream in preview for testing usageMetadata in aggregated response: ${aggregatedResp}`
    );
  });

  it('should not return a invalid unicode', async () => {
    const streamingResp = await generativeTextModel.generateContentStream({
      contents: [{role: 'user', parts: [{text: '创作一首古诗'}]}],
    });

    for await (const item of streamingResp.stream) {
      expect(item.candidates[0]).toBeTruthy(
        `sys test failure on generateContentStream, for item ${item}`
      );
      for (const candidate of item.candidates) {
        for (const part of candidate.content.parts as TextPart[]) {
          expect(part.text).not.toContain(
            '\ufffd',
            `sys test failure on generateContentStream, for item ${item}`
          );
        }
      }
    }

    const aggregatedResp = await streamingResp.response;
    expect(aggregatedResp.candidates[0]).toBeTruthy(
      `sys test failure on generateContentStream for aggregated response: ${aggregatedResp}`
    );
  });
  it('in preview should not return a invalid unicode', async () => {
    const streamingResp =
      await generativeTextModelPreview.generateContentStream({
        contents: [{role: 'user', parts: [{text: '创作一首古诗'}]}],
      });

    for await (const item of streamingResp.stream) {
      expect(item.candidates[0]).toBeTruthy(
        `sys test failure on generateContentStream in preview, for item ${item}`
      );
      for (const candidate of item.candidates) {
        for (const part of candidate.content.parts as TextPart[]) {
          expect(part.text).not.toContain(
            '\ufffd',
            `sys test failure on generateContentStream in preview, for item ${item}`
          );
        }
      }
    }

    const aggregatedResp = await streamingResp.response;
    expect(aggregatedResp.candidates[0]).toBeTruthy(
      `sys test failure on generateContentStream in preview for aggregated response: ${aggregatedResp}`
    );
  });

  it('should return a stream and aggregated response when passed multipart base64 content', async () => {
    const streamingResp = await generativeVisionModel.generateContentStream(
      MULTI_PART_BASE64_REQUEST
    );

    for await (const item of streamingResp.stream) {
      expect(item.candidates[0]).toBeTruthy(
        `sys test failure on generateContentStream, for item ${item}`
      );
    }

    const aggregatedResp = await streamingResp.response;
    expect(aggregatedResp.candidates[0]).toBeTruthy(
      `sys test failure on generateContentStream for aggregated response: ${aggregatedResp}`
    );
  });
  it('in preview should return a stream and aggregated response when passed multipart base64 content', async () => {
    const streamingResp =
      await generativeVisionModelPreview.generateContentStream(
        MULTI_PART_BASE64_REQUEST
      );

    for await (const item of streamingResp.stream) {
      expect(item.candidates[0]).toBeTruthy(
        `sys test failure on generateContentStream in preview, for item ${item}`
      );
    }

    const aggregatedResp = await streamingResp.response;
    expect(aggregatedResp.candidates[0]).toBeTruthy(
      `sys test failure on generateContentStream in preview for aggregated response: ${aggregatedResp}`
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
      expect(e).toBeInstanceOf(ClientError);
      expect(e.message).toContain(
        '[VertexAI.ClientError]: got status: 400 Bad Request',
        `sys test failure on generateContentStream when having bad request
          got wrong error message: ${e.message}`
      );
    });
  });
  it('in preview should throw ClientError when having invalid input', async () => {
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
    await generativeVisionModelPreview
      .generateContentStream(badRequest)
      .catch(e => {
        expect(e).toBeInstanceOf(ClientError);
        expect(e.message).toContain(
          '[VertexAI.ClientError]: got status: 400 Bad Request',
          `sys test failure on generateContentStream in preview when having bad request
          got wrong error message: ${e.message}`
        );
      });
  });

  it('should should return a stream and aggregated response when passed multipart GCS content', async () => {
    const streamingResp = await generativeVisionModel.generateContentStream(
      MULTI_PART_GCS_REQUEST
    );

    for await (const item of streamingResp.stream) {
      expect(item.candidates[0]).toBeTruthy(
        `sys test failure on generateContentStream, for item ${item}`
      );
    }

    const aggregatedResp = await streamingResp.response;
    expect(aggregatedResp.candidates[0]).toBeTruthy(
      `sys test failure on generateContentStream for aggregated response: ${aggregatedResp}`
    );
  });
  it('in preview should should return a stream and aggregated response when passed multipart GCS content', async () => {
    const streamingResp =
      await generativeVisionModelPreview.generateContentStream(
        MULTI_PART_GCS_REQUEST
      );

    for await (const item of streamingResp.stream) {
      expect(item.candidates[0]).toBeTruthy(
        `sys test failure on generateContentStream in preview, for item ${item}`
      );
    }

    const aggregatedResp = await streamingResp.response;
    expect(aggregatedResp.candidates[0]).toBeTruthy(
      `sys test failure on generateContentStream in preview for aggregated response: ${aggregatedResp}`
    );
  });

  it('should return a FunctionCall or text when passed a FunctionDeclaration or FunctionResponse', async () => {
    const request = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weather in Boston?'}]},
        {role: 'model', parts: FUNCTION_CALL},
        {role: 'function', parts: FUNCTION_RESPONSE_PART},
      ],
      tools: TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const streamingResp =
      await generativeTextModel.generateContentStream(request);
    for await (const item of streamingResp.stream) {
      expect(item.candidates[0]).toBeTruthy(
        `sys test failure on generateContentStream, for item ${item}`
      );
      expect(item.candidates[0].content.parts[0].text?.toLowerCase()).toContain(
        WEATHER_FORECAST
      );
    }
  });
  it('in preview should return a FunctionCall or text when passed a FunctionDeclaration or FunctionResponse', async () => {
    const request = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weather in Boston?'}]},
        {role: 'model', parts: FUNCTION_CALL},
        {role: 'function', parts: FUNCTION_RESPONSE_PART},
      ],
      tools: TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const streamingResp =
      await generativeTextModelPreview.generateContentStream(request);
    for await (const item of streamingResp.stream) {
      expect(item.candidates[0]).toBeTruthy(
        `sys test failure on generateContentStream in preview, for item ${item}`
      );
      expect(item.candidates[0].content.parts[0].text?.toLowerCase()).toContain(
        WEATHER_FORECAST
      );
    }
  });
});

describe('generateContent', () => {
  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
  });
  it('should return the aggregated response', async () => {
    const response = await generativeTextModel.generateContent(TEXT_REQUEST);

    const aggregatedResp = response.response;
    expect(aggregatedResp.candidates[0]).toBeTruthy(
      `sys test failure on generateContentStream for aggregated response: ${aggregatedResp}`
    );
  });
  it('in preview should return the aggregated response', async () => {
    const response =
      await generativeTextModelPreview.generateContent(TEXT_REQUEST);

    const aggregatedResp = response.response;
    expect(aggregatedResp.candidates[0]).toBeTruthy(
      `sys test failure on generateContentStream in preview for aggregated response: ${aggregatedResp}`
    );
  });
  xit('should return grounding metadata when passed GoogleSearchRetriever or Retriever', async () => {
    const generativeTextModel = vertex_ai.getGenerativeModel({
      model: 'gemini-pro',
      //tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    });
    const result = await generativeTextModel.generateContent({
      contents: [{role: 'user', parts: [{text: 'Why is the sky blue?'}]}],
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    });
    const response = result.response;
    const groundingMetadata = response.candidates[0].groundingMetadata;
    expect(groundingMetadata).toBeDefined();
    if (groundingMetadata) {
      // expect(groundingMetadata.groundingAttributions).toBeTruthy();
      expect(groundingMetadata.webSearchQueries).toBeTruthy();
    }
  });
});

describe('sendMessage', () => {
  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
  });
  it('should populate history and return a chat response', async () => {
    const chat = generativeTextModel.startChat();
    const chatInput1 = 'How can I learn more about Node.js?';
    const result1 = await chat.sendMessage(chatInput1);
    const response1 = result1.response;
    expect(response1.candidates[0]).toBeTruthy(
      `sys test failure on sendMessage for aggregated response: ${response1}`
    );
    expect(chat.history.length).toBe(2);
  });
  it('in preview should populate history and return a chat response', async () => {
    const chat = generativeTextModelPreview.startChat();
    const chatInput1 = 'How can I learn more about Node.js?';
    const result1 = await chat.sendMessage(chatInput1);
    const response1 = result1.response;
    expect(response1.candidates[0]).toBeTruthy(
      `sys test failure on sendMessage in preview for aggregated response: ${response1}`
    );
    expect(chat.history.length).toBe(2);
  });
});

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
      expect(item.candidates[0]).toBeTruthy(
        `sys test failure on sendMessageStream, for item ${item}`
      );
    }
    const resp = await result1.response;
    expect(resp.candidates[0]).toBeTruthy(
      `sys test failure on sendMessageStream for aggregated response: ${resp}`
    );
    expect(chat.history.length).toBe(2);
  });
  it('in preview should should return a stream and populate history when generation_config is passed to startChat', async () => {
    const chat = generativeTextModelPreview.startChat({
      generation_config: {
        max_output_tokens: 256,
      },
    });
    const chatInput1 = 'How can I learn more about Node.js?';
    const result1 = await chat.sendMessageStream(chatInput1);
    for await (const item of result1.stream) {
      expect(item.candidates[0]).toBeTruthy(
        `sys test failure on sendMessageStream in preview, for item ${item}`
      );
    }
    const resp = await result1.response;
    expect(resp.candidates[0]).toBeTruthy(
      `sys test failure on sendMessageStream in preview for aggregated response: ${resp}`
    );
    expect(chat.history.length).toBe(2);
  });

  it('should should return a stream and populate history when startChat is passed no request obj', async () => {
    const chat = generativeTextModel.startChat();
    const chatInput1 = 'How can I learn more about Node.js?';
    const result1 = await chat.sendMessageStream(chatInput1);
    for await (const item of result1.stream) {
      expect(item.candidates[0]).toBeTruthy(
        `sys test failure on sendMessageStream, for item ${item}`
      );
    }
    const resp = await result1.response;
    expect(resp.candidates[0]).toBeTruthy(
      `sys test failure on sendMessageStream for aggregated response: ${resp}`
    );
    expect(chat.history.length).toBe(2);
  });
  it('in preview should should return a stream and populate history when startChat is passed no request obj', async () => {
    const chat = generativeTextModelPreview.startChat();
    const chatInput1 = 'How can I learn more about Node.js?';
    const result1 = await chat.sendMessageStream(chatInput1);
    for await (const item of result1.stream) {
      expect(item.candidates[0]).toBeTruthy(
        `sys test failure on sendMessageStream in preview, for item ${item}`
      );
    }
    const resp = await result1.response;
    expect(resp.candidates[0]).toBeTruthy(
      `sys test failure on sendMessageStream in preview for aggregated response: ${resp}`
    );
    expect(chat.history.length).toBe(2);
  });

  xit('should return chunks as they come in', async () => {
    const chat = textModelNoOutputLimit.startChat({});
    const chatInput1 = 'Tell me a story in 3000 words';
    const result1 = await chat.sendMessageStream(chatInput1);
    let firstChunkTimestamp = 0;
    let aggregatedResultTimestamp = 0;

    const firstChunkFinalResultTimeDiff = 200; // ms

    for await (const item of result1.stream) {
      if (firstChunkTimestamp === 0) {
        firstChunkTimestamp = Date.now();
      }
    }
    await result1.response;
    aggregatedResultTimestamp = Date.now();
    expect(aggregatedResultTimestamp - firstChunkTimestamp).toBeGreaterThan(
      firstChunkFinalResultTimeDiff
    );
  });
  xit('in preview should return chunks as they come in', async () => {
    const chat = textModelNoOutputLimitPreview.startChat({});
    const chatInput1 = 'Tell me a story in 3000 words';
    const result1 = await chat.sendMessageStream(chatInput1);
    let firstChunkTimestamp = 0;
    let aggregatedResultTimestamp = 0;

    const firstChunkFinalResultTimeDiff = 200; // ms

    for await (const item of result1.stream) {
      if (firstChunkTimestamp === 0) {
        firstChunkTimestamp = Date.now();
      }
    }
    await result1.response;
    aggregatedResultTimestamp = Date.now();
    expect(aggregatedResultTimestamp - firstChunkTimestamp).toBeGreaterThan(
      firstChunkFinalResultTimeDiff
    );
  });

  it('should return a FunctionCall or text when passed a FunctionDeclaration or FunctionResponse', async () => {
    const chat = generativeTextModel.startChat({
      tools: TOOLS_WITH_FUNCTION_DECLARATION,
    });
    const chatInput1 = 'What is the weather in Boston?';
    const result1 = await chat.sendMessageStream(chatInput1);
    for await (const item of result1.stream) {
      expect(item.candidates[0]).toBeTruthy(
        `sys test failure on sendMessageStream with function calling, for item ${item}`
      );
    }
    const response1 = await result1.response;
    expect(
      JSON.stringify(response1.candidates[0].content.parts[0].functionCall)
    ).toContain(FUNCTION_CALL_NAME);
    expect(
      JSON.stringify(response1.candidates[0].content.parts[0].functionCall)
    ).toContain('location');

    // Send a follow up message with a FunctionResponse
    const result2 = await chat.sendMessageStream(FUNCTION_RESPONSE_PART);
    for await (const item of result2.stream) {
      expect(item.candidates[0]).toBeTruthy(
        `sys test failure on sendMessageStream with function calling, for item ${item}`
      );
    }
    const response2 = await result2.response;
    expect(
      JSON.stringify(response2.candidates[0].content.parts[0].text)
    ).toContain(WEATHER_FORECAST);
  });
  it('in preview should return a FunctionCall or text when passed a FunctionDeclaration or FunctionResponse', async () => {
    const chat = generativeTextModelPreview.startChat({
      tools: TOOLS_WITH_FUNCTION_DECLARATION,
    });
    const chatInput1 = 'What is the weather in Boston?';
    const result1 = await chat.sendMessageStream(chatInput1);
    for await (const item of result1.stream) {
      expect(item.candidates[0]).toBeTruthy(
        `sys test failure on sendMessageStream in preview with function calling, for item ${item}`
      );
    }
    const response1 = await result1.response;
    expect(
      JSON.stringify(response1.candidates[0].content.parts[0].functionCall)
    ).toContain(FUNCTION_CALL_NAME);
    expect(
      JSON.stringify(response1.candidates[0].content.parts[0].functionCall)
    ).toContain('location');

    // Send a follow up message with a FunctionResponse
    const result2 = await chat.sendMessageStream(FUNCTION_RESPONSE_PART);
    for await (const item of result2.stream) {
      expect(item.candidates[0]).toBeTruthy(
        `sys test failure on sendMessageStream in preview with function calling, for item ${item}`
      );
    }
    const response2 = await result2.response;
    expect(
      JSON.stringify(response2.candidates[0].content.parts[0].text)
    ).toContain(WEATHER_FORECAST);
  });
});

describe('countTokens', () => {
  it('should should return a CountTokensResponse', async () => {
    const countTokensResp = await generativeTextModel.countTokens(TEXT_REQUEST);
    expect(countTokensResp.totalTokens).toBeTruthy(
      `sys test failure on countTokens, ${countTokensResp}`
    );
  });
  it('in preview should should return a CountTokensResponse', async () => {
    const countTokensResp =
      await generativeTextModelPreview.countTokens(TEXT_REQUEST);
    expect(countTokensResp.totalTokens).toBeTruthy(
      `sys test failure on countTokens in preview, ${countTokensResp}`
    );
  });
});

describe('generateContentStream using models/model-id', () => {
  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
  });

  it('should should return a stream and aggregated response when passed text', async () => {
    const streamingResp =
      await generativeTextModelWithPrefix.generateContentStream(TEXT_REQUEST);

    for await (const item of streamingResp.stream) {
      expect(item.candidates[0]).toBeTruthy(
        `sys test failure on generateContentStream using models/gemini-pro, for item ${item}`
      );
    }

    const aggregatedResp = await streamingResp.response;
    expect(aggregatedResp.candidates[0]).toBeTruthy(
      `sys test failure on generateContentStream using models/gemini-pro for aggregated response: ${aggregatedResp}`
    );
  });
  it('in preview should should return a stream and aggregated response when passed text', async () => {
    const streamingResp =
      await generativeTextModelWithPrefixPreview.generateContentStream(
        TEXT_REQUEST
      );

    for await (const item of streamingResp.stream) {
      expect(item.candidates[0]).toBeTruthy(
        `sys test failure on generateContentStream in preview using models/gemini-pro, for item ${item}`
      );
    }

    const aggregatedResp = await streamingResp.response;
    expect(aggregatedResp.candidates[0]).toBeTruthy(
      `sys test failure on generateContentStream in preview using models/gemini-pro for aggregated response: ${aggregatedResp}`
    );
  });

  it('should return a stream and aggregated response when passed multipart base64 content when using models/gemini-pro-vision', async () => {
    const streamingResp =
      await generativeVisionModelWithPrefix.generateContentStream(
        MULTI_PART_BASE64_REQUEST
      );

    for await (const item of streamingResp.stream) {
      expect(item.candidates[0]).toBeTruthy(
        `sys test failure on generateContentStream using models/gemini-pro-vision, for item ${item}`
      );
    }

    const aggregatedResp = await streamingResp.response;
    expect(aggregatedResp.candidates[0]).toBeTruthy(
      `sys test failure on generateContentStream using models/gemini-pro-vision for aggregated response: ${aggregatedResp}`
    );
  });
  it('in preview should return a stream and aggregated response when passed multipart base64 content when using models/gemini-pro-vision', async () => {
    const streamingResp =
      await generativeVisionModelWithPrefixPreview.generateContentStream(
        MULTI_PART_BASE64_REQUEST
      );

    for await (const item of streamingResp.stream) {
      expect(item.candidates[0]).toBeTruthy(
        `sys test failure on generateContentStream in preview using models/gemini-pro-vision, for item ${item}`
      );
    }

    const aggregatedResp = await streamingResp.response;
    expect(aggregatedResp.candidates[0]).toBeTruthy(
      `sys test failure on generateContentStream in preview using models/gemini-pro-vision for aggregated response: ${aggregatedResp}`
    );
  });
});
