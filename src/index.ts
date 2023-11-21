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
import {Content, GenerateContentParams, GenerateContentRequest, GenerateContentResult, GenerationConfig, Part, SafetySetting} from './types/content';
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
      apiKey: string,  // TODO: remove when we switch to Vertex endpoint
      apiEndpoint?: string,
  ) {
    this.preview =
        new VertexAI_Internal(project, location, apiKey, apiEndpoint);
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
      protected readonly project: string,
      protected readonly location: string,
      protected readonly apiKey:
          string,  // TODO: remove when we switch to Vertex endpoint
      protected readonly apiEndpoint?: string,
  ) {}

  /**
   * Gets an authentication token for making Vertex REST API requests.
   * @param vertex The VertexAI instance.
   */
  // TODO: change the `any` type below to be more specific
  protected get token(): Promise<any>|string {
    if (this.tokenInternal) {
      return this.tokenInternal;
    }
    // Generate a new token if it hasn't been set
    // TODO: add error handling here
    const token = Promise.resolve(this.googleAuth.getAccessToken());
    return token;
  }

  /**
   * Make a generateContent request.
   * @param request A GenerateContentRequest object with the request contents.
   * @return The GenerateContentResponse object with the response candidates.
   *
   * NOTE: this method is stubbed in postRequest for now until the service is
   * available.
   */
  async generateContent(request: GenerateContentParams):
      Promise<GenerateContentResult> {
    const publisherModelEndpoint = `publishers/google/models/${request.model}`;

    const generateContentRequest: GenerateContentRequest = {
      model: request.model,
      contents: request.contents,
      generation_config: request.generation_config,
      safety_settings: request.safety_settings,
    }

    let response;
    try {
      response = await postRequest({
        region: this.location,
        project: this.project,
        resourcePath: publisherModelEndpoint,
        resourceMethod: request.stream ? 'streamGenerateContent' :
                                         'generateContent',
        token: await this.token,
        data: generateContentRequest,
        apiKey: this.apiKey,
        apiEndpoint: this.apiEndpoint,
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

    // TODO: handle streaming and non-streaming response here
  }

  startChat(request: StartChatParams): ChatSession {
    const startChatRequest = {
      model: request.model,
      project: this.project,
      location: this.location,
      history: request.history,
      generation_config: request.generation_config,
      safety_settings: request.safety_settings,
      _vertex_instance: this,
    };

    return new ChatSession(startChatRequest);
  }
}

/**
 * Params to initiate a multiturn chat with the model via startChat
 */
export declare interface StartChatParams {
  model: string;
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
  project: string;
  location: string;
  _vertex_instance: VertexAI_Internal;
}

/**
 * Session for a multiturn chat with the model
 */
export class ChatSession {
  // Substitute apiKey for these in Labs
  private project: string;
  private location: string;

  private _history: Content[];
  private _vertex_instance: VertexAI_Internal;


  model: string;
  generation_config?: GenerationConfig;
  safety_settings?: SafetySetting[];

  get history(): Content[] {
    return this._history;
  }

  constructor(request: StartChatSessionRequest) {
    this.project = request.project;
    this.location = request.location;
    this.model = request.model;
    this._history = request.history ?? [];
    this._vertex_instance = request._vertex_instance;
  }

  async sendMessage(request: string|
                    Array<string|Part>): Promise<GenerateContentResult> {
    // TODO: this is stubbed until the service is available
    let generateContentrequest: GenerateContentParams = {
      model: this.model,
      contents: [],
      safety_settings: this.safety_settings,
      generation_config: this.generation_config,
    };

    let currentContent = [];

    if (typeof request === 'string') {
      currentContent = [{role: 'user', parts: [{text: request}]}];
    } else if (Array.isArray(request)) {
      for (const item of request) {
        if (typeof item === 'string') {
          currentContent.push({role: 'user', parts: [{text: item}]});
        } else {
          currentContent.push({role: 'user', parts: [item]});
        }
      }
    };

    generateContentrequest.contents = currentContent;
    const generateContentResponse =
        await this._vertex_instance.generateContent(generateContentrequest);
    // TODO: add error handling

    // First add the messages sent by the user
    for (const content of currentContent) {
      this._history.push(content);
    };

    for (const result of generateContentResponse.responses) {
      for (const candidate of result.candidates) {
        this._history.push(candidate.content);
      }
    }
    return generateContentResponse;
  }
}

export {
  Content,
  GenerateContentParams,
  GenerateContentRequest,
  GenerateContentResult,
  GenerationConfig,
  Part,
  SafetySetting
};
