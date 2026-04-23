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

import {formulateSystemInstructionIntoContent} from '../functions/util';
import {
  generateContent,
  generateContentStream,
} from '../functions/generate_content';
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
import {ToolConfig} from '../types';
import {ClientError, GoogleAuthError} from '../types/errors';
import {constants} from '../util';

/**
 * The `ChatSession` class is used to make multiturn send message requests. You
 * can instantiate this class by using the `startChat` method in the
 * `GenerativeModel` class. The `sendMessage` method makes an async call to get
 * the response of a chat message at at once. The `sendMessageStream` method
 * makes an async call to stream the response of a chat message as it's being
 * generated.
 */
export class ChatSession {
  private readonly project: string;
  private readonly location: string;
  private historyInternal: Content[];
  private sendStreamPromise: Promise<void> = Promise.resolve();
  private readonly resourcePath: string;
  private readonly googleAuth: GoogleAuth;
  protected readonly requestOptions?: RequestOptions;
  private readonly generationConfig?: GenerationConfig;
  private readonly safetySettings?: SafetySetting[];
  private readonly tools?: Tool[];
  private readonly toolConfig?: ToolConfig;
  private readonly apiEndpoint?: string;
  private readonly systemInstruction?: Content;

  async getHistory(): Promise<Content[]> {
    return Promise.resolve(this.historyInternal);
  }

  /**
   * @constructor
   * @param request - {@link StartChatSessionRequest}
   */
  constructor(
    request: StartChatSessionRequest,
    requestOptions?: RequestOptions
  ) {
    this.project = request.project;
    this.location = request.location;
    this.googleAuth = request.googleAuth;
    this.resourcePath = request.resourcePath;
    this.historyInternal = request.history ?? [];
    this.generationConfig = request.generationConfig;
    this.safetySettings = request.safetySettings;
    this.tools = request.tools;
    this.toolConfig = request.toolConfig;
    this.apiEndpoint = request.apiEndpoint;
    this.requestOptions = requestOptions ?? {};
    if (request.systemInstruction) {
      this.systemInstruction = formulateSystemInstructionIntoContent(
        request.systemInstruction
      );
    }
  }

  /**
   * Gets access token from GoogleAuth. Throws {@link GoogleAuthError} when
   * fails.
   * @returns Promise of token.
   */
  private fetchToken(): Promise<string | null | undefined> {
    const tokenPromise = this.googleAuth.getAccessToken().catch(e => {
      throw new GoogleAuthError(constants.CREDENTIAL_ERROR_MESSAGE, e);
    });
    return tokenPromise;
  }

  /**
   * Makes an async call to send chat message.
   *
   * The response is returned in {@link
   * GenerateContentResult.response}.
   *
   * @example
   * ```
   * const chat = generativeModel.startChat();
   * const result1 = await chat.sendMessage("How can I learn more about Node.js?");
   * console.log('Response: ', JSON.stringify(result1.response));
   *
   * const result2 = await chat.sendMessage("What about python?");
   * console.log('Response: ', JSON.stringify(result2.response));
   * ```
   *
   * @param request - send message request.
   * @returns Promise of {@link GenerateContentResult}.
   */
  async sendMessage(
    request: string | Array<string | Part>
  ): Promise<GenerateContentResult> {
    const newContent: Content[] =
      formulateNewContentFromSendMessageRequest(request);
    const generateContentRequest: GenerateContentRequest = {
      contents: this.historyInternal.concat(newContent),
      safetySettings: this.safetySettings,
      generationConfig: this.generationConfig,
      tools: this.tools,
      toolConfig: this.toolConfig,
      systemInstruction: this.systemInstruction,
    };

    const generateContentResult: GenerateContentResult = await generateContent(
      this.location,
      this.resourcePath,
      this.fetchToken(),
      generateContentRequest,
      this.apiEndpoint,
      this.generationConfig,
      this.safetySettings,
      this.tools,
      this.toolConfig,
      this.requestOptions
    ).catch(e => {
      throw e;
    });
    const generateContentResponse = await generateContentResult.response;
    // Only push the latest message to history if the response returns a result
    if (
      generateContentResponse.candidates &&
      generateContentResponse.candidates.length !== 0
    ) {
      this.historyInternal = this.historyInternal.concat(newContent);
      const contentFromModel = generateContentResponse.candidates[0].content;
      this.historyInternal.push(contentFromModel);
    }

    return Promise.resolve(generateContentResult);
  }

  private async appendHistory(
    streamGenerateContentResultPromise: Promise<StreamGenerateContentResult>,
    newContent: Content[]
  ): Promise<void> {
    const streamGenerateContentResult =
      await streamGenerateContentResultPromise;
    const streamGenerateContentResponse =
      await streamGenerateContentResult.response;
    // Only push the latest message to history if the response returned a result
    if (
      streamGenerateContentResponse.candidates &&
      streamGenerateContentResponse.candidates.length !== 0
    ) {
      this.historyInternal = this.historyInternal.concat(newContent);
      const contentFromModel =
        streamGenerateContentResponse.candidates[0].content;
      this.historyInternal.push(contentFromModel);
    }
  }

