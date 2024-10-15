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

// @ts-ignore
import {
  ClientError,
  FunctionDeclarationsTool,
  GoogleSearchRetrievalTool,
  Part,
  TextPart,
  VertexAI,
  GenerateContentResponseHandler,
  GoogleApiError,
} from '../src';
import {FunctionDeclarationSchemaType} from '../src/types';

const PROJECT = process.env['GCLOUD_PROJECT'];
const LOCATION = 'us-central1';
const TEXT_REQUEST = {
  contents: [{role: 'user', parts: [{text: 'How are you doing today?'}]}],
};

const TEXT_PART = {
  text: 'What is this a picture of?',
};

const GCS_FILE_PART = {
  fileData: {
    fileUri: 'gs://generativeai-downloads/images/scones.jpg',
    mimeType: 'image/jpeg',
  },
};
const BASE_64_IMAGE =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const INLINE_DATA_FILE_PART = {
  inlineData: {
    data: BASE_64_IMAGE,
    mimeType: 'image/jpeg',
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
    functionDeclarations: [
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

const TOOLS_WITH_RAG = [
  {
    retrieval: {
      vertexRagStore: {
        ragResources: [
          {
            ragCorpus:
              'projects/ucaip-sample-tests/locations/us-central1/ragCorpora/6917529027641081856',
          },
        ],
      },
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
const vertexAI = new VertexAI({
  project: PROJECT as string,
  location: LOCATION,
});

const TEXT_MODEL_NAME = 'gemini-1.0-pro';
const generativeTextModel = vertexAI.getGenerativeModel({
  model: TEXT_MODEL_NAME,
  generationConfig: {
    maxOutputTokens: 256,
  },
});
const generativeTextModelPreview = vertexAI.preview.getGenerativeModel({
  model: TEXT_MODEL_NAME,
  generationConfig: {
    maxOutputTokens: 256,
  },
});
const generativeTextModelWithPrefix = vertexAI.getGenerativeModel({
  model: 'models/gemini-1.0-pro',
  generationConfig: {
    maxOutputTokens: 256,
  },
});
const generativeTextModelWithPrefixPreview =
  vertexAI.preview.getGenerativeModel({
    model: 'models/gemini-1.0-pro',
    generationConfig: {
      maxOutputTokens: 256,
    },
  });
const generativeVisionModel = vertexAI.getGenerativeModel({
  model: 'gemini-1.0-pro-vision',
});
const generativeVisionModelPreview = vertexAI.preview.getGenerativeModel({
  model: 'gemini-1.0-pro-vision',
});
const generativeVisionModelWithPrefix = vertexAI.getGenerativeModel({
  model: 'models/gemini-1.0-pro-vision',
});
const generativeVisionModelWithPrefixPreview =
  vertexAI.preview.getGenerativeModel({
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
      expect(item.candidates![0]).toBeTruthy(
        `sys test failure on generateContentStream, for item ${JSON.stringify(
          item
        )}`
      );
    }

    const aggregatedResp = await streamingResp.response;
    expect(aggregatedResp.candidates![0]).toBeTruthy(
      `sys test failure on generateContentStream for testing candidates in aggregated response: ${JSON.stringify(
        aggregatedResp
      )}`
    );
    expect(aggregatedResp.usageMetadata).toBeTruthy(
      `sys test failure on generateContentStream for testing usageMetadata in aggregated response: ${JSON.stringify(
        aggregatedResp
      )}`
    );
  });
  it('in preview should should return a stream and aggregated response when passed text', async () => {
    const streamingResp =
      await generativeTextModelPreview.generateContentStream(TEXT_REQUEST);

    for await (const item of streamingResp.stream) {
      expect(item.candidates![0]).toBeTruthy(
        `sys test failure on generateContentStream in preview, for item ${JSON.stringify(
          item
        )}`
      );
    }

    const aggregatedResp = await streamingResp.response;
    expect(aggregatedResp.candidates![0]).toBeTruthy(
      `sys test failure on generateContentStream in preview for testing candidates in aggregated response: ${JSON.stringify(
        aggregatedResp
      )}`
    );
    expect(aggregatedResp.usageMetadata).toBeTruthy(
      `sys test failure on generateContentStream in preview for testing usageMetadata in aggregated response: ${JSON.stringify(
        aggregatedResp
      )}`
    );
  });

  it('should not return a invalid unicode', async () => {
    const streamingResp = await generativeTextModel.generateContentStream({
      contents: [{role: 'user', parts: [{text: '创作一首古诗'}]}],
    });

    for await (const item of streamingResp.stream) {
      expect(item.candidates![0]).toBeTruthy(
        `sys test failure on generateContentStream, for item ${JSON.stringify(
          item
        )}`
      );
      for (const candidate of item.candidates!) {
        for (const part of candidate.content.parts as TextPart[]) {
          expect(part.text).not.toContain(
            '\ufffd',
            `sys test failure on generateContentStream, for item ${JSON.stringify(
              item
            )}`
          );
        }
      }
    }

    const aggregatedResp = await streamingResp.response;
    expect(aggregatedResp.candidates![0]).toBeTruthy(
      `sys test failure on generateContentStream for aggregated response: ${JSON.stringify(
        aggregatedResp
      )}`
    );
  });
  it('in preview should not return a invalid unicode', async () => {
    const streamingResp =
      await generativeTextModelPreview.generateContentStream({
        contents: [{role: 'user', parts: [{text: '创作一首古诗'}]}],
      });

    for await (const item of streamingResp.stream) {
      expect(item.candidates![0]).toBeTruthy(
        `sys test failure on generateContentStream in preview, for item ${JSON.stringify(
          item
        )}`
      );
      for (const candidate of item.candidates!) {
        for (const part of candidate.content.parts as TextPart[]) {
          expect(part.text).not.toContain(
            '\ufffd',
            `sys test failure on generateContentStream in preview, for item ${JSON.stringify(
              item
            )}`
          );
        }
      }
    }

    const aggregatedResp = await streamingResp.response;
    expect(aggregatedResp.candidates![0]).toBeTruthy(
      `sys test failure on generateContentStream in preview for aggregated response: ${JSON.stringify(
        aggregatedResp
      )}`
    );
  });

  it('should return a stream and aggregated response when passed multipart base64 content', async () => {
    const streamingResp = await generativeVisionModel.generateContentStream(
      MULTI_PART_BASE64_REQUEST
    );

    for await (const item of streamingResp.stream) {
      expect(item.candidates![0]).toBeTruthy(
        `sys test failure on generateContentStream, for item ${JSON.stringify(
          item
        )}`
      );
    }

    const aggregatedResp = await streamingResp.response;
    expect(aggregatedResp.candidates![0]).toBeTruthy(
      `sys test failure on generateContentStream for aggregated response: ${JSON.stringify(
        aggregatedResp
      )}`
    );
  });
  it('in preview should return a stream and aggregated response when passed multipart base64 content', async () => {
    const streamingResp =
      await generativeVisionModelPreview.generateContentStream(
        MULTI_PART_BASE64_REQUEST
      );

    for await (const item of streamingResp.stream) {
      expect(item.candidates![0]).toBeTruthy(
        `sys test failure on generateContentStream in preview, for item ${JSON.stringify(
          item
        )}`
      );
    }

    const aggregatedResp = await streamingResp.response;
    expect(aggregatedResp.candidates![0]).toBeTruthy(
      `sys test failure on generateContentStream in preview for aggregated response: ${JSON.stringify(
        aggregatedResp
      )}`
    );
  });

  it('should throw ClientError when having invalid input', async () => {
    const badRequest = {
      contents: [
        {
          role: 'user',
          parts: [
            {text: 'describe this image:'},
            {inlineData: {mimeType: 'image/png', data: 'invalid data'}},
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
      expect(e.cause).toBeInstanceOf(GoogleApiError);
      expect(e.cause.code).toBe(400);
      expect(e.cause.status).toBe('INVALID_ARGUMENT');
      expect(e.cause.message).toBeInstanceOf(String);
    });
  });
  it('in preview should throw ClientError when having invalid input', async () => {
    const badRequest = {
      contents: [
        {
          role: 'user',
          parts: [
            {text: 'describe this image:'},
            {inlineData: {mimeType: 'image/png', data: 'invalid data'}},
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
        expect(e.cause).toBeInstanceOf(GoogleApiError);
        expect(e.cause.code).toBe(400);
        expect(e.cause.status).toBe('INVALID_ARGUMENT');
        expect(e.cause.message).toBeInstanceOf(String);
      });
  });

  it('should should return a stream and aggregated response when passed multipart GCS content', async () => {
    const streamingResp = await generativeVisionModel.generateContentStream(
      MULTI_PART_GCS_REQUEST
    );

    for await (const item of streamingResp.stream) {
      expect(item.candidates![0]).toBeTruthy(
        `sys test failure on generateContentStream, for item ${JSON.stringify(
          item
        )}`
      );
    }

    const aggregatedResp = await streamingResp.response;
    expect(aggregatedResp.candidates![0]).toBeTruthy(
      `sys test failure on generateContentStream for aggregated response: ${JSON.stringify(
        aggregatedResp
      )}`
    );
  });
  it('in preview should should return a stream and aggregated response when passed multipart GCS content', async () => {
    const streamingResp =
      await generativeVisionModelPreview.generateContentStream(
        MULTI_PART_GCS_REQUEST
      );

    for await (const item of streamingResp.stream) {
      expect(item.candidates![0]).toBeTruthy(
        `sys test failure on generateContentStream in preview, for item ${JSON.stringify(
          item
        )}`
      );
    }

    const aggregatedResp = await streamingResp.response;
    expect(aggregatedResp.candidates![0]).toBeTruthy(
      `sys test failure on generateContentStream in preview for aggregated response: ${JSON.stringify(
        aggregatedResp
      )}`
    );
  });

  xit('should return a text when passed a FunctionDeclaration or FunctionResponse', async () => {
    const request = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weather in Boston?'}]},
        {role: 'model', parts: FUNCTION_CALL},
        {role: 'user', parts: FUNCTION_RESPONSE_PART},
      ],
      tools: TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const streamingResp =
      await generativeTextModel.generateContentStream(request);
    for await (const item of streamingResp.stream) {
      expect(item.candidates![0]).toBeTruthy(
        `sys test failure on generateContentStream, for item ${JSON.stringify(
          item
        )}`
      );
    }
    const aggregaratedResponse = await streamingResp.response;
    expect(
      aggregaratedResponse.candidates![0].content.parts[0].text?.toLowerCase()
    ).toContain(
      WEATHER_FORECAST,
      `sys test failure on generateContentStream for candidate part ${JSON.stringify(
        aggregaratedResponse.candidates![0].content.parts[0]
      )}`
    );
  });
  xit('in preview should return a text when passed a FunctionDeclaration or FunctionResponse', async () => {
    const request = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weather in Boston?'}]},
        {role: 'model', parts: FUNCTION_CALL},
        {role: 'user', parts: FUNCTION_RESPONSE_PART},
      ],
      tools: TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const streamingResp =
      await generativeTextModelPreview.generateContentStream(request);
    for await (const item of streamingResp.stream) {
      expect(item.candidates![0]).toBeTruthy(
        `sys test failure on generateContentStream in preview, for item ${JSON.stringify(
          item
        )}`
      );
    }
    const aggregaratedResponse = await streamingResp.response;
    expect(
      aggregaratedResponse.candidates![0].content.parts[0].text?.toLowerCase()
    ).toContain(
      WEATHER_FORECAST,
      `sys test failure on generateContentStream for candidate part ${JSON.stringify(
        aggregaratedResponse.candidates![0].content.parts[0]
      )}`
    );
  });
  xit('should return a FunctionCall when passed a FunctionDeclaration', async () => {
    const request = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weather in Boston?'}]},
      ],
      tools: TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const streamingResp =
      await generativeTextModel.generateContentStream(request);
    for await (const item of streamingResp.stream) {
      expect(item.candidates![0]).toBeTruthy(
        `sys test failure on generateContentStream, for item ${JSON.stringify(
          item
        )}`
      );
      const functionCalls = item
        .candidates![0].content.parts.filter(part => !!part.functionCall)
        .map(part => part.functionCall!);
      expect(functionCalls).toHaveSize(1);
      expect(
        GenerateContentResponseHandler.getFunctionCallsFromCandidate(
          item.candidates?.[0]
        )
      ).toEqual(functionCalls!);
    }
  });
  xit('in preview should return a FunctionCall when passed a FunctionDeclaration', async () => {
    const request = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weather in Boston?'}]},
      ],
      tools: TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const streamingResp =
      await generativeTextModelPreview.generateContentStream(request);
    for await (const item of streamingResp.stream) {
      expect(item.candidates![0]).toBeTruthy(
        `sys test failure on generateContentStream in preview, for item ${JSON.stringify(
          item
        )}`
      );
      const functionCalls = item
        .candidates![0].content.parts.filter(part => !!part.functionCall)
        .map(part => part.functionCall!);
      expect(functionCalls).toHaveSize(1);
      expect(
        GenerateContentResponseHandler.getFunctionCallsFromCandidate(
          item.candidates?.[0]
        )
      ).toEqual(functionCalls!);
    }
  });
  xit('should return grounding metadata when passed GoogleSearchRetriever in getGenerativeModel', async () => {
    const generativeTextModel = vertexAI.getGenerativeModel({
      model: TEXT_MODEL_NAME,
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    });
    const result = await generativeTextModel.generateContentStream({
      contents: [{role: 'user', parts: [{text: 'Why is the sky blue?'}]}],
    });
    const response = await result.response;
    const groundingMetadata = response.candidates![0].groundingMetadata;
    expect(!!groundingMetadata).toBeTruthy(
      `sys test failure on generateContentStream for grounding metadata: ${groundingMetadata}`
    );
    if (groundingMetadata) {
      expect(!!groundingMetadata.webSearchQueries).toBeTruthy(
        `sys test failure on generateContentStream for web search queries: ${groundingMetadata.webSearchQueries}`
      );
    }
  });
  xit('should return grounding metadata when passed GoogleSearchRetriever in generateContent', async () => {
    const generativeTextModel = vertexAI.getGenerativeModel({
      model: TEXT_MODEL_NAME,
    });
    const result = await generativeTextModel.generateContentStream({
      contents: [{role: 'user', parts: [{text: 'Why is the sky blue?'}]}],
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    });
    const response = await result.response;
    const groundingMetadata = response.candidates![0].groundingMetadata;
    expect(!!groundingMetadata).toBeTruthy(
      `sys test failure on generateContentStream for grounding metadata: ${groundingMetadata}`
    );
    if (groundingMetadata) {
      expect(!!groundingMetadata.webSearchQueries).toBeTruthy(
        `sys test failure on generateContentStream for web search queries: ${groundingMetadata.webSearchQueries}`
      );
    }
  });
  xit('in preview should return grounding metadata when passed GoogleSearchRetriever in getGenerativeModel', async () => {
    const generativeTextModel = vertexAI.preview.getGenerativeModel({
      model: TEXT_MODEL_NAME,
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    });
    const result = await generativeTextModel.generateContentStream({
      contents: [{role: 'user', parts: [{text: 'Why is the sky blue?'}]}],
    });
    const response = await result.response;
    const groundingMetadata = response.candidates![0].groundingMetadata;
    expect(!!groundingMetadata).toBeTruthy(
      `sys test failure on generateContentStream in preview for grounding metadata: ${groundingMetadata}`
    );
    if (groundingMetadata) {
      expect(!!groundingMetadata.webSearchQueries).toBeTruthy(
        `sys test failure on generateContentStream in preview for web search queries: ${groundingMetadata.webSearchQueries}`
      );
    }
  });
  xit('in preview should return grounding metadata when passed GoogleSearchRetriever in generateContent', async () => {
    const generativeTextModel = vertexAI.preview.getGenerativeModel({
      model: TEXT_MODEL_NAME,
    });
    const result = await generativeTextModel.generateContentStream({
      contents: [{role: 'user', parts: [{text: 'Why is the sky blue?'}]}],
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    });
    const response = await result.response;
    const groundingMetadata = response.candidates![0].groundingMetadata;
    expect(!!groundingMetadata).toBeTruthy(
      `sys test failure on generateContentStream in preview for grounding metadata: ${groundingMetadata}`
    );
    if (groundingMetadata) {
      expect(!!groundingMetadata.webSearchQueries).toBeTruthy(
        `sys test failure on generateContentStream in preview for web search queries: ${groundingMetadata.webSearchQueries}`
      );
    }
  });

  xit('in preview should return grounding metadata when passed a VertexRagStore', async () => {
    const request = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'How much gain or loss did Google get in the Motorola Mobile deal in 2014?',
            },
          ],
        },
      ],
      tools: TOOLS_WITH_RAG,
    };
    const result =
      await generativeTextModelPreview.generateContentStream(request);
    const response = await result.response;
    expect(response.candidates![0]).toBeTruthy(
      `sys test failure on generateContent with RAG tool, for resp ${JSON.stringify(
        response
      )}`
    );
    expect(
      response.candidates![0]?.groundingMetadata?.retrievalQueries
    ).toBeTruthy(
      `sys test failure on generateContent with RAG tool, empty groundingMetadata.retrievalQueries, for resp ${JSON.stringify(
        response
      )}`
    );
  });
});

