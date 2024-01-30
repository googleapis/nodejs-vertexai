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
import {GoogleAuth, GoogleAuthOptions} from 'google-auth-library';

import {
  processCountTokenResponse,
  processNonStream,
  processStream,
} from './process_stream';
import {
  Content,
  CountTokensRequest,
  CountTokensResponse,
  GenerateContentRequest,
  GenerateContentResult,
  GenerationConfig,
  ModelParams,
  Part,
  SafetySetting,
  StreamGenerateContentResult,
  Tool,
  VertexInit,
} from './types/content';
import {
  ClientError,
  GoogleAuthError,
  GoogleGenerativeAIError,
} from './types/errors';
import {constants, postRequest} from './util';
export * from './types';

/**
 * Base class for authenticating to Vertex, creates the preview namespace.
 */
export class VertexAI {
  public preview: VertexAI_Preview;

  /**
   * @constructor
   * @param {VertexInit} init - assign authentication related information,
   *     including project and location string, to instantiate a Vertex AI
   * client.
   */
  constructor(init: VertexInit) {
    /**
     * preview property is used to access any SDK methods available in public
     * preview, currently all functionality.
     */
    this.preview = new VertexAI_Preview(
      init.project,
      init.location,
      init.apiEndpoint,
      init.googleAuthOptions
    );
  }
}

/**
 * VertexAI class internal implementation for authentication.
 */
export class VertexAI_Preview {
  protected googleAuth: GoogleAuth;

  /**
   * @constructor
   * @param {string} - project The Google Cloud project to use for the request
   * @param {string} - location The Google Cloud project location to use for the request
   * @param {string} - [apiEndpoint] The base Vertex AI endpoint to use for the request. If
   *        not provided, the default regionalized endpoint
   *        (i.e. us-central1-aiplatform.googleapis.com) will be used.
   * @param {GoogleAuthOptions} - [googleAuthOptions] The Authentication options provided by google-auth-library.
   *        Complete list of authentication options is documented in the GoogleAuthOptions interface:
   *        https://github.com/googleapis/google-auth-library-nodejs/blob/main/src/auth/googleauth.ts
   */
  constructor(
    readonly project: string,
    readonly location: string,
    readonly apiEndpoint?: string,
    readonly googleAuthOptions?: GoogleAuthOptions
  ) {
    const opts = this.validateGoogleAuthOptions(project, googleAuthOptions);
    this.project = project;
    this.location = location;
    this.apiEndpoint = apiEndpoint;
    this.googleAuth = new GoogleAuth(opts);
  }

  /**
   * Get access token from GoogleAuth. Throws GoogleAuthError when fails.
   * @return {Promise<any>} Promise of token
   */
  get token(): Promise<any> {
    const credential_error_message =
      '\nUnable to authenticate your request\
        \nDepending on your run time environment, you can get authentication by\
        \n- if in local instance or cloud shell: `!gcloud auth login`\
        \n- if in Colab:\
        \n    -`from google.colab import auth`\
        \n    -`auth.authenticate_user()`\
        \n- if in service account or other: please follow guidance in https://cloud.google.com/docs/authentication';
    const tokenPromise = this.googleAuth.getAccessToken().catch(e => {
      throw new GoogleAuthError(credential_error_message, e);
    });
    return tokenPromise;
  }

  /**
   * @param {ModelParams} modelParams - {@link ModelParams} Parameters to specify the generative model.
   * @return {GenerativeModel} Instance of the GenerativeModel class. {@link GenerativeModel}
   */
  getGenerativeModel(modelParams: ModelParams): GenerativeModel {
    if (modelParams.generation_config) {
      modelParams.generation_config = validateGenerationConfig(
        modelParams.generation_config
      );
    }

    return new GenerativeModel(
      this,
      modelParams.model,
      modelParams.generation_config,
      modelParams.safety_settings,
      modelParams.tools
    );
  }

