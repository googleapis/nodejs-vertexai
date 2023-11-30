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
import * as fs from 'fs';
import {GoogleAuth} from 'google-auth-library';

import {processNonStream, processStream} from './process_stream';
import {Content, CountTokensRequest, CountTokensResponse, GenerateContentRequest, GenerateContentResult, GenerationConfig, ModelParams, Part, SafetySetting, StreamGenerateContentResult, VertexInit} from './types/content';
import {constants, postRequest} from './util';
// TODO: update this when model names are available
// const SUPPORTED_MODELS: Array<string> = ['text-bison@001'];

/**
 * Base class for authenticating to Vertex, creates the preview namespace.
 * The base class object takes the following arguments:
 * @param project The Google Cloud project to use for the request
 * @param location The Google Cloud project location to use for the
 *     request
 * @param apiEndpoint Optional. The base Vertex AI endpoint to use for the
 *     request. If not provided, the default regionalized endpoint (i.e.
 * us-central1-aiplatform.googleapis.com) will be used.
 */
export class VertexAI {
  public preview: VertexAI_Internal;

  constructor(init: VertexInit) {
    this.preview =
        new VertexAI_Internal(init.project, init.location, init.apiEndpoint);
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

  async imageToBase64(image: Buffer|string): Promise<string> {
    if (Buffer.isBuffer(image)) {
      return Promise.resolve(image.toString('base64'));
    } else if (
        typeof image === 'string' &&
        (image.endsWith('.jpeg') || image.endsWith('.png'))) {
      // TODO: consider storing supported file types in a constant
      try {
        const imageBuffer = await fs.readFileSync(image);
        return Promise.resolve(imageBuffer.toString('base64'));
      } catch (e) {
        throw new Error(`Error reading from image file: ${e}`);
      }

    } else {
      throw new Error(
          'Invalid image provided. Please provide either a Buffer or a local filepath to a jpeg or png image.');
    }
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

  async sendMessage(request: string|
                    Array<string|Part>): Promise<GenerateContentResult> {
    const newContent: Content = formulateNewContent(request);
    let generateContentrequest: GenerateContentRequest = {
      contents: this.historyInternal.concat([newContent]),
      safety_settings: this.safety_settings,
      generation_config: this.generation_config,
    };

    const generateContentResult =
        await this._model_instance.generateContent(generateContentrequest);
    
    const generateContentResponse = await generateContentResult.response;

    // Only push the latest message to history if the response returned a result
    if (generateContentResponse.candidates.length !== 0) {
      this.historyInternal.push(newContent);
      this.historyInternal.push(
        generateContentResponse.candidates[0].content);
    } else {
      // TODO: handle promptFeedback in the response
      throw new Error('Did not get a candidate from the model');
    }

    return Promise.resolve({response:generateContentResponse});
  }
  
  async streamSendMessage(request: string|
    Array<string|Part>): Promise<StreamGenerateContentResult> {
      const newContent: Content = formulateNewContent(request);
      let generateContentrequest: GenerateContentRequest = {
        contents: this.historyInternal.concat([newContent]),
        safety_settings: this.safety_settings,
        generation_config: this.generation_config,
      };
  
      const streamGenerateContentResult =
          await this._model_instance.streamGenerateContent(generateContentrequest);
      const streamGenerateContentResponse =
          await streamGenerateContentResult.response;
      // Only push the latest message to history if the response returned a result
      if (streamGenerateContentResponse.candidates.length !== 0) {
        this.historyInternal.push(newContent);
        this.historyInternal.push(
          streamGenerateContentResponse.candidates[0].content);
      } else {
        // TODO: handle promptFeedback in the response
        throw new Error('Did not get a candidate from the model');
      }
  
      return Promise.resolve(
          {
            response: Promise.resolve(streamGenerateContentResponse),
            stream: streamGenerateContentResult.stream,
          }
      );
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
  async generateContent(request: GenerateContentRequest):
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
        resourceMethod: constants.GENERATE_CONTENT_METHOD,
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

    const result: GenerateContentResult = processNonStream(response);
    return Promise.resolve(result);
  }

  /**
   * Make a streamGenerateContent request.
   * @param request A GenerateContentRequest object with the request contents.
   * @return The GenerateContentResponse object with the response candidates.
   */
  async streamGenerateContent(request: GenerateContentRequest):
      Promise<StreamGenerateContentResult> {
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
        resourceMethod: constants.STREAMING_GENERATE_CONTENT_METHOD,
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
    return Promise.resolve(streamResult);
  }

  /**
   * Make a countTokens request.
   * @param request A CountTokensRequest object with the request contents.
   * @return The CountTokensResponse object with the token count.
   */
  async countTokens(request: CountTokensRequest): Promise<CountTokensResponse> {
    let response;
    try {
      response = await postRequest({
        region: this._vertex_instance.location,
        project: this._vertex_instance.project,
        resourcePath: `publishers/google/models/${this.model}`,
        resourceMethod: 'countTokens',
        token: await this._vertex_instance.token,
        data: request,
        apiEndpoint: this._vertex_instance.apiEndpoint,
      });
      if (response === undefined) {
        throw new Error('did not get a valid response.');
      }
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

    } catch (e) {
      console.log(e);
    }
    if (response) {
      const responseJson = await response.json();
      return responseJson as CountTokensResponse;
    } else {
      throw new Error('did not get a valid response.');
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
  
function formulateNewContent(request: string|Array<string|Part>): Content {
  
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
  return newContent;
}