describe('generateContent', () => {
  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
  });
  it('should return the aggregated response', async () => {
    const response = await generativeTextModel.generateContent(TEXT_REQUEST);

    const aggregatedResp = response.response;
    expect(aggregatedResp.candidates![0]).toBeTruthy(
      `sys test failure on generateContentStream for aggregated response: ${JSON.stringify(
        aggregatedResp
      )}`
    );
  });
  it('in preview should return the aggregated response', async () => {
    const response =
      await generativeTextModelPreview.generateContent(TEXT_REQUEST);

    const aggregatedResp = response.response;
    expect(aggregatedResp.candidates![0]).toBeTruthy(
      `sys test failure on generateContentStream in preview for aggregated response: ${JSON.stringify(
        aggregatedResp
      )}`
    );
  });
  xit('should return grounding metadata when passed GoogleSearchRetriever in getGenerativeModel', async () => {
    const generativeTextModel = vertexAI.getGenerativeModel({
      model: TEXT_MODEL_NAME,
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    });
    const result = await generativeTextModel.generateContent({
      contents: [{role: 'user', parts: [{text: 'Why is the sky blue?'}]}],
    });
    const response = result.response;
    const groundingMetadata = response.candidates![0].groundingMetadata;
    expect(!!groundingMetadata).toBeTruthy(
      `sys test failure on generateContent for grounding metadata: ${groundingMetadata}`
    );
    if (groundingMetadata) {
      expect(!!groundingMetadata.webSearchQueries).toBeTruthy(
        `sys test failure on generateContent for web search queries: ${groundingMetadata.webSearchQueries}`
      );
    }
  });
  xit('should return grounding metadata when passed GoogleSearchRetriever in generateContent', async () => {
    const generativeTextModel = vertexAI.getGenerativeModel({
      model: TEXT_MODEL_NAME,
    });
    const result = await generativeTextModel.generateContent({
      contents: [{role: 'user', parts: [{text: 'Why is the sky blue?'}]}],
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    });
    const response = result.response;
    const groundingMetadata = response.candidates![0].groundingMetadata;
    expect(!!groundingMetadata).toBeTruthy(
      `sys test failure on generateContent for grounding metadata: ${groundingMetadata}`
    );
    if (groundingMetadata) {
      expect(!!groundingMetadata.webSearchQueries).toBeTruthy(
        `sys test failure on generateContent for web search queries: ${groundingMetadata.webSearchQueries}`
      );
    }
  });
  xit('in preview should return grounding metadata when passed GoogleSearchRetriever in getGenerativeModel', async () => {
    const generativeTextModel = vertexAI.preview.getGenerativeModel({
      model: TEXT_MODEL_NAME,
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    });
    const result = await generativeTextModel.generateContent({
      contents: [{role: 'user', parts: [{text: 'Why is the sky blue?'}]}],
    });
    const response = result.response;
    const groundingMetadata = response.candidates![0].groundingMetadata;
    expect(!!groundingMetadata).toBeTruthy(
      `sys test failure on generateContent in preview for grounding metadata: ${groundingMetadata}`
    );
    if (groundingMetadata) {
      expect(!!groundingMetadata.webSearchQueries).toBeTruthy(
        `sys test failure on generateContent in preview for web search queries: ${groundingMetadata.webSearchQueries}`
      );
    }
  });
  xit('in preview should return grounding metadata when passed GoogleSearchRetriever in generateContent', async () => {
    const generativeTextModel = vertexAI.preview.getGenerativeModel({
      model: TEXT_MODEL_NAME,
    });
    const result = await generativeTextModel.generateContent({
      contents: [{role: 'user', parts: [{text: 'Why is the sky blue?'}]}],
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    });
    const response = result.response;
    const groundingMetadata = response.candidates![0].groundingMetadata;
    expect(!!groundingMetadata).toBeTruthy(
      `sys test failure on generateContent in preview for grounding metadata: ${groundingMetadata}`
    );
    if (groundingMetadata) {
      expect(!!groundingMetadata.webSearchQueries).toBeTruthy(
        `sys test failure on generateContent in preview for web search queries: ${groundingMetadata.webSearchQueries}`
      );
    }
  });
  xit('should return a text when passed a FunctionDeclaration or FunctionResponse', async () => {
    const request = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weather in Boston?'}]},
        {role: 'model', parts: FUNCTION_CALL},
        {role: 'user', parts: FUNCTION_RESPONSE_PART},
      ],
      tools: TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const resp = await generativeTextModel.generateContent(request);

    expect(resp.response.candidates![0]).toBeTruthy(
      `sys test failure on generateContentStream, for resp ${JSON.stringify(
        resp
      )}`
    );
    expect(
      resp.response.candidates![0].content.parts[0].text?.toLowerCase()
    ).toContain(
      WEATHER_FORECAST,
      `sys test failure on generateContentStream for candidate part ${JSON.stringify(
        resp.response.candidates![0].content.parts[0]
      )}`
    );
  });
  xit('in preview should return a text when passed a FunctionDeclaration or FunctionResponse', async () => {
    const request = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weather in Boston?'}]},
        {role: 'model', parts: FUNCTION_CALL},
        {role: 'user', parts: FUNCTION_RESPONSE_PART},
      ],
      tools: TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const resp = await generativeTextModelPreview.generateContent(request);
    expect(resp.response.candidates![0]).toBeTruthy(
      `sys test failure on generateContentStream in preview, for resp ${JSON.stringify(
        resp
      )}`
    );
    expect(
      resp.response.candidates![0].content.parts[0].text?.toLowerCase()
    ).toContain(
      WEATHER_FORECAST,
      `sys test failure on generateContentStream in preview for candidate part ${JSON.stringify(
        resp.response.candidates![0].content.parts[0]
      )}`
    );
  });
  it('in preview should return grounding metadata when passed a VertexRagStore', async () => {
    const request = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: 'How much gain or loss did Google get in the Motorola Mobile deal in 2014?',
            },
          ],
        },
      ],
      tools: TOOLS_WITH_RAG,
    };
    const resp = await generativeTextModelPreview.generateContent(request);
    expect(resp.response.candidates![0]).toBeTruthy(
      `sys test failure on generateContent with RAG tool, for resp ${JSON.stringify(
        resp
      )}`
    );
    expect(
      resp.response.candidates![0]?.groundingMetadata?.retrievalQueries
    ).toBeTruthy(
      `sys test failure on generateContent with RAG tool, empty groundingMetadata.retrievalQueries, for resp ${JSON.stringify(
        resp
      )}`
    );
  });
  xit('should return a FunctionCall when passed a FunctionDeclaration', async () => {
    const request = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weather in Boston?'}]},
      ],
      tools: TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const resp = await generativeTextModel.generateContent(request);

    expect(resp.response.candidates![0]).toBeTruthy(
      `sys test failure on generateContentStream, for resp ${JSON.stringify(
        resp
      )}`
    );
    const functionCalls = resp.response
      .candidates![0].content.parts.filter((part: Part) => !!part.functionCall)
      .map((part: Part) => part.functionCall!);
    expect(functionCalls).toHaveSize(1);
    expect(
      GenerateContentResponseHandler.getFunctionCallsFromCandidate(
        resp.response.candidates![0]
      )
    ).toEqual(functionCalls!);
  });
  xit('in preview should return a FunctionCall when passed a FunctionDeclaration', async () => {
    const request = {
      contents: [
        {role: 'user', parts: [{text: 'What is the weather in Boston?'}]},
      ],
      tools: TOOLS_WITH_FUNCTION_DECLARATION,
    };
    const resp = await generativeTextModelPreview.generateContent(request);
    expect(resp.response.candidates![0]).toBeTruthy(
      `sys test failure on generateContentStream in preview, for resp ${JSON.stringify(
        resp
      )}`
    );
    const functionCalls = resp.response
      .candidates![0].content.parts.filter((part: Part) => !!part.functionCall)
      .map((part: Part) => part.functionCall!);
    expect(functionCalls).toHaveSize(1);
    expect(
      GenerateContentResponseHandler.getFunctionCallsFromCandidate(
        resp.response.candidates![0]
      )
    ).toEqual(functionCalls!);
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
    expect(response1.candidates![0]).toBeTruthy(
      `sys test failure on sendMessage for aggregated response: ${response1}`
    );
    expect((await chat.getHistory()).length).toBe(2);
  });
  it('in preview should populate history and return a chat response', async () => {
    const chat = generativeTextModelPreview.startChat();
    const chatInput1 = 'How can I learn more about Node.js?';
    const result1 = await chat.sendMessage(chatInput1);
    const response1 = result1.response;
    expect(response1.candidates![0]).toBeTruthy(
      `sys test failure on sendMessage in preview for aggregated response: ${response1}`
    );
    expect((await chat.getHistory()).length).toBe(2);
  });
  xit('should return grounding metadata when passed GoogleSearchRetriever in getGenerativeModel', async () => {
    const generativeTextModel = vertexAI.getGenerativeModel({
      model: TEXT_MODEL_NAME,
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    });
    const chat = generativeTextModel.startChat();
    const result = await chat.sendMessage('Why is the sky blue?');
    const response = result.response;
    const groundingMetadata = response.candidates![0].groundingMetadata;
    expect(!!groundingMetadata).toBeTruthy(
      `sys test failure on sendMessage for grounding metadata: ${groundingMetadata}`
    );
    if (groundingMetadata) {
      expect(!!groundingMetadata.webSearchQueries).toBeTruthy(
        `sys test failure on sendMessage for web search queries: ${groundingMetadata.webSearchQueries}`
      );
    }
  });
  xit('should return grounding metadata when passed GoogleSearchRetriever in startChat', async () => {
    const generativeTextModel = vertexAI.getGenerativeModel({
      model: TEXT_MODEL_NAME,
    });
    const chat = generativeTextModel.startChat({
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    });
    const result = await chat.sendMessage('Why is the sky blue?');
    const response = result.response;
    const groundingMetadata = response.candidates![0].groundingMetadata;
    expect(!!groundingMetadata).toBeTruthy(
      `sys test failure on sendMessage for grounding metadata: ${groundingMetadata}`
    );
    if (groundingMetadata) {
      expect(!!groundingMetadata.webSearchQueries).toBeTruthy(
        `sys test failure on sendMessage for web search queries: ${groundingMetadata.webSearchQueries}`
      );
    }
  });
  xit('in preview should return grounding metadata when passed GoogleSearchRetriever in getGenerativeModel', async () => {
    const generativeTextModel = vertexAI.preview.getGenerativeModel({
      model: TEXT_MODEL_NAME,
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    });
    const chat = generativeTextModel.startChat();
    const result = await chat.sendMessage('Why is the sky blue?');
    const response = result.response;
    const groundingMetadata = response.candidates![0].groundingMetadata;
    expect(!!groundingMetadata).toBeTruthy(
      `sys test failure on sendMessage in preview for grounding metadata: ${groundingMetadata}`
    );
    if (groundingMetadata) {
      expect(!!groundingMetadata.webSearchQueries).toBeTruthy(
        `sys test failure on sendMessage in preview for web search queries: ${groundingMetadata.webSearchQueries}`
      );
    }
  });
  xit('in preview should return grounding metadata when passed GoogleSearchRetriever in startChat', async () => {
    const generativeTextModel = vertexAI.preview.getGenerativeModel({
      model: TEXT_MODEL_NAME,
    });
    const chat = generativeTextModel.startChat({
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    });
    const result = await chat.sendMessage('Why is the sky blue?');
    const response = result.response;
    const groundingMetadata = response.candidates![0].groundingMetadata;
    expect(!!groundingMetadata).toBeTruthy(
      `sys test failure on sendMessage in preview for grounding metadata: ${groundingMetadata}`
    );
    if (groundingMetadata) {
      expect(!!groundingMetadata.webSearchQueries).toBeTruthy(
        `sys test failure on sendMessage in preview for web search queries: ${groundingMetadata.webSearchQueries}`
      );
    }
  });
});

