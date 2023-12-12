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

/**
 * Params used to initialize the Vertex SDK
 */
export declare interface VertexInit {
  project: string;
  location: string;
  apiEndpoint?: string;
}

/**
 * Params used by the generateContent endpoint
 */
export declare interface GenerateContentRequest extends BaseModelParams {
  contents: Content[];
}

/**
 * Params used to call countTokens
 */
export declare interface CountTokensRequest {
  contents: Content[];
}

/**
 * Response returned from countTokens
 */
export declare interface CountTokensResponse {
  totalTokens: number;
  totalBillableCharacters?: number;
}

/**
 * Configuration for initializing a model, for example via getGenerativeModel
 */
export declare interface ModelParams extends BaseModelParams {
  model: string;
}

/**
 * Base params for initializing a model or calling GenerateContent
 */
export declare interface BaseModelParams {
  safety_settings?: SafetySetting[];
  generation_config?: GenerationConfig;
}

/**
 * Safety feedback for an entire request
 */
export declare interface SafetySetting {
  category: HarmCategory;
  threshold: HarmBlockThreshold;
}

/**
 * Configuration options for model generation and outputs
 */
export declare interface GenerationConfig {
  candidate_count?: number;
  stop_sequences?: string[];
  max_output_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
}

export enum HarmCategory {
  HARM_CATEGORY_UNSPECIFIED = 'HARM_CATEGORY_UNSPECIFIED',
  HARM_CATEGORY_HATE_SPEECH = 'HARM_CATEGORY_HATE_SPEECH',
  HARM_CATEGORY_DANGEROUS_CONTENT = 'HARM_CATEGORY_DANGEROUS_CONTENT',
  HARM_CATEGORY_HARASSMENT = 'HARM_CATEGORY_HARASSMENT',
  HARM_CATEGORY_SEXUALLY_EXPLICIT = 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
}

export enum HarmBlockThreshold {
  // Unspecified harm block threshold.
  HARM_BLOCK_THRESHOLD_UNSPECIFIED = 'HARM_BLOCK_THRESHOLD_UNSPECIFIED',
  // Block low threshold and above (i.e. block more).
  BLOCK_LOW_AND_ABOVE = 'BLOCK_LOW_AND_ABOVE',
  // Block medium threshold and above.
  BLOCK_MEDIUM_AND_ABOVE = 'BLOCK_MEDIUM_AND_ABOVE',
  // Block only high threshold (i.e. block less).
  BLOCK_ONLY_HIGH = 'BLOCK_ONLY_HIGH',
  // Block none.
  BLOCK_NONE = 'BLOCK_NONE',
}

/**
 * Safety rating for a piece of content
 */
export declare interface SafetyRating {
  category: HarmCategory;
  threshold: HarmBlockThreshold;
}

/**
 * A single turn in a conversation with the model
 */
export declare interface Content {
  parts: Part[];
  role?: string;
}

/**
 * A part of a turn in a conversation with the model with a fixed MIME type.
 *
 * Exactly one of text or inline_data must be provided.
 */
// TODO: Adjust so one must be true.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BasePart {}

export interface TextPart extends BasePart {
  text: string;
  inline_data?: never;
}

export interface InlineDataPart extends BasePart {
  text?: never;
  inline_data: GenerativeContentBlob;
}

export interface FileData {
  mime_type: string;
  file_uri: string;
}

export interface FileDataPart extends BasePart {
  text?: never;
  file_data: FileData;
}

export declare type Part = TextPart | InlineDataPart | FileDataPart;

/**
 * Raw media bytes sent directly in the request. Text should not be sent as
 * raw bytes.
 */
export declare interface GenerativeContentBlob {
  // The MIME type of the source data. The only accepted values: "image/png",
  // "image/jpeg".
  mime_type: string;
  // image must be base64 string
  data: string;
}

/**
 * Metadata on token count for the request
 */
export declare interface UsageMetadata {
  prompt_token_count?: number;
  candidates_token_count?: number;
  totalTokenCount?: number;
}

/**
 * A set of the feedback metadata the prompt specified in
 * GenerateContentRequest.content.
 */
export declare interface PromptFeedback {
  block_reason: BlockedReason;
  safety_ratings: SafetyRating[];
  block_reason_message: string;
}

export enum BlockedReason {
  // A blocked reason was not specified.
  BLOCKED_REASON_UNSPECIFIED = 'BLOCK_REASON_UNSPECIFIED',
  // Content was blocked by safety settings.
  SAFETY = 'SAFETY',
  // Content was blocked, but the reason is uncategorized.
  OTHER = 'OTHER',
}

export enum FinishReason {
  // Default value. This value is unused.
  FINISH_REASON_UNSPECIFIED = 'FINISH_REASON_UNSPECIFIED',
  // Natural stop point of the model or provided stop sequence.
  STOP = 'STOP',
  // The maximum number of tokens as specified in the request was reached.
  MAX_TOKENS = 'MAX_TOKENS',
  // The candidate content was flagged for safety reasons.
  SAFETY = 'SAFETY',
  // The candidate content was flagged for recitation reasons.
  RECITATION = 'RECITATION',
  // Unknown reason.
  OTHER = 'OTHER',
}

/**
 * Wrapper for respones from a generateContent request
 */
export declare interface GenerateContentResult {
  // All GenerateContentResponses received so far
  response: GenerateContentResponse;
}

/**
 * Wrapper for respones from a streamGenerateContent request
 */
export declare interface StreamGenerateContentResult {
  // Async iterable that provides one GenerateContentResponse at a time
  response: Promise<GenerateContentResponse>;
  stream: AsyncGenerator<GenerateContentResponse>;
}

/**
 * Response from the model supporting multiple candidates
 */
export declare interface GenerateContentResponse {
  candidates: GenerateContentCandidate[];
  // This is only populated if there are no candidates due to a safety block
  promptFeedback?: PromptFeedback;
  usageMetadata?: UsageMetadata;
}

/**
 * Content candidate from the model
 */
export declare interface GenerateContentCandidate {
  content: Content;
  index?: number;
  finishReason?: FinishReason;
  finishMessage?: string;
  safetyRatings?: SafetyRating[];
  citationMetadata?: CitationMetadata;
}

/**
 * Citation information for model-generated canadidate.
 */
export declare interface CitationMetadata {
  citationSources: CitationSource[];
}

/**
 * Citations to sources for a specific response
 */
export declare interface CitationSource {
  startIndex?: number;
  endIndex?: number;
  uri?: string;
  license?: string;
}

const USER_AGENT_PRODUCT = 'model-builder';

const CLIENT_LIBRARY_LANGUAGE = 'node-js';

// TODO: update this version number using release-please
const CLIENT_LIBRARY_VERSION = '0.1.0';

const USER_AGENT = USER_AGENT_PRODUCT + '/' + CLIENT_LIBRARY_VERSION;

const CLIENT_INFO = {
  user_agent: USER_AGENT,
  client_library_language: CLIENT_LIBRARY_LANGUAGE,
  client_library_version: CLIENT_LIBRARY_VERSION,
};

export {CLIENT_INFO};
