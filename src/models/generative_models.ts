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
import {GoogleAuth} from 'google-auth-library';

import {countTokens} from '../functions/count_tokens';
import {
  generateContent,
  generateContentStream,
} from '../functions/generate_content';
import {
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
import {GoogleAuthError} from '../types/errors';
import {constants} from '../util';

import {ChatSession, ChatSessionPreview} from './chat_session';

/**
 * Base class for generative models.
 * NOTE: this class should not be instantiated directly. Use
 * `vertexai.getGenerativeModel()` instead.
 */
export class GenerativeModel {
  private readonly model: string;
  private readonly generationConfig?: GenerationConfig;
  private readonly safetySettings?: SafetySetting[];
  private readonly tools?: Tool[];
  private readonly requestOptions?: RequestOptions;
  private readonly project: string;
  private readonly location: string;
  private readonly googleAuth: GoogleAuth;
  private readonly publisherModelEndpoint: string;
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
    if (this.model.startsWith('models/')) {
      this.publisherModelEndpoint = `publishers/google/${this.model}`;
    } else {
      this.publisherModelEndpoint = `publishers/google/models/${this.model}`;
    }
  }

  /**
   * Gets access token from GoogleAuth. Throws {@link GoogleAuthError} when
   * fails.
   * @returns Promise of token
   */
  get token(): Promise<string | null | undefined> {
    const tokenPromise = this.googleAuth.getAccessToken().catch(e => {
      throw new GoogleAuthError(constants.CREDENTIAL_ERROR_MESSAGE, e);
    });
    return tokenPromise;
  }

  /**
   * Makes a async call to generate content.
   *
   * The response will be returned in {@link
   * StreamGenerateContentResult.response}.
   *
   * @example
   * ```
   * const request = {
   *   contents: [{role: 'user', parts: [{text: 'How are you doing today?'}]}],
   * };
   * const result = await generativeModel.generateContent(request);
   * const response = await result.response;
   * console.log('Response: ', JSON.stringify(response));
   * ```
   *
   * @param request - A GenerateContentRequest object with the request contents.
   * @returns The GenerateContentResponse object with the response candidates.
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
      this.generationConfig,
      this.safetySettings,
      this.tools,
      this.requestOptions
    );
  }

  /**
   * Makes an async stream request to generate content.
   *
   * The response will be returned in {@link
   * StreamGenerateContentResult.stream}. When all streams returned, the
   * aggregated response will be available in
   * {@link StreamGenerateContentResult.response}.
   *
   * @example
   * ```
   * const request = {
   *   contents: [{role: 'user', parts: [{text: 'How are you doing today?'}]}],
   * };
   * const streamingResp = await generativeModel.generateContentStream(request);
   * for await (const item of streamingResp.stream) {
   *   console.log('stream chunk: ', JSON.stringify(item));
   * }
   * console.log('aggregated response: ', JSON.stringify(await
   * streamingResp.response));
   * ```
   *
   * @param request - {@link GenerateContentRequest}
   * @returns Promise of {@link StreamGenerateContentResult}
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
      this.generationConfig,
      this.safetySettings,
      this.tools,
      this.requestOptions
    );
  }

  /**
   * Makes a async request to count tokens.
   *
   * This will return the token count and the number of billable characters for
   * a prompt.
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
   * @param request A CountTokensRequest object with the request contents.
   * @returns The CountTokensResponse object with the token count.
   */
  async countTokens(request: CountTokensRequest): Promise<CountTokensResponse> {
    return countTokens(
      this.location,
      this.project,
      this.publisherModelEndpoint,
      this.token,
      request,
      this.apiEndpoint,
      this.requestOptions
    );
  }

  /**
   * Instantiates a {@link ChatSession}.
   *
   * The {@link ChatSession} is a stateful class that holds the state of the
   * conversation with the model and provides methods to interact with the model
   * in chat mode. Calling this method doesn't make any call to remote endpoint.
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
      tools: this.tools,
    };

    if (request) {
      startChatRequest.history = request.history;
      startChatRequest.generationConfig =
        request.generationConfig ?? this.generationConfig;
      startChatRequest.safetySettings =
        request.safetySettings ?? this.safetySettings;
      startChatRequest.tools = request.tools ?? this.tools;
      startChatRequest.apiEndpoint = request.apiEndpoint ?? this.apiEndpoint;
    }
    return new ChatSession(startChatRequest, this.requestOptions);
  }
}

/**
 * Base class for generative models in preview.
 * NOTE: this class should not be instantiated directly. Use
 * `vertexai.preview.getGenerativeModel()` instead.
 */
export class GenerativeModelPreview {
  private readonly model: string;
  private readonly generationConfig?: GenerationConfig;
  private readonly safetySettings?: SafetySetting[];
  private readonly tools?: Tool[];
  private readonly requestOptions?: RequestOptions;
  private readonly project: string;
  private readonly location: string;
  private readonly googleAuth: GoogleAuth;
  private readonly publisherModelEndpoint: string;
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
    if (this.model.startsWith('models/')) {
      this.publisherModelEndpoint = `publishers/google/${this.model}`;
    } else {
      this.publisherModelEndpoint = `publishers/google/models/${this.model}`;
    }
  }

  /**
   * Gets access token from GoogleAuth. Throws GoogleAuthError when fails.
   * @returns Promise of token.
   */
  get token(): Promise<string | null | undefined> {
    const tokenPromise = this.googleAuth.getAccessToken().catch(e => {
      throw new GoogleAuthError(constants.CREDENTIAL_ERROR_MESSAGE, e);
    });
    return tokenPromise;
  }

  /**
   * Makes a async call to generate content.
   * @param request A GenerateContentRequest object with the request contents.
   * @returns The GenerateContentResponse object with the response candidates.
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
      this.generationConfig,
      this.safetySettings,
      this.tools,
      this.requestOptions
    );
  }

  /**
   * Makes an async stream request to generate content. The response will be
   * returned in stream.
   * @param request - {@link GenerateContentRequest}
   * @returns Promise of {@link StreamGenerateContentResult}
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
      this.generationConfig,
      this.safetySettings,
      this.tools,
      this.requestOptions
    );
  }

  /**
   * Makes a async request to count tokens.
   * @param request A CountTokensRequest object with the request contents.
   * @returns The CountTokensResponse object with the token count.
   */
  async countTokens(request: CountTokensRequest): Promise<CountTokensResponse> {
    return countTokens(
      this.location,
      this.project,
      this.publisherModelEndpoint,
      this.token,
      request,
      this.apiEndpoint,
      this.requestOptions
    );
  }

  /**
   * Instantiates a ChatSessionPreview.
   * This method doesn't make any call to remote endpoint.
   * Any call to remote endpoint is implemented in ChatSessionPreview class @see ChatSessionPreview
   * @param request - {@link StartChatParams}
   * @returns {@link ChatSessionPrevew}
   */
  startChat(request?: StartChatParams): ChatSessionPreview {
    const startChatRequest: StartChatSessionRequest = {
      project: this.project,
      location: this.location,
      googleAuth: this.googleAuth,
      publisherModelEndpoint: this.publisherModelEndpoint,
      tools: this.tools,
    };

    if (request) {
      startChatRequest.history = request.history;
      startChatRequest.generationConfig =
        request.generationConfig ?? this.generationConfig;
      startChatRequest.safetySettings =
        request.safetySettings ?? this.safetySettings;
      startChatRequest.tools = request.tools ?? this.tools;
    }
    return new ChatSessionPreview(startChatRequest, this.requestOptions);
  }
}
