# Gemini Enterprise Agent Platform SDK for Node.js quickstart

The Agent Platform SDK for Node.js lets you use the Gemini API to build
AI-powered features and applications. Both TypeScript and JavaScript are
supported.

For the latest list of available Gemini models on Agent Platform, see the
[Model information](https://cloud.google.com/vertex-ai/docs/generative-ai/learn/models#gemini-models)
page in Agent Platform documentation.

## Before you begin

1.  Make sure your Node.js version is 22 or above.
1.  [Select](https://console.cloud.google.com/project) or [create](https://cloud.google.com/resource-manager/docs/creating-managing-projects#creating_a_project) a Google Cloud project.
1.  [Enable billing for your project](https://cloud.google.com/billing/docs/how-to/modify-project).
1.  [Enable the Agent Platform API](https://console.cloud.google.com/flows/enableapi?apiid=aiplatform.googleapis.com).
1.  [Install the gcloud CLI](https://cloud.google.com/sdk/docs/install).
1.  [Initialize the gcloud CLI](https://cloud.google.com/sdk/docs/initializing).
1.  Create local authentication credentials for your user account:

    ```sh
    gcloud auth application-default login
    ```
A list of accepted authentication options are listed in [GoogleAuthOptions](https://github.com/googleapis/google-auth-library-nodejs/blob/3ae120d0a45c95e36c59c9ac8286483938781f30/src/auth/googleauth.ts#L87) interface of google-auth-library-node.js GitHub repo.

## Install the SDK

Install the Agent Platform SDK for Node.js by running the following command:

```shell
npm install @google-cloud/agentplatform
```

## Instantiate the Agent Platform client

First, import the `Client` class:

```typescript
import { Client } from '@google-cloud/agentplatform';
```

Then instantiate a client:

```typescript
const client: Client = new Client({
  project: 'my-cloud-project',
  location: 'my-cloud-location',
});
```

## Prompts

First define your prompt as a JS object or `Prompt` object. Then call `createVersion`.

```typescript
const prompt = {
  promptData: {
    contents: [{ parts: [{ text: 'Hello, {name}! How are you?' }] }],
    systemInstruction: { parts: [{ text: 'Please answer in a short sentence.' }] },
    variables: [
      { name: { text: 'Alice' } },
    ],
    model: 'gemini-2.5-flash',
  },
};

const promptResource = await client.prompts.createVersion({
  prompt: prompt,
});
```

Note that you can also use typed objects to define your prompt. Some of the types used to do this (`Content`, `Part`) are from the Gen AI SDK (`@google/genai`).

```typescript
import { Prompt } from '@google-cloud/agentplatform';
import { Part, Content } from '@google/genai';

const prompt: Prompt = {
  promptData: {
    contents: [{ parts: [{ text: 'Hello, {name}! How are you?' } as Part] } as Content],
    systemInstruction: { parts: [{ text: 'Please answer in a short sentence.' } as Part] } as Content,
    variables: [
      { name: { text: 'Alice' } as Part },
    ],
    model: 'gemini-2.5-flash',
  },
};

const promptResource = await client.prompts.createVersion({
  prompt: prompt,
});
```

Retrieve a prompt by calling `get()` with the `promptId`.

```typescript
const dataset = (promptResource as any)._dataset;
const promptId = dataset?.name?.split('/').pop() || 'YOUR_PROMPT_ID';

const retrievedPrompt = await client.prompts.get({
  promptId: promptId,
});
```

After creating or retrieving a prompt, you can call `models.generateContent()` with that prompt using the Gen AI SDK (`@google/genai`).

```typescript
import { GoogleGenAI } from '@google/genai';

// Create a Client in the Gen AI SDK
const genaiClient = new GoogleGenAI({ vertexai: true, project: 'your-project', location: 'your-location' });

// Call generateContent() with the prompt
if (retrievedPrompt.promptData?.contents) {
  const response = await genaiClient.models.generateContent({
    model: retrievedPrompt.promptData.model || 'gemini-2.5-flash',
    contents: retrievedPrompt.promptData.contents,
    config: {
      systemInstruction: retrievedPrompt.promptData.systemInstruction,
      ...(retrievedPrompt.promptData.generationConfig || {}),
    },
  });
  console.log(response.text);
}
```

## License

The contents of this repository are licensed under the
[Apache License, version 2.0](http://www.apache.org/licenses/LICENSE-2.0).