  /**
   * Makes an async call to stream send message.
   *
   * The response is streamed chunk by chunk in
   * {@link StreamGenerateContentResult.stream}. The aggregated response is
   * avaliable in {@link StreamGenerateContentResult.response} after all chunks
   * are returned.
   *
   * @example
   * ```
   * const chat = generativeModel.startChat();
   * const chatInput = "How can I learn more about Node.js?";
   * const result = await chat.sendMessageStream(chatInput);
   * for await (const item of result.stream) {
   *   console.log(item.candidates[0].content.parts[0].text);
   * }
   * const response = await result.response;
   * console.log('aggregated response: ', JSON.stringify(result.response));
   * ```
   *
   * @param request - send message request.
   * @returns Promise of {@link StreamGenerateContentResult}.
   */
  async sendMessageStream(
    request: string | Array<string | Part>
  ): Promise<StreamGenerateContentResult> {
    const newContent: Content[] =
      formulateNewContentFromSendMessageRequest(request);
    const generateContentrequest: GenerateContentRequest = {
      contents: this.historyInternal.concat(newContent),
      safetySettings: this.safetySettings,
      generationConfig: this.generationConfig,
      tools: this.tools,
      toolConfig: this.toolConfig,
      systemInstruction: this.systemInstruction,
    };

    const streamGenerateContentResultPromise = generateContentStream(
      this.location,
      this.resourcePath,
      this.fetchToken(),
      generateContentrequest,
      this.apiEndpoint,
      this.generationConfig,
      this.safetySettings,
      this.tools,
      this.toolConfig,
      this.requestOptions
    ).catch(e => {
      throw e;
    });

    this.sendStreamPromise = this.appendHistory(
      streamGenerateContentResultPromise,
      newContent
    ).catch(e => {
      // Errors from remote endpoint will be catchable by user from streamGenerateContentResultPromise
      // Errors in appendHistory should not throw to cause user's programe exit with code 1
      console.error(e);
    });
    return streamGenerateContentResultPromise;
  }
}

/**
 * The `ChatSessionPreview` class is used to make multiturn send message requests. You
 * can instantiate this class by using the `startChat` method in the
 * `GenerativeModelPreview` class. The `sendMessage` method makes an async call to get
 * the response of a chat message at at once. The `sendMessageStream` method
 * makes an async call to stream the response of a chat message as it's being
 * generated.
 */
export class ChatSessionPreview {
  private readonly project: string;
  private readonly location: string;
  private historyInternal: Content[];
  private sendStreamPromise: Promise<void> = Promise.resolve();
  private readonly resourcePath: string;
  private readonly googleAuth: GoogleAuth;
  protected readonly requestOptions?: RequestOptions;
  private readonly generationConfig?: GenerationConfig;
  private readonly safetySettings?: SafetySetting[];
  private readonly tools?: Tool[];
  private readonly toolConfig?: ToolConfig;
  private readonly apiEndpoint?: string;
  private readonly systemInstruction?: Content;
  private readonly cachedContent?: string;

  async getHistory(): Promise<Content[]> {
    return Promise.resolve(this.historyInternal);
  }

  /**
   * @constructor
   * @param request - {@link StartChatSessionRequest}
   */
  constructor(
    request: StartChatSessionRequest,
    requestOptions?: RequestOptions
  ) {
    this.project = request.project;
    this.location = request.location;
    this.googleAuth = request.googleAuth;
    this.resourcePath = request.resourcePath;
    this.historyInternal = request.history ?? [];
    this.generationConfig = request.generationConfig;
    this.safetySettings = request.safetySettings;
    this.tools = request.tools;
    this.toolConfig = request.toolConfig;
    this.apiEndpoint = request.apiEndpoint;
    this.requestOptions = requestOptions ?? {};
    this.cachedContent = request.cachedContent;
    if (request.systemInstruction) {
      this.systemInstruction = formulateSystemInstructionIntoContent(
        request.systemInstruction
      );
    }
  }

  /**
   * Gets access token from GoogleAuth. Throws GoogleAuthError when fails.
   * @returns Promise of token.
   */
  private fetchToken(): Promise<string | null | undefined> {
    const tokenPromise = this.googleAuth.getAccessToken().catch(e => {
      throw new GoogleAuthError(constants.CREDENTIAL_ERROR_MESSAGE, e);
    });
    return tokenPromise;
  }

