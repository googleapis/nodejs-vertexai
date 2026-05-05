# Gemini Enterprise Agent Platform SDK for Node.js quickstart

The Agent Platform SDK for Node.js lets you use the Gemini API to build
AI-powered features and applications. Both TypeScript and JavaScript are
supported.

For the latest list of available Gemini models on Agent Platform, see the
[Model information](https://cloud.google.com/vertex-ai/docs/generative-ai/learn/models#gemini-models)
page in Agent Platform documentation.

## Before you begin

1.  Make sure your node.js version is 20 or above.
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

## License

The contents of this repository are licensed under the
[Apache License, version 2.0](http://www.apache.org/licenses/LICENSE-2.0).