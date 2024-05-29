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

/* tslint:disable */
import {GoogleAuth} from 'google-auth-library';

import {formulateSystemInstructionIntoContent} from './util';
import {countTokens} from '../functions/count_tokens';
import {
  generateContent,
  generateContentStream,
} from '../functions/generate_content';
import {
  Content,
  CountTokensRequest,
  CountTokensResponse,
  GenerateContentRequest,
  GenerateContentResult,
  GenerationConfig,
  GetGenerativeModelParams,
  RequestOptions,
  SafetySetting,
  StartChatParams,
  StartChatSessionRequest,
  StreamGenerateContentResult,
  Tool,
} from '../types/content';
import {ClientError, GoogleAuthError} from '../types/errors';
import {constants} from '../util';

import {ChatSession, ChatSessionPreview} from './chat_session';

/**
 * The `GenerativeModel` class is the base class for the generative models on
 * Vertex AI.
 * NOTE: Don't instantiate this class directly. Use
 * `vertexai.getGenerativeModel()` instead.
 */
export class GenerativeModel {
  private readonly model: string;
  private readonly generationConfig?: GenerationConfig;
  private readonly safetySettings?: SafetySetting[];
  private readonly tools?: Tool[];
  private readonly requestOptions?: RequestOptions;
  private readonly systemInstruction?: Content;
  private readonly project: string;
  private readonly location: string;
  private readonly googleAuth: GoogleAuth;
  private readonly publisherModelEndpoint: string;
  private readonly resourcePath: string;
  private readonly apiEndpoint?: string;

  /**
   * @constructor
   * @param getGenerativeModelParams - {@link GetGenerativeModelParams}
   */
  constructor(getGenerativeModelParams: GetGenerativeModelParams) {
    this.project = getGenerativeModelParams.project;
    this.location = getGenerativeModelParams.location;
    this.apiEndpoint = getGenerativeModelParams.apiEndpoint;
    this.googleAuth = getGenerativeModelParams.googleAuth;
    this.model = getGenerativeModelParams.model;
    this.generationConfig = getGenerativeModelParams.generationConfig;
    this.safetySettings = getGenerativeModelParams.safetySettings;
    this.tools = getGenerativeModelParams.tools;
    this.requestOptions = getGenerativeModelParams.requestOptions ?? {};
    if (getGenerativeModelParams.systemInstruction) {
      this.systemInstruction = formulateSystemInstructionIntoContent(
        getGenerativeModelParams.systemInstruction
      );
    }
    this.resourcePath = formulateResourcePathFromModel(
      this.model,
      this.project,
      this.location
    );
    // publisherModelEndpoint is deprecated
    this.publisherModelEndpoint = this.resourcePath;
  }

  /**
   * Gets access token from GoogleAuth. Throws {@link GoogleAuthError} when
   * fails.
   * @returns Promise of token string.
   */
  private fetchToken(): Promise<string | null | undefined> {
    const tokenPromise = this.googleAuth.getAccessToken().catch(e => {
      throw new GoogleAuthError(constants.CREDENTIAL_ERROR_MESSAGE, e);
    });
    return tokenPromise;
  }

  /**
   * Makes an async call to generate content.
   *
   * The response will be returned in {@link
   * GenerateContentResult.response}.
   *
   * @example
   * ```
   * const request = {
   *   contents: [{role: 'user', parts: [{text: 'How are you doing today?'}]}],
   * };
   * const result = await generativeModel.generateContent(request);
   * console.log('Response: ', JSON.stringify(result.response));
   * ```
   *
   * @param request - A GenerateContentRequest object with the request contents.
   * @returns The GenerateContentResponse object with the response candidates.
   */
  async generateContent(
    request: GenerateContentRequest | string
  ): Promise<GenerateContentResult> {
    request = formulateRequestToGenerateContentRequest(request);
    const formulatedRequest =
      formulateSystemInstructionIntoGenerateContentRequest(
        request,
        this.systemInstruction
      );
    return generateContent(
      this.location,
      this.resourcePath,
      this.fetchToken(),
      formulatedRequest,
      this.apiEndpoint,
      this.generationConfig,
      this.safetySettings,
      this.tools,
      this.requestOptions
    );
  }

