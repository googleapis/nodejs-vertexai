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

import {countTokens, generateContent, generateContentStream} from './functions';
import {validateGenerationConfig} from './functions/pre_fetch_processing';
import {
  Content,
  CountTokensRequest,
  CountTokensResponse,
  GenerateContentRequest,
  GenerateContentResult,
  GenerationConfig,
  GetGenerativeModelParams,
  ModelParams,
  Part,
  SafetySetting,
  StartChatParams,
  StartChatSessionRequest,
  StreamGenerateContentResult,
  Tool,
  VertexInit,
} from './types/content';
import {
  ClientError,
  GoogleAuthError,
  GoogleGenerativeAIError,
} from './types/errors';
import {constants} from './util';

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
   * @param {ModelParams} modelParams - {@link ModelParams} Parameters to specify the generative model.
   * @return {GenerativeModel} Instance of the GenerativeModel class. {@link GenerativeModel}
   */
  getGenerativeModel(modelParams: ModelParams): GenerativeModel {
    const getGenerativeModelParams: GetGenerativeModelParams = {
      model: modelParams.model,
      project: this.project,
      location: this.location,
      googleAuth: this.googleAuth,
      apiEndpoint: this.apiEndpoint,
      safety_settings: modelParams.safety_settings,
      tools: modelParams.tools,
    };
    if (modelParams.generation_config) {
      getGenerativeModelParams.generation_config = validateGenerationConfig(
        modelParams.generation_config
      );
    }

    return new GenerativeModel(getGenerativeModelParams);
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
 * Chat session to make multi-turn send message request.
 * `sendMessage` method makes async call to get response of a chat message.
 * `sendMessageStream` method makes async call to stream response of a chat message.
 */
export class ChatSession {
  private project: string;
  private location: string;
  private historyInternal: Content[];
  private _send_stream_promise: Promise<void> = Promise.resolve();
  private publisher_model_endpoint: string;
  private token: Promise<any>;
  generation_config?: GenerationConfig;
  safety_settings?: SafetySetting[];
  tools?: Tool[];
  private api_endpoint?: string;

  get history(): Content[] {
    return this.historyInternal;
  }

  /**
   * @constructor
   * @param {StartChatSessionRequest} request - {@link StartChatSessionRequest}
   */
  constructor(request: StartChatSessionRequest) {
    this.project = request.project;
    this.location = request.location;
    this.historyInternal = request.history ?? [];
    this.generation_config = request.generation_config;
    this.safety_settings = request.safety_settings;
    this.tools = request.tools;
    this.api_endpoint = request.api_endpoint;
    this.token = request.token ?? Promise.resolve();
    this.publisher_model_endpoint = request.publisher_model_endpoint ?? '';
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

    const generateContentResult: GenerateContentResult = await generateContent(
      this.location,
      this.project,
      this.publisher_model_endpoint,
      this.token,
      generateContentrequest,
      this.api_endpoint,
      this.generation_config,
      this.safety_settings
    ).catch(e => {
      throw e;
    });
    const generateContentResponse = await generateContentResult.response;
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

    const streamGenerateContentResultPromise = generateContentStream(
      this.location,
      this.project,
      this.publisher_model_endpoint,
      this.token,
      generateContentrequest,
      this.api_endpoint,
      this.generation_config,
      this.safety_settings
    ).catch(e => {
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
  private project: string;
  private location: string;
  private googleAuth: GoogleAuth;
  private publisherModelEndpoint: string;
  private apiEndpoint?: string;

  /**
   * @constructor
   * @param {GetGenerativeModelParams} getGenerativeModelParams - {@link GetGenerativeModelParams}
   */
  constructor(getGenerativeModelParams: GetGenerativeModelParams) {
    this.project = getGenerativeModelParams.project;
    this.location = getGenerativeModelParams.location;
    this.apiEndpoint = getGenerativeModelParams.apiEndpoint;
    this.googleAuth = getGenerativeModelParams.googleAuth;
    this.model = getGenerativeModelParams.model;
    this.generation_config = getGenerativeModelParams.generation_config;
    this.safety_settings = getGenerativeModelParams.safety_settings;
    this.tools = getGenerativeModelParams.tools;
    if (this.model.startsWith('models/')) {
      this.publisherModelEndpoint = `publishers/google/${this.model}`;
    } else {
      this.publisherModelEndpoint = `publishers/google/models/${this.model}`;
    }
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
   * Make a async call to generate content.
   * @param request A GenerateContentRequest object with the request contents.
   * @return The GenerateContentResponse object with the response candidates.
   */
  async generateContent(
    request: GenerateContentRequest | string
  ): Promise<GenerateContentResult> {
    return generateContent(
      this.location,
      this.project,
      this.publisherModelEndpoint,
      this.token,
      request,
      this.apiEndpoint,
      this.generation_config,
      this.safety_settings
    );
  }

  /**
   * Make an async stream request to generate content. The response will be returned in stream.
   * @param {GenerateContentRequest} request - {@link GenerateContentRequest}
   * @return {Promise<StreamGenerateContentResult>} Promise of {@link StreamGenerateContentResult}
   */
  async generateContentStream(
    request: GenerateContentRequest | string
  ): Promise<StreamGenerateContentResult> {
    return generateContentStream(
      this.location,
      this.project,
      this.publisherModelEndpoint,
      this.token,
      request,
      this.apiEndpoint,
      this.generation_config,
      this.safety_settings
    );
  }

  /**
   * Make a async request to count tokens.
   * @param request A CountTokensRequest object with the request contents.
   * @return The CountTokensResponse object with the token count.
   */
  async countTokens(request: CountTokensRequest): Promise<CountTokensResponse> {
    return countTokens(
      this.location,
      this.project,
      this.publisherModelEndpoint,
      this.token,
      request,
      this.apiEndpoint
    );
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
      project: this.project,
      location: this.location,
    };

    if (request) {
      startChatRequest.history = request.history;
      startChatRequest.publisher_model_endpoint = this.publisherModelEndpoint;
      startChatRequest.token = this.token;
      startChatRequest.generation_config =
        request.generation_config ?? this.generation_config;
      startChatRequest.safety_settings =
        request.safety_settings ?? this.safety_settings;
      startChatRequest.tools = request.tools ?? this.tools;
      startChatRequest.api_endpoint = request.api_endpoint ?? this.apiEndpoint;
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