  validateGoogleAuthOptions(
    project: string,
    googleAuthOptions?: GoogleAuthOptions
  ): GoogleAuthOptions {
    let opts: GoogleAuthOptions;
    const requiredScope = 'https://www.googleapis.com/auth/cloud-platform';
    if (!googleAuthOptions) {
      opts = {
        scopes: requiredScope,
      };
      return opts;
    }
    if (
      googleAuthOptions.projectId &&
      googleAuthOptions.projectId !== project
    ) {
      throw new Error(
        `inconsistent project ID values. argument project got value ${project} but googleAuthOptions.projectId got value ${googleAuthOptions.projectId}`
      );
    }
    opts = googleAuthOptions;
    if (!opts.scopes) {
      opts.scopes = requiredScope;
      return opts;
    }
    if (
      (typeof opts.scopes === 'string' && opts.scopes !== requiredScope) ||
      (Array.isArray(opts.scopes) && opts.scopes.indexOf(requiredScope) < 0)
    ) {
      throw new GoogleAuthError(
        `input GoogleAuthOptions.scopes ${opts.scopes} doesn't contain required scope ${requiredScope}, please include ${requiredScope} into GoogleAuthOptions.scopes or leave GoogleAuthOptions.scopes undefined`
      );
    }
    return opts;
  }
}

/**
 * Params to initiate a multiturn chat with the model via startChat
 * @property {Content[]} - [history] history of the chat session. {@link Content}
 * @property {SafetySetting[]} - [safety_settings] Array of {@link SafetySetting}
 * @property {GenerationConfig} - [generation_config] {@link GenerationConfig}
 */
export declare interface StartChatParams {
  history?: Content[];
  safety_settings?: SafetySetting[];
  generation_config?: GenerationConfig;
  tools?: Tool[];
}

// StartChatSessionRequest and ChatSession are defined here instead of in
// src/types to avoid a circular dependency issue due the dep on
// VertexAI_Preview

/**
 * All params passed to initiate multiturn chat via startChat
 * @property {VertexAI_Preview} - _vertex_instance {@link VertexAI_Preview}
 * @property {GenerativeModel} - _model_instance {@link GenerativeModel}
 */
export declare interface StartChatSessionRequest extends StartChatParams {
  _vertex_instance: VertexAI_Preview;
  _model_instance: GenerativeModel;
}

/**
 * Chat session to make multi-turn send message request.
 * `sendMessage` method makes async call to get response of a chat message.
 * `sendMessageStream` method makes async call to stream response of a chat message.
 */
export class ChatSession {
  private project: string;
  private location: string;

  private historyInternal: Content[];
  private _vertex_instance: VertexAI_Preview;
  private _model_instance: GenerativeModel;
  private _send_stream_promise: Promise<void> = Promise.resolve();
  generation_config?: GenerationConfig;
  safety_settings?: SafetySetting[];
  tools?: Tool[];

  get history(): Content[] {
    return this.historyInternal;
  }

  /**
   * @constructor
   * @param {StartChatSessionRequest} request - {@link StartChatSessionRequest}
   */
  constructor(request: StartChatSessionRequest) {
    this.project = request._vertex_instance.project;
    this.location = request._vertex_instance.location;
    this._model_instance = request._model_instance;
    this.historyInternal = request.history ?? [];
    this._vertex_instance = request._vertex_instance;
    this.generation_config = request.generation_config;
    this.safety_settings = request.safety_settings;
    this.tools = request.tools;
  }

  /**
   * Make an sync call to send message.
   * @param {string | Array<string | Part>} request - send message request. {@link Part}
   * @return {Promise<GenerateContentResult>} Promise of {@link GenerateContentResult}
   */
  async sendMessage(
    request: string | Array<string | Part>
  ): Promise<GenerateContentResult> {
    const newContent: Content[] =
      formulateNewContentFromSendMessageRequest(request);
    const generateContentrequest: GenerateContentRequest = {
      contents: this.historyInternal.concat(newContent),
      safety_settings: this.safety_settings,
      generation_config: this.generation_config,
      tools: this.tools,
    };

    const generateContentResult: GenerateContentResult =
      await this._model_instance
        .generateContent(generateContentrequest)
        .catch(e => {
          throw e;
        });
    const generateContentResponse = generateContentResult.response;
    // Only push the latest message to history if the response returned a result
    if (generateContentResponse.candidates.length !== 0) {
      this.historyInternal = this.historyInternal.concat(newContent);
      const contentFromAssistant =
        generateContentResponse.candidates[0].content;
      if (!contentFromAssistant.role) {
        contentFromAssistant.role = constants.MODEL_ROLE;
      }
      this.historyInternal.push(contentFromAssistant);
    } else {
      // TODO: handle promptFeedback in the response
      throw new Error('Did not get a candidate from the model');
    }

    return Promise.resolve({response: generateContentResponse});
  }