describe('sendMessageStream', () => {
  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
  });
  it('should should return a stream and populate history when generationConfig is passed to startChat', async () => {
    const chat = generativeTextModel.startChat({
      generationConfig: {
        maxOutputTokens: 256,
      },
    });
    const chatInput1 = 'How can I learn more about Node.js?';
    const result1 = await chat.sendMessageStream(chatInput1);
    for await (const item of result1.stream) {
      expect(item.candidates![0]).toBeTruthy(
        `sys test failure on sendMessageStream, for item ${JSON.stringify(
          item
        )}`
      );
    }
    const resp = await result1.response;
    expect(resp.candidates![0]).toBeTruthy(
      `sys test failure on sendMessageStream for aggregated response: ${JSON.stringify(
        resp
      )}`
    );
    expect((await chat.getHistory()).length).toBe(2);
  });
  it('in preview should should return a stream and populate history when generationConfig is passed to startChat', async () => {
    const chat = generativeTextModelPreview.startChat({
      generationConfig: {
        maxOutputTokens: 256,
      },
    });
    const chatInput1 = 'How can I learn more about Node.js?';
    const result1 = await chat.sendMessageStream(chatInput1);
    for await (const item of result1.stream) {
      expect(item.candidates![0]).toBeTruthy(
        `sys test failure on sendMessageStream in preview, for item ${JSON.stringify(
          item
        )}`
      );
    }
    const resp = await result1.response;
    expect(resp.candidates![0]).toBeTruthy(
      `sys test failure on sendMessageStream in preview for aggregated response: ${JSON.stringify(
        resp
      )}`
    );
    expect((await chat.getHistory()).length).toBe(2);
  });

  it('should should return a stream and populate history when startChat is passed no request obj', async () => {
    const chat = generativeTextModel.startChat();
    const chatInput1 = 'How can I learn more about Node.js?';
    const result1 = await chat.sendMessageStream(chatInput1);
    for await (const item of result1.stream) {
      expect(item.candidates![0]).toBeTruthy(
        `sys test failure on sendMessageStream, for item ${JSON.stringify(
          item
        )}`
      );
    }
    const resp = await result1.response;
    expect(resp.candidates![0]).toBeTruthy(
      `sys test failure on sendMessageStream for aggregated response: ${JSON.stringify(
        resp
      )}`
    );
    expect((await chat.getHistory()).length).toBe(2);
  });
  it('in preview should should return a stream and populate history when startChat is passed no request obj', async () => {
    const chat = generativeTextModelPreview.startChat();
    const chatInput1 = 'How can I learn more about Node.js?';
    const result1 = await chat.sendMessageStream(chatInput1);
    for await (const item of result1.stream) {
      expect(item.candidates![0]).toBeTruthy(
        `sys test failure on sendMessageStream in preview, for item ${JSON.stringify(
          item
        )}`
      );
    }
    const resp = await result1.response;
    expect(resp.candidates![0]).toBeTruthy(
      `sys test failure on sendMessageStream in preview for aggregated response: ${JSON.stringify(
        resp
      )}`
    );
    expect((await chat.getHistory()).length).toBe(2);
  });

  xit('should return a FunctionCall or text when passed a FunctionDeclaration or FunctionResponse', async () => {
    const chat = generativeTextModel.startChat({
      tools: TOOLS_WITH_FUNCTION_DECLARATION,
    });
    const chatInput1 = 'What is the weather in Boston?';
    const result1 = await chat.sendMessageStream(chatInput1);
    for await (const item of result1.stream) {
      expect(item.candidates![0]).toBeTruthy(
        `sys test failure on sendMessageStream with function calling, for item ${JSON.stringify(
          item
        )}`
      );
    }
    const response1 = await result1.response;
    expect(
      JSON.stringify(response1.candidates![0].content.parts[0].functionCall)
    ).toContain(
      FUNCTION_CALL_NAME,
      `sys test failure on sendMessageStream with function calling, for function call: ${JSON.stringify(
        response1.candidates![0].content.parts[0]
      )}`
    );
    expect(
      JSON.stringify(response1.candidates![0].content.parts[0].functionCall)
    ).toContain(
      'location',
      `sys test failure on sendMessageStream with function calling, for function call: ${JSON.stringify(
        response1.candidates![0].content.parts[0]
      )}`
    );

    // Send a follow up message with a FunctionResponse
    const result2 = await chat.sendMessageStream(FUNCTION_RESPONSE_PART);
    for await (const item of result2.stream) {
      expect(item.candidates![0]).toBeTruthy(
        `sys test failure on sendMessageStream with function calling, for item ${JSON.stringify(
          item
        )}`
      );
    }
    const response2 = await result2.response;
    expect(response2.candidates![0].content.parts[0].text).toContain(
      WEATHER_FORECAST,
      `sys test failure on sendMessageStream with function calling, for text: ${JSON.stringify(
        response2.candidates![0].content.parts[0].text
      )}`
    );
  });
  xit('in preview should return a FunctionCall or text when passed a FunctionDeclaration or FunctionResponse', async () => {
    const chat = generativeTextModelPreview.startChat({
      tools: TOOLS_WITH_FUNCTION_DECLARATION,
    });
    const chatInput1 = 'What is the weather in Boston?';
    const result1 = await chat.sendMessageStream(chatInput1);
    for await (const item of result1.stream) {
      expect(item.candidates![0]).toBeTruthy(
        `sys test failure on sendMessageStream in preview with function calling, for item ${JSON.stringify(
          item
        )}`
      );
    }
    const response1 = await result1.response;
    expect(
      JSON.stringify(response1.candidates![0].content.parts[0].functionCall)
    ).toContain(
      FUNCTION_CALL_NAME,
      `sys test failure on sendMessageStream in preview with function calling, for function call: ${JSON.stringify(
        response1.candidates![0].content.parts[0]
      )}`
    );
    expect(
      JSON.stringify(response1.candidates![0].content.parts[0].functionCall)
    ).toContain(
      'location',
      `sys test failure on sendMessageStream in preview with function calling, for function call: ${JSON.stringify(
        response1.candidates![0].content.parts[0]
      )}`
    );

    // Send a follow up message with a FunctionResponse
    const result2 = await chat.sendMessageStream(FUNCTION_RESPONSE_PART);
    for await (const item of result2.stream) {
      expect(item.candidates![0]).toBeTruthy(
        `sys test failure on sendMessageStream in preview with function calling, for item ${JSON.stringify(
          item
        )}`
      );
    }
    const response2 = await result2.response;
    expect(response2.candidates![0].content.parts[0].text).toContain(
      WEATHER_FORECAST
    );
  });
  xit('should return grounding metadata when passed GoogleSearchRetriever in getGenerativeModel', async () => {
    const generativeTextModel = vertexAI.getGenerativeModel({
      model: TEXT_MODEL_NAME,
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    });
    const chat = generativeTextModel.startChat();
    const result = await chat.sendMessageStream('Why is the sky blue?');
    const response = await result.response;
    const groundingMetadata = response.candidates![0].groundingMetadata;
    expect(!!groundingMetadata).toBeTruthy(
      `sys test failure on groundingMetadata, ${groundingMetadata}`
    );
    if (groundingMetadata) {
      expect(!!groundingMetadata.webSearchQueries).toBeTruthy(
        `sys test failure on groundingMetadata.webSearchQueries, ${groundingMetadata.webSearchQueries}`
      );
    }
  });
  xit('should return grounding metadata when passed GoogleSearchRetriever in startChat', async () => {
    const generativeTextModel = vertexAI.getGenerativeModel({
      model: TEXT_MODEL_NAME,
    });
    const chat = generativeTextModel.startChat({
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    });
    const result = await chat.sendMessageStream('Why is the sky blue?');
    const response = await result.response;
    const groundingMetadata = response.candidates![0].groundingMetadata;
    expect(!!groundingMetadata).toBeTruthy(
      `sys test failure on groundingMetadata, ${groundingMetadata}`
    );
    if (groundingMetadata) {
      expect(!!groundingMetadata.webSearchQueries).toBeTruthy(
        `sys test failure on groundingMetadata.webSearchQueries, ${groundingMetadata.webSearchQueries}`
      );
    }
  });
  xit('in preview should return grounding metadata when passed GoogleSearchRetriever in getGenerativeModel', async () => {
    const generativeTextModel = vertexAI.preview.getGenerativeModel({
      model: TEXT_MODEL_NAME,
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    });
    const chat = generativeTextModel.startChat();
    const result = await chat.sendMessageStream('Why is the sky blue?');
    const response = await result.response;
    const groundingMetadata = response.candidates![0].groundingMetadata;
    expect(!!groundingMetadata).toBeTruthy(
      `sys test failure on groundingMetadata in preview, ${groundingMetadata}`
    );
    if (groundingMetadata) {
      expect(!!groundingMetadata.webSearchQueries).toBeTruthy(
        `sys test failure on groundingMetadata.webSearchQueries in preview, ${groundingMetadata.webSearchQueries}`
      );
    }
  });
  xit('in preview should return grounding metadata when passed GoogleSearchRetriever in startChat', async () => {
    const generativeTextModel = vertexAI.preview.getGenerativeModel({
      model: TEXT_MODEL_NAME,
    });
    const chat = generativeTextModel.startChat({
      tools: TOOLS_WITH_GOOGLE_SEARCH_RETRIEVAL,
    });
    const result = await chat.sendMessageStream('Why is the sky blue?');
    const response = await result.response;
    const groundingMetadata = response.candidates![0].groundingMetadata;
    expect(!!groundingMetadata).toBeTruthy(
      `sys test failure on groundingMetadata in preview, ${groundingMetadata}`
    );
    if (groundingMetadata) {
      expect(!!groundingMetadata.webSearchQueries).toBeTruthy(
        `sys test failure on groundingMetadata.webSearchQueries in preview, ${groundingMetadata.webSearchQueries}`
      );
    }
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
      expect(item.candidates![0]).toBeTruthy(
        `sys test failure on generateContentStream using models/gemini-pro, for item ${JSON.stringify(
          item
        )}`
      );
    }

    const aggregatedResp = await streamingResp.response;
    expect(aggregatedResp.candidates![0]).toBeTruthy(
      `sys test failure on generateContentStream using models/gemini-pro for aggregated response: ${JSON.stringify(
        aggregatedResp
      )}`
    );
  });
  it('in preview should should return a stream and aggregated response when passed text', async () => {
    const streamingResp =
      await generativeTextModelWithPrefixPreview.generateContentStream(
        TEXT_REQUEST
      );

    for await (const item of streamingResp.stream) {
      expect(item.candidates![0]).toBeTruthy(
        `sys test failure on generateContentStream in preview using models/gemini-pro, for item ${JSON.stringify(
          item
        )}`
      );
    }

    const aggregatedResp = await streamingResp.response;
    expect(aggregatedResp.candidates![0]).toBeTruthy(
      `sys test failure on generateContentStream in preview using models/gemini-pro for aggregated response: ${JSON.stringify(
        aggregatedResp
      )}`
    );
  });

  it('should return a stream and aggregated response when passed multipart base64 content when using models/gemini-pro-vision', async () => {
    const streamingResp =
      await generativeVisionModelWithPrefix.generateContentStream(
        MULTI_PART_BASE64_REQUEST
      );

    for await (const item of streamingResp.stream) {
      expect(item.candidates![0]).toBeTruthy(
        `sys test failure on generateContentStream using models/gemini-pro-vision, for item ${JSON.stringify(
          item
        )}`
      );
    }

    const aggregatedResp = await streamingResp.response;
    expect(aggregatedResp.candidates![0]).toBeTruthy(
      `sys test failure on generateContentStream using models/gemini-pro-vision for aggregated response: ${JSON.stringify(
        aggregatedResp
      )}`
    );
  });
  it('in preview should return a stream and aggregated response when passed multipart base64 content when using models/gemini-pro-vision', async () => {
    const streamingResp =
      await generativeVisionModelWithPrefixPreview.generateContentStream(
        MULTI_PART_BASE64_REQUEST
      );

    for await (const item of streamingResp.stream) {
      expect(item.candidates![0]).toBeTruthy(
        `sys test failure on generateContentStream in preview using models/gemini-pro-vision, for item ${JSON.stringify(
          item
        )}`
      );
    }

    const aggregatedResp = await streamingResp.response;
    expect(aggregatedResp.candidates![0]).toBeTruthy(
      `sys test failure on generateContentStream in preview using models/gemini-pro-vision for aggregated response: ${JSON.stringify(
        aggregatedResp
      )}`
    );
  });
});