  /**
   * Makes an async call to send chat message.
   *
   * The response is returned in {@link
   * GenerateContentResult.response}.
   *
   * @example
   * ```
   * const chat = generativeModelPreview.startChat();
   * const result1 = await chat.sendMessage("How can I learn more about Node.js?");
   * console.log('Response: ', JSON.stringify(result1.response));
   *
   * const result2 = await chat.sendMessage("What about python?");
   * console.log('Response: ', JSON.stringify(result2.response));
   * ```
   *
   * @param request - send message request.
   * @returns Promise of {@link GenerateContentResult}.
   */
  async sendMessage(
    request: string | Array<string | Part>
  ): Promise<GenerateContentResult> {
    const newContent: Content[] =
      formulateNewContentFromSendMessageRequest(request);
    const generateContentRequest: GenerateContentRequest = {
      contents: this.historyInternal.concat(newContent),
      safetySettings: this.safetySettings,
      generationConfig: this.generationConfig,
      tools: this.tools,
      toolConfig: this.toolConfig,
      systemInstruction: this.systemInstruction,
      cachedContent: this.cachedContent,
    };

    const generateContentResult: GenerateContentResult = await generateContent(
      this.location,
      this.resourcePath,
      this.fetchToken(),
      generateContentRequest,
      this.apiEndpoint,
      this.generationConfig,
      this.safetySettings,
      this.tools,
      this.toolConfig,
      this.requestOptions
    ).catch(e => {
      throw e;
    });
    const generateContentResponse = await generateContentResult.response;
    // Only push the latest message to history if the response returned a result
    if (
      generateContentResponse.candidates &&
      generateContentResponse.candidates.length !== 0
    ) {
      this.historyInternal = this.historyInternal.concat(newContent);
      const contentFromAssistant =
        generateContentResponse.candidates[0].content;
      this.historyInternal.push(contentFromAssistant);
    }

    return Promise.resolve(generateContentResult);
  }

  private async appendHistory(
    streamGenerateContentResultPromise: Promise<StreamGenerateContentResult>,
    newContent: Content[]
  ): Promise<void> {
    const streamGenerateContentResult =
      await streamGenerateContentResultPromise;
    const streamGenerateContentResponse =
      await streamGenerateContentResult.response;
    // Only push the latest message to history if the response returned a result
    if (
      streamGenerateContentResponse.candidates &&
      streamGenerateContentResponse.candidates.length !== 0
    ) {
      this.historyInternal = this.historyInternal.concat(newContent);
      const contentFromAssistant =
        streamGenerateContentResponse.candidates[0].content;
      this.historyInternal.push(contentFromAssistant);
    }
  }

  /**
   * Makes an async call to stream send message.
   *
   * The response is streamed chunk by chunk in
   * {@link StreamGenerateContentResult.stream}. The aggregated response is
   * avaliable in {@link StreamGenerateContentResult.response} after all chunks
   * are returned.
   *
   * @example
   * ```
   * const chat = generativeModel.startChat();
   * const chatInput = "How can I learn more about Node.js?";
   * const result = await chat.sendMessageStream(chatInput);
   * for await (const item of result.stream) {
   *   console.log(item.candidates[0].content.parts[0].text);
   * }
   * const response = await result.response;
   * console.log('aggregated response: ', JSON.stringify(result.response));
   * ```
   *
   * @param request - send message request.
   * @returns Promise of {@link StreamGenerateContentResult}.
   */
  async sendMessageStream(
    request: string | Array<string | Part>
  ): Promise<StreamGenerateContentResult> {
    const newContent: Content[] =
      formulateNewContentFromSendMessageRequest(request);
    const generateContentRequest: GenerateContentRequest = {
      contents: this.historyInternal.concat(newContent),
      safetySettings: this.safetySettings,
      generationConfig: this.generationConfig,
      tools: this.tools,
      toolConfig: this.toolConfig,
      systemInstruction: this.systemInstruction,
      cachedContent: this.cachedContent,
    };

    const streamGenerateContentResultPromise = generateContentStream(
      this.location,
      this.resourcePath,
      this.fetchToken(),
      generateContentRequest,
      this.apiEndpoint,
      this.generationConfig,
      this.safetySettings,
      this.tools,
      this.toolConfig,
      this.requestOptions
    ).catch(e => {
      throw e;
    });

    this.sendStreamPromise = this.appendHistory(
      streamGenerateContentResultPromise,
      newContent
    ).catch(e => {
      // Errors from remote endpoint will be catchable by user from streamGenerateContentResultPromise
      // Errors in appendHistory should not throw to cause user's programe exit with code 1
      console.error(e);
    });
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
 * @param parts Array of parts to pass to the model
 * @returns Array of content items
 */
function assignRoleToPartsAndValidateSendMessageRequest(
  parts: Array<Part>
): Content[] {
  const userContent: Content = {role: constants.USER_ROLE, parts: []};
  const functionContent: Content = {role: constants.USER_ROLE, parts: []};
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
