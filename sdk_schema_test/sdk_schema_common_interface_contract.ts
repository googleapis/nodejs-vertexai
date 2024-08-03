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

export interface TextPart {
  text: string;
  inlineData?: never;
  fileData?: never;
  functionResponse?: never;
  functionCall?: never;
}

export interface InlineDataPart {
  text?: never;
  inlineData: GenerativeContentBlob;
  functionCall?: never;
  functionResponse?: never;
  fileData?: never;
}

export interface GenerativeContentBlob {
  mimeType: string;
  data: string;
}

export interface FileDataPart {
  text?: never;
  inlineData?: never;
  fileData: FileData;
  functionResponse?: never;
  functionCall?: never;
}

export interface FileData {
  mimeType: string;
  fileUri: string;
}

export interface FunctionResponsePart {
  text?: never;
  inlineData?: never;
  fileData?: never;
  functionResponse: FunctionResponse;
  functionCall?: never;
}

export interface FunctionResponse {
  name: string;
  response: object;
}

export interface FunctionCallPart {
  text?: never;
  inlineData?: never;
  fileData?: never;
  functionResponse?: never;
  functionCall: FunctionCall;
}

export interface FunctionCall {
  name: string;
  args: object;
}

export type Part =
  | TextPart
  | InlineDataPart
  | FileDataPart
  | FunctionResponsePart
  | FunctionCallPart;

export interface Content {
  parts: Part[];
  role: string;
}

export interface GenerateContentRequest {
  contents: Content[];
}

export interface GenerateContentCandidate {
  content: Content;
  index: number;
}

export interface PromptFeedback {
  blockReasonMessage?: string;
}

//eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UsageMetadata {}

export interface GenerateContentResponse {
  candidates?: GenerateContentCandidate[];
  promptFeedback?: PromptFeedback;
  usageMetadata?: UsageMetadata;
}
