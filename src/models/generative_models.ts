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
  SafetySetting,
  StartChatParams,
  StartChatSessionRequest,
  StreamGenerateContentResult,
  Tool,
} from '../types/content';
import {GoogleAuthError} from '../types/errors';
import {countTokens} from '../functions/count_tokens';
import {ChatSessionPreview} from './chat_session';

/**
 * Base class for generative models in preview.
 * NOTE: this class should not be instantiated directly. Use
 * `vertexai.preview.getGenerativeModel()` instead.
 */
export class GenerativeModelPreview {
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
    // TODO: invoke generateContent function in functions
    const dummyGenerateContentResult: GenerateContentResult =
      {} as GenerateContentResult;
    return Promise.resolve(dummyGenerateContentResult);
  }

  /**
   * Make an async stream request to generate content. The response will be returned in stream.
   * @param {GenerateContentRequest} request - {@link GenerateContentRequest}
   * @return {Promise<StreamGenerateContentResult>} Promise of {@link StreamGenerateContentResult}
   */
  async generateContentStream(
    request: GenerateContentRequest | string
  ): Promise<StreamGenerateContentResult> {
    // TODO: invoke generateContentStream function in functions
    const dummyStreamGenerateContentResult: StreamGenerateContentResult =
      {} as StreamGenerateContentResult;
    return Promise.resolve(dummyStreamGenerateContentResult);
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
   * Instantiate a ChatSessionPreview.
   * This method doesn't make any call to remote endpoint.
   * Any call to remote endpoint is implemented in ChatSessionPreview class @see ChatSessionPreview
   * @param{StartChatParams} [request] - {@link StartChatParams}
   * @return {ChatSessionPrevew} {@link ChatSessionPrevew}
   */
  startChat(request?: StartChatParams): ChatSessionPreview {
    const startChatRequest: StartChatSessionRequest = {
      project: this.project,
      location: this.location,
    };

    if (request) {
      startChatRequest.history = request.history;
      startChatRequest.generation_config =
        request.generation_config ?? this.generation_config;
      startChatRequest.safety_settings =
        request.safety_settings ?? this.safety_settings;
      startChatRequest.tools = request.tools ?? this.tools;
    }
    return new ChatSessionPreview(startChatRequest);
  }
}