  async appendHistory(
    streamGenerateContentResultPromise: Promise<StreamGenerateContentResult>,
    newContent: Content[]
  ): Promise<void> {
    const streamGenerateContentResult =
      await streamGenerateContentResultPromise;
    const streamGenerateContentResponse =
      await streamGenerateContentResult.response;
    // Only push the latest message to history if the response returned a result
    if (streamGenerateContentResponse.candidates.length !== 0) {
      this.historyInternal = this.historyInternal.concat(newContent);
      const contentFromAssistant =
        streamGenerateContentResponse.candidates[0].content;
      if (!contentFromAssistant.role) {
        contentFromAssistant.role = constants.MODEL_ROLE;
      }
      this.historyInternal.push(contentFromAssistant);
    } else {
      // TODO: handle promptFeedback in the response
      throw new Error('Did not get a candidate from the model');
    }
  }

  /**
   * Make an async call to stream send message. Response will be returned in stream.
   * @param {string | Array<string | Part>} request - send message request. {@link Part}
   * @return {Promise<StreamGenerateContentResult>} Promise of {@link StreamGenerateContentResult}
   */
  async sendMessageStream(
    request: string | Array<string | Part>
  ): Promise<StreamGenerateContentResult> {
    const newContent: Content[] =
      formulateNewContentFromSendMessageRequest(request);
    const generateContentrequest: GenerateContentRequest = {
      contents: this.historyInternal.concat(newContent),
      safety_settings: this.safety_settings,
      generation_config: this.generation_config,
      tools: this.tools,
    };

    const streamGenerateContentResultPromise = this._model_instance
      .generateContentStream(generateContentrequest)
      .catch(e => {
        throw e;
      });

    this._send_stream_promise = this.appendHistory(
      streamGenerateContentResultPromise,
      newContent
    ).catch(e => {
      throw new GoogleGenerativeAIError('exception appending chat history', e);
    });
    return streamGenerateContentResultPromise;
  }
}

/**
 * Base class for generative models.
 * NOTE: this class should not be instantiated directly. Use
 * `vertexai.preview.getGenerativeModel()` instead.
 */
export class GenerativeModel {
  model: string;
  generation_config?: GenerationConfig;
  safety_settings?: SafetySetting[];
  tools?: Tool[];
  private _vertex_instance: VertexAI_Preview;
  private _use_non_stream = false;
  private publisherModelEndpoint: string;

  /**
   * @constructor
   * @param {VertexAI_Preview} vertex_instance - {@link VertexAI_Preview}
   * @param {string} model - model name
   * @param {GenerationConfig} generation_config - Optional. {@link
   *     GenerationConfig}
   * @param {SafetySetting[]} safety_settings - Optional. {@link SafetySetting}
   */
  constructor(
    vertex_instance: VertexAI_Preview,
    model: string,
    generation_config?: GenerationConfig,
    safety_settings?: SafetySetting[],
    tools?: Tool[]
  ) {
    this._vertex_instance = vertex_instance;
    this.model = model;
    this.generation_config = generation_config;
    this.safety_settings = safety_settings;
    this.tools = tools;
    if (model.startsWith('models/')) {
      this.publisherModelEndpoint = `publishers/google/${this.model}`;
    } else {
      this.publisherModelEndpoint = `publishers/google/models/${this.model}`;
    }
  }