  /**
   * Makes an async stream request to generate content.
   *
   * The response is returned chunk by chunk as it's being generated in {@link
   * StreamGenerateContentResult.stream}. After all chunks of the response are
   * returned, the aggregated response is available in
   * {@link StreamGenerateContentResult.response}.
   *
   * @example
   * ```
   * const request = {
   *   contents: [{role: 'user', parts: [{text: 'How are you doing today?'}]}],
   * };
   * const streamingResult = await generativeModel.generateContentStream(request);
   * for await (const item of streamingResult.stream) {
   *   console.log('stream chunk: ', JSON.stringify(item));
   * }
   * const aggregatedResponse = await streamingResult.response;
   * console.log('aggregated response: ', JSON.stringify(aggregatedResponse));
   * ```
   *
   * @param request - {@link GenerateContentRequest}
   * @returns Promise of {@link StreamGenerateContentResult}
   */
  async generateContentStream(
    request: GenerateContentRequest | string
  ): Promise<StreamGenerateContentResult> {
    request = formulateRequestToGenerateContentRequest(request);
    const formulatedRequest =
      formulateSystemInstructionIntoGenerateContentRequest(
        request,
        this.systemInstruction
      );
    return generateContentStream(
      this.location,
      this.resourcePath,
      this.fetchToken(),
      formulatedRequest,
      this.apiEndpoint,
      this.generationConfig,
      this.safetySettings,
      this.tools,
      this.requestOptions
    );
  }

  /**
   * Makes an async request to count tokens.
   *
   * The `countTokens` function returns the token count and the number of
   * billable characters for a prompt.
   *
   * @example
   * ```
   * const request = {
   *   contents: [{role: 'user', parts: [{text: 'How are you doing today?'}]}],
   * };
   * const resp = await generativeModel.countTokens(request);
   * console.log('count tokens response: ', resp);
   * ```
   *
   * @param request - A CountTokensRequest object with the request contents.
   * @returns The CountTokensResponse object with the token count.
   */
  async countTokens(request: CountTokensRequest): Promise<CountTokensResponse> {
    return countTokens(
      this.location,
      this.resourcePath,
      this.fetchToken(),
      request,
      this.apiEndpoint,
      this.requestOptions
    );
  }

  /**
   * Instantiates a {@link ChatSession}.
   *
   * The {@link ChatSession} class is a stateful class that holds the state of
   * the conversation with the model and provides methods to interact with the
   * model in chat mode. Calling this method doesn't make any calls to a remote
   * endpoint. To make remote call, use {@link ChatSession.sendMessage} or
   * @link ChatSession.sendMessageStream}.
   *
   * @example
   * ```
   * const chat = generativeModel.startChat();
   * const result1 = await chat.sendMessage("How can I learn more about Node.js?");
   * const response1 = await result1.response;
   * console.log('Response: ', JSON.stringify(response1));
   *
   * const result2 = await chat.sendMessageStream("What about python?");
   * const response2 = await result2.response;
   * console.log('Response: ', JSON.stringify(await response2));
   * ```
   *
   * @param request - {@link StartChatParams}
   * @returns {@link ChatSession}
   */
  startChat(request?: StartChatParams): ChatSession {
    const startChatRequest: StartChatSessionRequest = {
      project: this.project,
      location: this.location,
      googleAuth: this.googleAuth,
      publisherModelEndpoint: this.publisherModelEndpoint,
      resourcePath: this.resourcePath,
      tools: this.tools,
      systemInstruction: this.systemInstruction,
    };

    if (request) {
      startChatRequest.history = request.history;
      startChatRequest.generationConfig =
        request.generationConfig ?? this.generationConfig;
      startChatRequest.safetySettings =
        request.safetySettings ?? this.safetySettings;
      startChatRequest.tools = request.tools ?? this.tools;
      startChatRequest.apiEndpoint = request.apiEndpoint ?? this.apiEndpoint;
      startChatRequest.systemInstruction =
        request.systemInstruction ?? this.systemInstruction;
    }
    return new ChatSession(startChatRequest, this.requestOptions);
  }
}

/**
 * The `GenerativeModelPreview` class is the base class for the generative models
 * that are in preview.
 * NOTE: Don't instantiate this class directly. Use
 * `vertexai.preview.getGenerativeModel()` instead.
 */
