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
  Content,
  GenerateContentRequest,
  GenerateContentResult,
  GenerationConfig,
  Part,
  RequestOptions,
  SafetySetting,
  StartChatSessionRequest,
  StreamGenerateContentResult,
  Tool,
} from '../types/content';
import {
  generateContent,
  generateContentStream,
} from '../functions/generate_content';
import {
  ClientError,
  GoogleAuthError,
  GoogleGenerativeAIError,
} from '../types/errors';
import {constants} from '../util';

/**
 * Chat session to make multi-turn send message request.
 * Users can instantiate this using startChat method in GenerativeModel class.
 * `sendMessage` method makes async call to get response of a chat message.
 * `sendMessageStream` method makes async call to stream response of a chat message.
 */
export class ChatSession {
  private project: string;
  private location: string;
  private historyInternal: Content[];
  private _send_stream_promise: Promise<void> = Promise.resolve();
  private publisher_model_endpoint: string;
  private googleAuth: GoogleAuth;
  requestOptions?: RequestOptions;
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
  constructor(
    request: StartChatSessionRequest,
    requestOptions?: RequestOptions
  ) {
    this.project = request.project;
    this.location = request.location;
    this.googleAuth = request.googleAuth;
    this.publisher_model_endpoint = request.publisher_model_endpoint;
    this.historyInternal = request.history ?? [];
    this.generation_config = request.generation_config;
    this.safety_settings = request.safety_settings;
    this.tools = request.tools;
    this.api_endpoint = request.api_endpoint;
    this.requestOptions = requestOptions ?? {};
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
   * Makes an sync call to send message.
   * @param {string | Array<string | Part>} request - send message request. {@link Part}
   * @returns {Promise<GenerateContentResult>} Promise of {@link GenerateContentResult}
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
      this.safety_settings,
      this.requestOptions
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

    return Promise.resolve(generateContentResult);
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
   * Makes an async call to stream send message. Response will be returned in stream.
   * @param {string | Array<string | Part>} request - send message request. {@link Part}
   * @returns {Promise<StreamGenerateContentResult>} Promise of {@link StreamGenerateContentResult}
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
      this.safety_settings,
      this.requestOptions
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
 * Chat session to make multi-turn send message request.
 * `sendMessage` method makes async call to get response of a chat message.
 * `sendMessageStream` method makes async call to stream response of a chat message.
 */
export class ChatSessionPreview {
  private project: string;
  private location: string;
  private historyInternal: Content[];
  private _send_stream_promise: Promise<void> = Promise.resolve();
  private publisher_model_endpoint: string;
  private googleAuth: GoogleAuth;
  requestOptions?: RequestOptions;
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
  constructor(
    request: StartChatSessionRequest,
    requestOptions?: RequestOptions
  ) {
    this.project = request.project;
    this.location = request.location;
    this.googleAuth = request.googleAuth;
    this.publisher_model_endpoint = request.publisher_model_endpoint;
    this.historyInternal = request.history ?? [];
    this.generation_config = request.generation_config;
    this.safety_settings = request.safety_settings;
    this.tools = request.tools;
    this.api_endpoint = request.api_endpoint;
    this.requestOptions = requestOptions ?? {};
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
   * Makes an sync call to send message.
   * @param {string | Array<string | Part>} request - send message request. {@link Part}
   * @returns {Promise<GenerateContentResult>} Promise of {@link GenerateContentResult}
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
      this.safety_settings,
      this.requestOptions
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

    return Promise.resolve(generateContentResult);
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
   * Makes an async call to stream send message. Response will be returned in stream.
   * @param {string | Array<string | Part>} request - send message request. {@link Part}
   * @returns {Promise<StreamGenerateContentResult>} Promise of {@link StreamGenerateContentResult}
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
      this.safety_settings,
      this.requestOptions
    ).catch(e => {
      throw e;
    });

    this._send_stream_promise = this.appendHistory(
      streamGenerateContentResultPromise,
      newContent
    );
    return streamGenerateContentResultPromise;
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
 * @returns {Content[]} Array of content items
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