  /**
   * Make a async call to generate content.
   * @param request A GenerateContentRequest object with the request contents.
   * @return The GenerateContentResponse object with the response candidates.
   */
  async generateContent(
    request: GenerateContentRequest | string
  ): Promise<GenerateContentResult> {
    request = formatContentRequest(
      request,
      this.generation_config,
      this.safety_settings
    );

    validateGenerateContentRequest(request);

    if (request.generation_config) {
      request.generation_config = validateGenerationConfig(
        request.generation_config
      );
    }

    if (!this._use_non_stream) {
      const streamGenerateContentResult: StreamGenerateContentResult =
        await this.generateContentStream(request).catch(e => {
          throw e;
        });
      const result: GenerateContentResult = {
        response: await streamGenerateContentResult.response,
      };
      return Promise.resolve(result);
    }

    const generateContentRequest: GenerateContentRequest = {
      contents: request.contents,
      generation_config: request.generation_config ?? this.generation_config,
      safety_settings: request.safety_settings ?? this.safety_settings,
      tools: request.tools ?? [],
    };

    const response: Response | undefined = await postRequest({
      region: this._vertex_instance.location,
      project: this._vertex_instance.project,
      resourcePath: this.publisherModelEndpoint,
      resourceMethod: constants.GENERATE_CONTENT_METHOD,
      token: await this._vertex_instance.token,
      data: generateContentRequest,
      apiEndpoint: this._vertex_instance.apiEndpoint,
    }).catch(e => {
      throw new GoogleGenerativeAIError('exception posting request', e);
    });
    throwErrorIfNotOK(response);
    const result: GenerateContentResult = processNonStream(response);
    return Promise.resolve(result);
  }

  /**
   * Make an async stream request to generate content. The response will be returned in stream.
   * @param {GenerateContentRequest} request - {@link GenerateContentRequest}
   * @return {Promise<StreamGenerateContentResult>} Promise of {@link StreamGenerateContentResult}
   */
  async generateContentStream(
    request: GenerateContentRequest | string
  ): Promise<StreamGenerateContentResult> {
    request = formatContentRequest(
      request,
      this.generation_config,
      this.safety_settings
    );
    validateGenerateContentRequest(request);

    if (request.generation_config) {
      request.generation_config = validateGenerationConfig(
        request.generation_config
      );
    }

    const generateContentRequest: GenerateContentRequest = {
      contents: request.contents,
      generation_config: request.generation_config ?? this.generation_config,
      safety_settings: request.safety_settings ?? this.safety_settings,
      tools: request.tools ?? [],
    };
    const response = await postRequest({
      region: this._vertex_instance.location,
      project: this._vertex_instance.project,
      resourcePath: this.publisherModelEndpoint,
      resourceMethod: constants.STREAMING_GENERATE_CONTENT_METHOD,
      token: await this._vertex_instance.token,
      data: generateContentRequest,
      apiEndpoint: this._vertex_instance.apiEndpoint,
    }).catch(e => {
      throw new GoogleGenerativeAIError('exception posting request', e);
    });
    throwErrorIfNotOK(response);
    const streamResult = processStream(response);
    return Promise.resolve(streamResult);
  }

  /**
   * Make a async request to count tokens.
   * @param request A CountTokensRequest object with the request contents.
   * @return The CountTokensResponse object with the token count.
   */
  async countTokens(request: CountTokensRequest): Promise<CountTokensResponse> {
    const response = await postRequest({
      region: this._vertex_instance.location,
      project: this._vertex_instance.project,
      resourcePath: this.publisherModelEndpoint,
      resourceMethod: 'countTokens',
      token: await this._vertex_instance.token,
      data: request,
      apiEndpoint: this._vertex_instance.apiEndpoint,
    }).catch(e => {
      throw new GoogleGenerativeAIError('exception posting request', e);
    });
    throwErrorIfNotOK(response);
    return processCountTokenResponse(response);
  }

  /**
   * Instantiate a ChatSession.
   * This method doesn't make any call to remote endpoint.
   * Any call to remote endpoint is implemented in ChatSession class @see ChatSession
   * @param{StartChatParams} [request] - {@link StartChatParams}
   * @return {ChatSession} {@link ChatSession}
   */
  startChat(request?: StartChatParams): ChatSession {
    const startChatRequest: StartChatSessionRequest = {
      _vertex_instance: this._vertex_instance,
      _model_instance: this,
    };

    if (request) {
      startChatRequest.history = request.history;
      startChatRequest.generation_config =
        request.generation_config ?? this.generation_config;
      startChatRequest.safety_settings =
        request.safety_settings ?? this.safety_settings;
      startChatRequest.tools = request.tools ?? this.tools;
    }
    return new ChatSession(startChatRequest);
  }
}