export class GenerativeModelPreview {
  private readonly model: string;
  private readonly generationConfig?: GenerationConfig;
  private readonly safetySettings?: SafetySetting[];
  private readonly tools?: Tool[];
  private readonly requestOptions?: RequestOptions;
  private readonly systemInstruction?: Content;
  private readonly project: string;
  private readonly location: string;
  private readonly googleAuth: GoogleAuth;
  private readonly publisherModelEndpoint: string;
  private readonly resourcePath: string;
  private readonly apiEndpoint?: string;

  /**
   * @constructor
   * @param getGenerativeModelParams - {@link GetGenerativeModelParams}
   */
  constructor(getGenerativeModelParams: GetGenerativeModelParams) {
    this.project = getGenerativeModelParams.project;
    this.location = getGenerativeModelParams.location;
    this.apiEndpoint = getGenerativeModelParams.apiEndpoint;
    this.googleAuth = getGenerativeModelParams.googleAuth;
    this.model = getGenerativeModelParams.model;
    this.generationConfig = getGenerativeModelParams.generationConfig;
    this.safetySettings = getGenerativeModelParams.safetySettings;
    this.tools = getGenerativeModelParams.tools;
    this.requestOptions = getGenerativeModelParams.requestOptions ?? {};
    if (getGenerativeModelParams.systemInstruction) {
      this.systemInstruction = formulateSystemInstructionIntoContent(
        getGenerativeModelParams.systemInstruction
      );
    }
    this.resourcePath = formulateResourcePathFromModel(
      this.model,
      this.project,
      this.location
    );
    // publisherModelEndpoint is deprecated
    this.publisherModelEndpoint = this.resourcePath;
  }

  /**
   * Gets access token from GoogleAuth. Throws {@link GoogleAuthError} when
   * fails.
   * @returns Promise of token string.
   */
  private fetchToken(): Promise<string | null | undefined> {
    const tokenPromise = this.googleAuth.getAccessToken().catch(e => {
      throw new GoogleAuthError(constants.CREDENTIAL_ERROR_MESSAGE, e);
    });
    return tokenPromise;
  }

  /**
   * Makes an async call to generate content.
   *
   * The response will be returned in {@link GenerateContentResult.response}.
   *
   * @example
   * ```
   * const request = {
   *   contents: [{role: 'user', parts: [{text: 'How are you doing today?'}]}],
   * };
   * const result = await generativeModelPreview.generateContent(request);
   * console.log('Response: ', JSON.stringify(result.response));
   * ```
   *
   * @param request - A GenerateContentRequest object with the request contents.
   * @returns The GenerateContentResponse object with the response candidates.
   */
  async generateContent(
    request: GenerateContentRequest | string
  ): Promise<GenerateContentResult> {
    request = formulateRequestToGenerateContentRequest(request);
    const formulatedRequest =
      formulateSystemInstructionIntoGenerateContentRequest(
        request,
        this.systemInstruction
      );
    return generateContent(
      this.location,
      this.resourcePath,
      this.fetchToken(),
      formulatedRequest,
      this.apiEndpoint,
      this.generationConfig,
      this.safetySettings,
      this.tools,
      this.requestOptions
    );
  }

  /**
   * Makes an async stream request to generate content.
   *
   * The response is returned chunk by chunk as it's being generated in {@link
   * StreamGenerateContentResult.stream}. After all chunks of the response are
   * returned, the aggregated response is available in
   * {@link StreamGenerateContentResult.response}.
   *
   * @example
   * ```
   * const request = {
   *   contents: [{role: 'user', parts: [{text: 'How are you doing today?'}]}],
   * };
   * const streamingResult = await generativeModelPreview.generateContentStream(request);
   * for await (const item of streamingResult.stream) {
   *   console.log('stream chunk: ', JSON.stringify(item));
   * }
   * const aggregatedResponse = await streamingResult.response;
   * console.log('aggregated response: ', JSON.stringify(aggregatedResponse));
   * ```
   *
   * @param request - {@link GenerateContentRequest}
   * @returns Promise of {@link StreamGenerateContentResult}
   */
  async generateContentStream(
    request: GenerateContentRequest | string
  ): Promise<StreamGenerateContentResult> {
    request = formulateRequestToGenerateContentRequest(request);
    const formulatedRequest =
      formulateSystemInstructionIntoGenerateContentRequest(
        request,
        this.systemInstruction
      );
    return generateContentStream(
      this.location,
      this.resourcePath,
      this.fetchToken(),
      formulatedRequest,
      this.apiEndpoint,
      this.generationConfig,
      this.safetySettings,
      this.tools,
      this.requestOptions
    );
  }

