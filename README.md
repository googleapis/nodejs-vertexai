# Vertex AI Node.js SDK

The Vertex AI Node.js SDK enables developers to use Google's state-of-the-art generative AI models (like Gemini) to build AI-powered features and applications.

[See here](https://github.com/GoogleCloudPlatform/nodejs-docs-samples/tree/main/generative-ai/snippets) for detailed samples using the Vertex AI Node.js SDK.

## Before you begin

1.  [Select or create a Cloud Platform project](https://console.cloud.google.com/project).
1.  [Enable billing for your project](https://cloud.google.com/billing/docs/how-to/modify-project).
1.  [Enable the Vertex AI API](https://console.cloud.google.com/flows/enableapi?apiid=aiplatform.googleapis.com).
1.  [Set up authentication with a service account](https://cloud.google.com/docs/authentication/getting-started) so you can access the
    API from your local workstation.

## Installation

Install this SDK via NPM.

```shell
npm install @google-cloud/vertexai
```

## Available Gemini models in Vertex
For the latest list of available Gemini models in Vertex, please refer to [Google Cloud Generative AI page](https://cloud.google.com/vertex-ai/docs/generative-ai/learn/models#gemini-models)

## Setup

To use the SDK, create an instance of `VertexAI` by passing it your Google Cloud project ID and location. Then create a reference to a generative model.

```typescript
const {VertexAI, HarmCategory, HarmBlockThreshold, GoogleSearchRetrievalTool, RetrievalTool} = require('@google-cloud/vertexai');

const project = 'your-cloud-project';
const location = 'us-central1';
// For the latest list of available Gemini models in Vertex, please refer to https://cloud.google.com/vertex-ai/docs/generative-ai/learn/models#gemini-models
const textModel =  'gemini-1.0-pro';
const visionModel = 'gemini-1.0-pro-vision';

const vertexAI = new VertexAI({project: project, location: location});

// Instantiate models
const generativeModel = vertexAI.getGenerativeModel({
    model: textModel,
    // The following parameters are optional
    // They can also be passed to individual content generation requests
    safetySettings: [{category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE}],
    generationConfig: {maxOutputTokens: 256},
  });

const generativeVisionModel = vertexAI.getGenerativeModel({
    model: visionModel,
});

```

## Streaming content generation

```typescript
async function streamGenerateContent() {
  const request = {
    contents: [{role: 'user', parts: [{text: 'How are you doing today?'}]}],
  };
  const streamingResult = await generativeModel.generateContentStream(request);
  for await (const item of streamingResult.stream) {
    console.log('stream chunk: ', JSON.stringify(item));
  }
  const aggregatedResponse = await streamingResult.response;
  console.log('aggregated response: ', JSON.stringify(aggregatedResponse));
};

streamGenerateContent();
```

## Streaming chat

```typescript
async function streamChat() {
  const chat = generativeModel.startChat();
  const chatInput = "How can I learn more about Node.js?";
  const result = await chat.sendMessageStream(chatInput);
  for await (const item of result.stream) {
      console.log(item.candidates[0].content.parts[0].text);
  }
  const aggregatedResponse = await result.response;
  console.log('aggregated response: ', JSON.stringify(aggregatedResponse));
}

streamChat();
```

## Multi-part content generation

### Providing a Google Cloud Storage image URI
```typescript
async function multiPartContent() {
    const filePart = {fileData: {fileUri: "gs://generativeai-downloads/images/scones.jpg", mimeType: "image/jpeg"}};
    const textPart = {text: 'What is this picture about?'};
    const request = {
        contents: [{role: 'user', parts: [textPart, filePart]}],
      };
    const streamingResult = await generativeVisionModel.generateContentStream(request);
    for await (const item of streamingResult.stream) {
      console.log('stream chunk: ', JSON.stringify(item));
    }
    const aggregatedResponse = await streamingResult.response;
    console.log(aggregatedResponse.candidates[0].content);
}

multiPartContent();
```

### Providing a base64 image string
```typescript
async function multiPartContentImageString() {
    // Replace this with your own base64 image string
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const filePart = {inline_data: {data: base64Image, mimeType: 'image/jpeg'}};
    const textPart = {text: 'What is this picture about?'};
    const request = {
        contents: [{role: 'user', parts: [textPart, filePart]}],
      };
    const streamingResult = await generativeVisionModel.generateContentStream(request);
    const contentResponse = await streamingResult.response;
    console.log(contentResponse.candidates[0].content.parts[0].text);
}

multiPartContentImageString();
```

### Multi-part content with text and video
```typescript
async function multiPartContentVideo() {
    const filePart = {fileData: {fileUri: 'gs://cloud-samples-data/video/animals.mp4', mimeType: 'video/mp4'}};
    const textPart = {text: 'What is in the video?'};
    const request = {
        contents: [{role: 'user', parts: [textPart, filePart]}],
      };
    const streamingResult = await generativeVisionModel.generateContentStream(request);
    for await (const item of streamingResult.stream) {
      console.log('stream chunk: ', JSON.stringify(item));
    }
    const aggregatedResponse = await streamingResult.response;
    console.log(aggregatedResponse.candidates[0].content);
}

multiPartContentVideo();
```

## Content generation: non-streaming

```typescript
async function generateContent() {
  const request = {
    contents: [{role: 'user', parts: [{text: 'How are you doing today?'}]}],
  };
  const result = await generativeModel.generateContent(request);
  const response = result.response;
  console.log('aggregated response: ', JSON.stringify(response));
};

generateContent();
```

## Counting tokens

```typescript
async function countTokens() {
  const request = {
      contents: [{role: 'user', parts: [{text: 'How are you doing today?'}]}],
    };
  const result = await generativeModel.countTokens(request);
  const response = result.response;
  console.log('count tokens response: ', JSON.stringify(response));
}

countTokens();
```

## Function calling

The Node SDK supports
[function calling](https://cloud.google.com/vertex-ai/docs/generative-ai/multimodal/function-calling) via `sendMessage`, `sendMessageStream`, `generateContent`, and `generateContentStream`. We recommend using it through chat methods
(`sendMessage` or `sendMessageStream`) but have included examples of both
approaches below.

### Function declarations and response

This is an example of a function declaration and function response, which are
passed to the model in the snippets that follow.

```typescript
const functionDeclarations = [
  {
    functionDeclarations: [
      {
        name: "get_current_weather",
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

const functionResponseParts = [
  {
    functionResponse: {
      name: "get_current_weather",
      response:
          {name: "get_current_weather", content: {weather: "super nice"}},
    },
  },
];
```

### Function calling with chat

```typescript
async function functionCallingChat() {
  // Create a chat session and pass your function declarations
  const chat = generativeModel.startChat({
    tools: functionDeclarations,
  });

  const chatInput1 = 'What is the weather in Boston?';

  // This should include a functionCall response from the model
  const streamingResult1 = await chat.sendMessageStream(chatInput1);
  for await (const item of streamingResult1.stream) {
    console.log(item.candidates[0]);
  }
  const response1 = await streamingResult1.response;
  console.log("first aggregated response: ", JSON.stringify(response1));

  // Send a follow up message with a FunctionResponse
  const streamingResult2 = await chat.sendMessageStream(functionResponseParts);
  for await (const item of streamingResult2.stream) {
    console.log(item.candidates[0]);
  }

  // This should include a text response from the model using the response content
  // provided above
  const response2 = await streamingResult2.response;
  console.log("second aggregated response: ", JSON.stringify(response2));
}

functionCallingChat();
```

### Function calling with generateContentStream

```typescript
async function functionCallingGenerateContentStream() {
  const request = {
    contents: [
      {role: 'user', parts: [{text: 'What is the weather in Boston?'}]},
      {role: 'model', parts: [{functionCall: {name: 'get_current_weather', args: {'location': 'Boston'}}}]},
      {role: 'user', parts: functionResponseParts}
    ],
    tools: functionDeclarations,
  };
  const streamingResult =
      await generativeModel.generateContentStream(request);
  for await (const item of streamingResult.stream) {
    console.log(item.candidates[0]);
  }
}

functionCallingGenerateContentStream();
```

### Grounding using Google Search

```typescript
const googleSearchRetrievalTool: GoogleSearchRetrievalTool = {
  googleSearchRetrieval: {
    disableAttribution: false,
  },
};
const response = await generativeModel.generateContent({
  contents: [{role: 'user', parts: [{text: 'Why is the sky blue?'}]}],
  tools: [googleSearchRetrievalTool],
}).response;
const groundingMetadata = response.candidates[0].groundingMetadata;
console.log("Response of grounding is: ", JSON.stringify(response));
console.log("Grounding metadata is: ", JSON.stringify(groundingMetadata));
```


### Grounding using Vertex AI Search

```typescript
const vertexAiRetrievalTool: RetrievalTool = {
  retrieval: {
    vertexAiSearch: {
      datastore='projects/.../locations/.../collections/.../dataStores/...',
    }
    disableAttribution: false,
  },
};
const response = await generativeModel.generateContent({
  contents: [{role: 'user', parts: [{text: 'Why is the sky blue?'}]}],
  tools: [googleSearchRetrievalTool],
}).response;
const groundingMetadata = response.candidates[0].groundingMetadata;
console.log("Response of grounding is: ", JSON.stringify(response));
console.log("Grounding metadata is: ", JSON.stringify(groundingMetadata));
```

## License

The contents of this repository are licensed under the
[Apache License, version 2.0](http://www.apache.org/licenses/LICENSE-2.0).