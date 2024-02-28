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
import {countTokens} from '../functions/count_tokens';
import {
  generateContent,
  generateContentStream,
} from '../functions/generate_content';
import {ChatSession, ChatSessionPreview} from './chat_session';
import {constants} from '../util';

/**
 * Base class for generative models.
 * NOTE: this class should not be instantiated directly. Use
 * `vertexai.getGenerativeModel()` instead.
 */
export class GenerativeModel {
  model: string;
  generation_config?: GenerationConfig;
  safety_settings?: SafetySetting[];
  tools?: Tool[];
  requestOptions?: RequestOptions;
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
    this.requestOptions = getGenerativeModelParams.requestOptions ?? {};
    if (this.model.startsWith('models/')) {
      this.publisherModelEndpoint = `publishers/google/${this.model}`;
    } else {
      this.publisherModelEndpoint = `publishers/google/models/${this.model}`;
    }
  }

  /**
   * Gets access token from GoogleAuth. Throws GoogleAuthError when fails.
   * @returns {Promise<any>} Promise of token
   */
  get token(): Promise<any> {
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
      this.generation_config,
      this.safety_settings,
      this.requestOptions
    );
  }

  /**
   * Makes an async stream request to generate content. The response will be
   * returned in stream.
   * @param {GenerateContentRequest} request - {@link GenerateContentRequest}
   * @returns {Promise<StreamGenerateContentResult>} Promise of {@link
   *     StreamGenerateContentResult}
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
      this.safety_settings,
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
   * Instantiates a ChatSession.
   * This method doesn't make any call to remote endpoint.
   * Any call to remote endpoint is implemented in ChatSession class @see ChatSession
   * @param{StartChatParams} [request] - {@link StartChatParams}
   * @returns {ChatSession} {@link ChatSession}
   */
  startChat(request?: StartChatParams): ChatSession {
    const startChatRequest: StartChatSessionRequest = {
      project: this.project,
      location: this.location,
      googleAuth: this.googleAuth,
      publisher_model_endpoint: this.publisherModelEndpoint,
    };

    if (request) {
      startChatRequest.history = request.history;
      startChatRequest.generation_config =
        request.generation_config ?? this.generation_config;
      startChatRequest.safety_settings =
        request.safety_settings ?? this.safety_settings;
      startChatRequest.tools = request.tools ?? this.tools;
      startChatRequest.api_endpoint = request.api_endpoint ?? this.apiEndpoint;
    }
    return new ChatSession(startChatRequest, this.requestOptions);
  }
}

/**
 * Base class for generative models in preview.
 * NOTE: this class should not be instantiated directly. Use
 * `vertexai.getGenerativeModel()` instead.
 */
export class GenerativeModelPreview {
  model: string;
  generation_config?: GenerationConfig;
  safety_settings?: SafetySetting[];
  tools?: Tool[];
  requestOptions?: RequestOptions;
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
    this.requestOptions = getGenerativeModelParams.requestOptions ?? {};
    if (this.model.startsWith('models/')) {
      this.publisherModelEndpoint = `publishers/google/${this.model}`;
    } else {
      this.publisherModelEndpoint = `publishers/google/models/${this.model}`;
    }
  }

  /**
   * Gets access token from GoogleAuth. Throws GoogleAuthError when fails.
   * @returns {Promise<any>} Promise of token
   */
  get token(): Promise<any> {
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
      this.generation_config,
      this.safety_settings,
      this.requestOptions
    );
  }

  /**
   * Makes an async stream request to generate content. The response will be
   * returned in stream.
   * @param {GenerateContentRequest} request - {@link GenerateContentRequest}
   * @returns {Promise<StreamGenerateContentResult>} Promise of {@link
   *     StreamGenerateContentResult}
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
      this.safety_settings,
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
   * @param{StartChatParams} [request] - {@link StartChatParams}
   * @returns {ChatSessionPrevew} {@link ChatSessionPrevew}
   */
  startChat(request?: StartChatParams): ChatSessionPreview {
    const startChatRequest: StartChatSessionRequest = {
      project: this.project,
      location: this.location,
      googleAuth: this.googleAuth,
      publisher_model_endpoint: this.publisherModelEndpoint,
    };

    if (request) {
      startChatRequest.history = request.history;
      startChatRequest.generation_config =
        request.generation_config ?? this.generation_config;
      startChatRequest.safety_settings =
        request.safety_settings ?? this.safety_settings;
      startChatRequest.tools = request.tools ?? this.tools;
    }
    return new ChatSessionPreview(startChatRequest, this.requestOptions);
  }
}