  /**
   * Makes an async request to count tokens.
   *
   * The `countTokens` function returns the token count and the number of
   * billable characters for a prompt.
   *
   * @example
   * ```
   * const request = {
   *   contents: [{role: 'user', parts: [{text: 'How are you doing today?'}]}],
   * };
   * const resp = await generativeModelPreview.countTokens(request);
   * console.log('count tokens response: ', resp);
   * ```
   *
   * @param request - A CountTokensRequest object with the request contents.
   * @returns The CountTokensResponse object with the token count.
   */
  async countTokens(request: CountTokensRequest): Promise<CountTokensResponse> {
    return countTokens(
      this.location,
      this.resourcePath,
      this.fetchToken(),
      request,
      this.apiEndpoint,
      this.requestOptions
    );
  }

  /**
   * Instantiates a {@link ChatSessionPreview}.
   *
   * The {@link ChatSessionPreview} class is a stateful class that holds the state of
   * the conversation with the model and provides methods to interact with the
   * model in chat mode. Calling this method doesn't make any calls to a remote
   * endpoint. To make remote call, use {@link ChatSessionPreview.sendMessage} or
   * {@link ChatSessionPreview.sendMessageStream}.
   *
   * @example
   * ```
   * const chat = generativeModelPreview.startChat();
   * const result1 = await chat.sendMessage("How can I learn more about Node.js?");
   * const response1 = await result1.response;
   * console.log('Response: ', JSON.stringify(response1));
   *
   * const result2 = await chat.sendMessageStream("What about python?");
   * const response2 = await result2.response;
   * console.log('Response: ', JSON.stringify(await response2));
   * ```
   *
   * @param request - {@link StartChatParams}
   * @returns {@link ChatSessionPreview}
   */
  startChat(request?: StartChatParams): ChatSessionPreview {
    const startChatRequest: StartChatSessionRequest = {
      project: this.project,
      location: this.location,
      googleAuth: this.googleAuth,
      publisherModelEndpoint: this.publisherModelEndpoint,
      resourcePath: this.resourcePath,
      tools: this.tools,
      systemInstruction: this.systemInstruction,
    };

    if (request) {
      startChatRequest.history = request.history;
      startChatRequest.generationConfig =
        request.generationConfig ?? this.generationConfig;
      startChatRequest.safetySettings =
        request.safetySettings ?? this.safetySettings;
      startChatRequest.tools = request.tools ?? this.tools;
      startChatRequest.systemInstruction =
        request.systemInstruction ?? this.systemInstruction;
    }
    return new ChatSessionPreview(startChatRequest, this.requestOptions);
  }
}

function formulateResourcePathFromModel(
  model: string,
  project: string,
  location: string
): string {
  let resourcePath: string;
  if (!model) {
    throw new ClientError('model parameter must not be empty.');
  }
  if (!model.includes('/')) {
    // example 'gemini-1.0-pro'
    resourcePath = `projects/${project}/locations/${location}/publishers/google/models/${model}`;
  } else if (model.startsWith('models/')) {
    // example 'models/gemini-1.0-pro'
    resourcePath = `projects/${project}/locations/${location}/publishers/google/${model}`;
  } else if (model.startsWith('projects/')) {
    // example 'projects/my-project/locations/my-location/models/my-tuned-model'
    resourcePath = model;
  } else {
    throw new ClientError(
      'model parameter must be either a Model Garden model ID or a full resource name.'
    );
  }

  return resourcePath;
}

function formulateRequestToGenerateContentRequest(
  request: GenerateContentRequest | string
): GenerateContentRequest {
  if (typeof request === 'string') {
    return {
      contents: [{role: constants.USER_ROLE, parts: [{text: request}]}],
    } as GenerateContentRequest;
  }
  return request;
}

function formulateSystemInstructionIntoGenerateContentRequest(
  methodRequest: GenerateContentRequest,
  classSystemInstruction?: Content
): GenerateContentRequest {
  if (methodRequest.systemInstruction) {
    methodRequest.systemInstruction = formulateSystemInstructionIntoContent(
      methodRequest.systemInstruction
    );
    return methodRequest;
  }
  if (classSystemInstruction) {
    methodRequest.systemInstruction = classSystemInstruction;
  }
  return methodRequest;
}