function formulateNewContentFromSendMessageRequest(
  request: string | Array<string | Part>
): Content[] {
  let newParts: Part[] = [];

  if (typeof request === 'string') {
    newParts = [{text: request}];
  } else if (Array.isArray(request)) {
    for (const item of request) {
      if (typeof item === 'string') {
        newParts.push({text: item});
      } else {
        newParts.push(item);
      }
    }
  }

  return assignRoleToPartsAndValidateSendMessageRequest(newParts);
}

/**
 * When multiple Part types (i.e. FunctionResponsePart and TextPart) are
 * passed in a single Part array, we may need to assign different roles to each
 * part. Currently only FunctionResponsePart requires a role other than 'user'.
 * @ignore
 * @param {Array<Part>} parts Array of parts to pass to the model
 * @return {Content[]} Array of content items
 */
function assignRoleToPartsAndValidateSendMessageRequest(
  parts: Array<Part>
): Content[] {
  const userContent: Content = {role: constants.USER_ROLE, parts: []};
  const functionContent: Content = {role: constants.FUNCTION_ROLE, parts: []};
  let hasUserContent = false;
  let hasFunctionContent = false;
  for (const part of parts) {
    if ('functionResponse' in part) {
      functionContent.parts.push(part);
      hasFunctionContent = true;
    } else {
      userContent.parts.push(part);
      hasUserContent = true;
    }
  }

  if (hasUserContent && hasFunctionContent) {
    throw new ClientError(
      'Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message.'
    );
  }

  if (!hasUserContent && !hasFunctionContent) {
    throw new ClientError('No content is provided for sending chat message.');
  }

  if (hasUserContent) {
    return [userContent];
  }

  return [functionContent];
}

function throwErrorIfNotOK(response: Response | undefined) {
  if (response === undefined) {
    throw new GoogleGenerativeAIError('response is undefined');
  }
  const status: number = response.status;
  const statusText: string = response.statusText;
  const errorMessage = `got status: ${status} ${statusText}`;
  if (status >= 400 && status < 500) {
    throw new ClientError(errorMessage);
  }
  if (!response.ok) {
    throw new GoogleGenerativeAIError(errorMessage);
  }
}

function validateGcsInput(contents: Content[]) {
  for (const content of contents) {
    for (const part of content.parts) {
      if ('file_data' in part) {
        // @ts-ignore
        const uri = part['file_data']['file_uri'];
        if (!uri.startsWith('gs://')) {
          throw new URIError(
            `Found invalid Google Cloud Storage URI ${uri}, Google Cloud Storage URIs must start with gs://`
          );
        }
      }
    }
  }
}

function validateFunctionResponseRequest(contents: Content[]) {
  const lastestContentPart = contents[contents.length - 1].parts[0];
  if (!('functionResponse' in lastestContentPart)) {
    return;
  }
  const errorMessage =
    'Please ensure that function response turn comes immediately after a function call turn.';
  if (contents.length < 2) {
    throw new ClientError(errorMessage);
  }
  const secondLastestContentPart = contents[contents.length - 2].parts[0];
  if (!('functionCall' in secondLastestContentPart)) {
    throw new ClientError(errorMessage);
  }
}

function validateGenerateContentRequest(request: GenerateContentRequest) {
  validateGcsInput(request.contents);
  validateFunctionResponseRequest(request.contents);
}

function validateGenerationConfig(
  generation_config: GenerationConfig
): GenerationConfig {
  if ('top_k' in generation_config) {
    if (!(generation_config.top_k! > 0) || !(generation_config.top_k! <= 40)) {
      delete generation_config.top_k;
    }
  }
  return generation_config;
}

function formatContentRequest(
  request: GenerateContentRequest | string,
  generation_config?: GenerationConfig,
  safety_settings?: SafetySetting[]
): GenerateContentRequest {
  if (typeof request === 'string') {
    return {
      contents: [{role: constants.USER_ROLE, parts: [{text: request}]}],
      generation_config: generation_config,
      safety_settings: safety_settings,
    };
  } else {
    return request;
  }
}
