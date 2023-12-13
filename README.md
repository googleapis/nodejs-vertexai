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

## Setup

To use the SDK, create an instance of `VertexAI` by passing it your Google Cloud project ID and location. Then create a reference to a generative model.

```typescript
const {VertexAI, HarmCategory, HarmBlockThreshold} = require('@google-cloud/vertexai');

const project = 'your-cloud-project';
const location = 'us-central1';

const vertex_ai = new VertexAI({project: project, location: location});

// Instantiate models
const generativeModel = vertex_ai.preview.getGenerativeModel({
    model: 'gemini-pro',
    // The following parameters are optional
    // They can also be passed to individual content generation requests
    safety_settings: [{category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE}],
    generation_config: {max_output_tokens: 256},
  });

const generativeVisionModel = vertex_ai.preview.getGenerativeModel({
    model: 'gemini-pro-vision',
});

```

## Streaming content generation

```typescript
async function streamGenerateContent() {
  const request = {
    contents: [{role: 'user', parts: [{text: 'How are you doing today?'}]}],
  };
  const streamingResp = await generativeModel.generateContentStream(request);
  for await (const item of streamingResp.stream) {
    console.log('stream chunk: ', JSON.stringify(item));
  }
  console.log('aggregated response: ', JSON.stringify(await streamingResp.response));
};

streamGenerateContent();
```

## Streaming chat

```typescript
async function streamChat() {
  const chat = generativeModel.startChat({});
  const chatInput1 = "How can I learn more about Node.js?";
  const result1 = await chat.sendMessageStream(chatInput1);
  for await (const item of result1.stream) {
      console.log(item.candidates[0].content.parts[0].text);
  }
  console.log('aggregated response: ', JSON.stringify(await result1.response));
}

streamChat();
```

## Multi-part content generation: text and image

### Providing a Google Cloud Storage image URI
```typescript
async function multiPartContent() {
    const filePart = {file_data: {file_uri: "gs://generativeai-downloads/images/scones.jpg", mime_type: "image/jpeg"}};
    const textPart = {text: 'What is this a picture of?'};
    const request = {
        contents: [{role: 'user', parts: [textPart, filePart]}],
      };
    const streamingResp = await generativeVisionModel.generateContentStream(request);
    for await (const item of streamingResp.stream) {
      console.log('stream chunk: ', JSON.stringify(item));
    }
    const aggregatedResponse = await streamingResp.response;
    console.log(aggregatedResponse.candidates[0].content);
}

multiPartContent();
```

### Providing a base64 image string
```typescript
async function multiPartContentImageString() {
    const b64imageStr = "yourbase64imagestr";
    const filePart = {inline_data: {data: b64imageStr, mime_type: "image/jpeg"}};
    const textPart = {text: 'What is this a picture of?'};
    const request = {
        contents: [{role: 'user', parts: [textPart, filePart]}],
      };
    const resp = await generativeVisionModel.generateContentStream(request);
    const contentResponse = await resp.response;
    console.log(contentResponse.candidates[0].content);
}

multiPartContentImageString();
```

## Content generation: non-streaming

```typescript
async function generateContent() {
  const request = {
    contents: [{role: 'user', parts: [{text: 'How are you doing today?'}]}],
  };
  const resp = await generativeModel.generateContent(request);

  console.log('aggregated response: ', JSON.stringify(await resp.response));
};

generateContent();
```

## Counting tokens

```typescript
async function countTokens() {
    const request = {
        contents: [{role: 'user', parts: [{text: 'How are you doing today?'}]}],
      };
    const resp = await generativeModel.countTokens(request);
    console.log('count tokens response: ', resp);
}

countTokens();
```

## License

The contents of this repository are licensed under the
[Apache License, version 2.0](http://www.apache.org/licenses/LICENSE-2.0).