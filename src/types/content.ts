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
 * Params for the generateContent method
 */
export declare interface GenerateContentParams extends GenerateContentRequest {
  // defaults to true
  stream?: boolean;
}

/**
 * Params used by the generateContent endpoint
 */
export declare interface GenerateContentRequest extends BaseModelParams {
  contents: Content[];
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

enum HarmCategory {
  HARM_CATEGORY_UNSPECIFIED = 0,
  HARM_CATEGORY_DEROGATORY = 1,
  HARM_CATEGORY_TOXICITY = 2,
  HARM_CATEGORY_VIOLENCE = 3,
  HARM_CATEGORY_SEXUAL = 4,
  HARM_CATEGORY_MEDICAL = 5,
  HARM_CATEGORY_DANGEROUS = 6
}

enum HarmBlockThreshold {
  HARM_BLOCK_THRESHOLD_UNSPECIFIED = 0,
  BLOCK_LOW_AND_ABOVE = 1,
  BLOCK_MEDIUM_AND_ABOVE = 2,
  BLOCK_ONLY_HIGH = 3,
  BLOCK_NONE = 4,
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
export declare interface TextPart {
  text: string;
}

export declare interface InlineDataPart {
  inline_data: GenerativeContentBlob;
}

export declare type Part = TextPart | InlineDataPart;

/**
 * Raw media bytes sent directly in the request. Text should not be sent as
 * raw bytes.
 */
export declare interface GenerativeContentBlob {
  // The MIME type of the source data. The only accepted values: "image/png",
  // "image/jpeg".
  mime_type: string;
  // Raw bytes for media formats - image, audio, video, etc.
  // This is type bytes in the proto
  // Node prefers Buffer over Uint8Array?
  data: Uint8Array|Buffer;
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

enum BlockedReason {
  // A blocked reason was not specified.
  BLOCKED_REASON_UNSPECIFIED = 0,
  // Content was blocked by safety settings.
  SAFETY = 1,
  // Content was blocked, but the reason is uncategorized.
  OTHER = 2,
}

enum FinishReason {
  // Default value. This value is unused.
  FINISH_REASON_UNSPECIFIED = 0,
  // Natural stop point of the model or provided stop sequence.
  STOP = 1,
  // The maximum number of tokens as specified in the request was reached.
  MAX_TOKENS = 2,
  // The candidate content was flagged for safety reasons.
  SAFETY = 3,
  // The candidate content was flagged for recitation reasons.
  RECITATION = 4,
  // Unknown reason.
  OTHER = 5,
}

/**
 * Wrapper for respones from a generateContent request
 */
export declare interface GenerateContentResult {
  // All GenerateContentResponses received so far
  responses: GenerateContentResponse[];
  // Async iterable that provides one GenerateContentResponse at a time
  stream?: AsyncGenerator<GenerateContentResponse>;
  // If there are no candidates because this request was blocked, we will
  // get prompt_feedback from the first (and only) response.
  prompt_feedback?: PromptFeedback;
}

/**
 * Response from the model supporting multiple candidates
 */
export declare interface GenerateContentResponse {
  candidates: GenerateContentCandidate[];
  // This is only populated if there are no candidates due to a safety block
  prompt_feedback?: PromptFeedback;
  usage_metadata?: UsageMetadata;
}

/**
 * Content candidate from the model
 */
export declare interface GenerateContentCandidate {
  content: Content;
  index?: number;
  finish_reason?: FinishReason;
  finish_message?: string;
  safety_ratings?: SafetyRating[];
  citation_metadata?: CitationMetadata;
}

/**
 * Citation information for model-generated canadidate.
 */
export declare interface CitationMetadata {
  citation_sources: CitationSource[];
}

/**
 * Citations to sources for a specific response
 */
export declare interface CitationSource {
  start_index?: number;
  end_index?: number;
  uri?: string;
  license?: string;
}

const USER_AGENT_PRODUCT = "model-builder";

const CLIENT_LIBRARY_LANGUAGE = "node-js";

// TODO: update this version number using release-please
const CLIENT_LIBRARY_VERSION = "0.1.0";

const USER_AGENT = USER_AGENT_PRODUCT + '/' + CLIENT_LIBRARY_VERSION;

const CLIENT_INFO = {
  'user_agent': USER_AGENT,
  'client_library_language': CLIENT_LIBRARY_LANGUAGE,
  'client_library_version': CLIENT_LIBRARY_VERSION,
};

export {CLIENT_INFO};
