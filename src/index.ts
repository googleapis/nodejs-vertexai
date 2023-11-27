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

import {emptyGenerator, processStream} from './process_stream';
import {Content, GenerateContentParams, GenerateContentRequest, GenerateContentResult, GenerationConfig, ModelParams, Part, SafetySetting} from './types/content';
import {postRequest} from './util';

// TODO: update this when model names are available
// const SUPPORTED_MODELS: Array<string> = ['text-bison@001'];

/**
 * Base class for authenticating to Vertex, creates the preview namespace.
 */
export class VertexAI {
  public preview: VertexAI_Internal;

  constructor(
      project: string,
      location: string,
      apiEndpoint?: string,
  ) {
    this.preview = new VertexAI_Internal(project, location, apiEndpoint);
  }
}

/**
 * VertexAI class implementation
 */
export class VertexAI_Internal {
  protected googleAuth: GoogleAuth = new GoogleAuth(
      {scopes: 'https://www.googleapis.com/auth/cloud-platform'});
  private tokenInternal?: string;

  /**
   * API client for authenticating to Vertex
   * @param project The Google Cloud project to use for the request
   * @param location The Google Cloud project location to use for the
   *     request
   * @param apiEndpoint The base Vertex AI endpoint to use for the request. If
   *     not provided, the default regionalized endpoint (i.e.
   * us-central1-aiplatform.googleapis.com) will be used.
   */
  constructor(
      readonly project: string,
      readonly location: string,
      readonly apiEndpoint?: string,
  ) {
    this.project = project;
    this.location = location;
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * Gets an authentication token for making Vertex REST API requests.
   * @param vertex The VertexAI instance.
   */
  // TODO: change the `any` type below to be more specific
  get token(): Promise<any>|string {
    if (this.tokenInternal) {
      return this.tokenInternal;
    }
    // Generate a new token if it hasn't been set
    // TODO: add error handling here
    const token = Promise.resolve(this.googleAuth.getAccessToken());
    return token;
  }

  getGenerativeModel(modelParams: ModelParams): GenerativeModel {
    // TODO: decide if we want to validate the provided model string
    return new GenerativeModel(
        this,
        modelParams.model,
        modelParams.generation_config,
        modelParams.safety_settings,
    );
  }
}

/**
 * Params to initiate a multiturn chat with the model via startChat
 */
export declare interface StartChatParams {
  history?: Content[];
  safety_settings?: SafetySetting[];
  generation_config?: GenerationConfig;
  stream?: boolean;
}

// StartChatSessionRequest and ChatSession are defined here instead of in
// src/types to avoid a circular dependency issue due the dep on
// VertexAI_Internal

/**
 * All params passed to initiate multiturn chat via startChat
 */
export declare interface StartChatSessionRequest extends StartChatParams {
  _vertex_instance: VertexAI_Internal;
  _model_instance: GenerativeModel;
}

/**
 * Session for a multiturn chat with the model
 */
export class ChatSession {
  // Substitute apiKey for these in Labs
  private project: string;
  private location: string;

  private historyInternal: Content[];
  private _vertex_instance: VertexAI_Internal;
  private _model_instance: GenerativeModel;

  generation_config?: GenerationConfig;
  safety_settings?: SafetySetting[];

  get history(): Content[] {
    return this.historyInternal;
  }

  constructor(request: StartChatSessionRequest) {
    this.project = request._vertex_instance.project;
    this.location = request._vertex_instance.location;
    this._model_instance = request._model_instance;
    this.historyInternal = request.history ?? [];
    this._vertex_instance = request._vertex_instance;
  }

  // TODO: update this to sendMessage / streamSendMessage after generateContent
  // is split
  async sendMessage(request: string|
                    Array<string|Part>): Promise<GenerateContentResult> {
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
    };

    const newContent: Content = {role: 'user', parts: newParts};

    // TODO: should this wait to append to history until a response is returned
    // successfully?
    this.historyInternal.push(newContent);

    let generateContentrequest: GenerateContentParams = {
      contents: this.historyInternal,
      safety_settings: this.safety_settings,
      generation_config: this.generation_config,
      stream: true,
    };

    const generateContentResponse =
        await this._model_instance.generateContent(generateContentrequest);

    // This is currently not iterating over generateContentResponse.stream, it's
    // iterating over the list of returned responses
    for (const result of generateContentResponse.responses) {
      for (const candidate of result.candidates) {
        this.historyInternal.push(candidate.content);
      }
    }
    return generateContentResponse;
  }
}


/**
 * Base class for generative models.
 *
 * NOTE: this class should not be instantiated directly. Use
 * `vertexai.preview.getGenerativeModel()` instead.
 */
export class GenerativeModel {
  model: string;
  generation_config?: GenerationConfig;
  safety_settings?: SafetySetting[];
  private _vertex_instance: VertexAI_Internal;

  constructor(
      vertex_instance: VertexAI_Internal, model: string,
      generation_config?: GenerationConfig, safety_settings?: SafetySetting[]) {
    this._vertex_instance = vertex_instance;
    this.model = model;
    this.generation_config = generation_config;
    this.safety_settings = safety_settings;
  }

  /**
   * Make a generateContent request.
   * @param request A GenerateContentRequest object with the request contents.
   * @return The GenerateContentResponse object with the response candidates.
   */
  async generateContent(request: GenerateContentParams):
      Promise<GenerateContentResult> {
    const publisherModelEndpoint = `publishers/google/models/${this.model}`;

    const generateContentRequest: GenerateContentRequest = {
      contents: request.contents,
      generation_config: request.generation_config ?? this.generation_config,
      safety_settings: request.safety_settings ?? this.safety_settings,
    }

    let response;
    try {
      response = await postRequest({
        region: this._vertex_instance.location,
        project: this._vertex_instance.project,
        resourcePath: publisherModelEndpoint,
        // TODO: update when this method is split for streaming / non-streaming
        resourceMethod: request.stream ? 'streamGenerateContent' :
                                         'generateContent',
        token: await this._vertex_instance.token,
        data: generateContentRequest,
        apiEndpoint: this._vertex_instance.apiEndpoint,
      });
      if (response === undefined) {
        throw new Error('did not get a valid response.')
      }
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }
    } catch (e) {
      console.log(e);
    }

    const streamResult = processStream(response);

    if (request.stream === false && streamResult.stream !== undefined) {
      const responses = [];
      for await (const resp of streamResult.stream) {
        responses.push(resp);
      }
      return {
        stream: emptyGenerator(),
        responses,
      };
    } else {
      // True or undefined (default true)
      return streamResult;
    }
  }

  startChat(request: StartChatParams): ChatSession {
    const startChatRequest = {
      history: request.history,
      generation_config: request.generation_config ?? this.generation_config,
      safety_settings: request.safety_settings ?? this.safety_settings,
      _vertex_instance: this._vertex_instance,
      _model_instance: this,
    };

    return new ChatSession(startChatRequest);
  }
}
