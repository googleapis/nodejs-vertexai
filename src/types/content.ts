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

// @ts-nocheck
import {GoogleAuthOptions} from 'google-auth-library';

/**
 * Params used to initialize the Vertex SDK
 * @param{string} project - the project name of your Google Cloud project. It is not the numeric project ID.
 * @param{string} location - the location of your project.
 * @param{string} [apiEndpoint] - If not specified, a default value will be resolved by SDK.
 * @param {GoogleAuthOptions} - [googleAuthOptions] The Authentication options provided by google-auth-library.
 *        Complete list of authentication options is documented in the GoogleAuthOptions interface:
 *        https://github.com/googleapis/google-auth-library-nodejs/blob/main/src/auth/googleauth.ts
 */
export declare interface VertexInit {
  project: string;
  location: string;
  apiEndpoint?: string;
  googleAuthOptions?: GoogleAuthOptions;
}

/**
 * Params used to call the generateContent method.
 * @property {Content[]} - contents. Array of {@link Content}
 */
export declare interface GenerateContentRequest extends BaseModelParams {
  contents: Content[];
}

/**
 * Params used to call the countTokens method.
 * @property {Content[]} - contents. Array of {@link Content}
 */
export declare interface CountTokensRequest {
  contents: Content[];
}

/**
 * Response returned from countTokens method.
 * @property {number} - totalTokens. The total number of tokens counted across all instances from the request.
 * @property {number} - [totalBillableCharacters]. The total number of billable characters counted across all instances from the request.
 *
 */
export declare interface CountTokensResponse {
  totalTokens: number;
  totalBillableCharacters?: number;
}

/**
 * Configuration for initializing a model, for example via getGenerativeModel
 * @property {string} model - model name.
 * @example "gemini-pro"
 */
export declare interface ModelParams extends BaseModelParams {
  model: string;
}

/**
 * Base params for initializing a model or calling GenerateContent.
 * @property {SafetySetting[]} - [safety_settings] Array of {@link SafetySetting}
 * @property {GenerationConfig} - [generation_config] {@link GenerationConfig}
 */
export declare interface BaseModelParams {
  safety_settings?: SafetySetting[];
  generation_config?: GenerationConfig;
}

/**
 * Safety feedback for an entire request.
 * @property {HarmCategory} - category. {@link HarmCategory}
 * @property {HarmBlockThreshold} - threshold. {@link HarmBlockThreshold}
 */
export declare interface SafetySetting {
  category: HarmCategory;
  threshold: HarmBlockThreshold;
}

/**
 * Configuration options for model generation and outputs
 * @property {number} - [candidate_count] Number of candidates to generate.
 * @property {string[]} - [stop_sequences] Stop sequences.
 * @property {number} - [max_output_tokens] The maximum number of output tokens to generate per message.
 * @property {number} - [temperature] Controls the randomness of predictions.
 * @property {number} - [top_p] If specified, nucleus sampling will be used.
 * @property {number} - [top_k] If specified, top-k sampling will be used.
 */
export declare interface GenerationConfig {
  candidate_count?: number;
  stop_sequences?: string[];
  max_output_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
}
/**
 * @enum {string}
 * Harm categories that will block the content.
 * Values:
 *     HARM_CATEGORY_UNSPECIFIED:
 *         The harm category is unspecified.
 *     HARM_CATEGORY_HATE_SPEECH:
 *         The harm category is hate speech.
 *     HARM_CATEGORY_DANGEROUS_CONTENT:
 *         The harm category is dangerous content.
 *     HARM_CATEGORY_HARASSMENT:
 *         The harm category is harassment.
 *     HARM_CATEGORY_SEXUALLY_EXPLICIT:
 *         The harm category is sexually explicit
 *         content.
 */
export enum HarmCategory {
  HARM_CATEGORY_UNSPECIFIED = 'HARM_CATEGORY_UNSPECIFIED',
  HARM_CATEGORY_HATE_SPEECH = 'HARM_CATEGORY_HATE_SPEECH',
  HARM_CATEGORY_DANGEROUS_CONTENT = 'HARM_CATEGORY_DANGEROUS_CONTENT',
  HARM_CATEGORY_HARASSMENT = 'HARM_CATEGORY_HARASSMENT',
  HARM_CATEGORY_SEXUALLY_EXPLICIT = 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
}

/**
 * @enum {string}
 * Probability based thresholds levels for blocking.
 * Values:
 *      HARM_BLOCK_THRESHOLD_UNSPECIFIED:
 *          Unspecified harm block threshold.
 *      BLOCK_LOW_AND_ABOVE:
 *          Block low threshold and above (i.e. block
 *          more).
 *      BLOCK_MEDIUM_AND_ABOVE:
 *          Block medium threshold and above.
 *      BLOCK_ONLY_HIGH:
 *          Block only high threshold (i.e. block less).
 *      BLOCK_NONE:
 *          Block none.
 */
export enum HarmBlockThreshold {
  HARM_BLOCK_THRESHOLD_UNSPECIFIED = 'HARM_BLOCK_THRESHOLD_UNSPECIFIED',
  BLOCK_LOW_AND_ABOVE = 'BLOCK_LOW_AND_ABOVE',
  BLOCK_MEDIUM_AND_ABOVE = 'BLOCK_MEDIUM_AND_ABOVE',
  BLOCK_ONLY_HIGH = 'BLOCK_ONLY_HIGH',
  BLOCK_NONE = 'BLOCK_NONE',
}

/**
 * @enum {string}
 * Harm probability levels in the content.
 * Values:
 *     HARM_PROBABILITY_UNSPECIFIED:
 *         Harm probability unspecified.
 *     NEGLIGIBLE:
 *         Negligible level of harm.
 *     LOW:
 *         Low level of harm.
 *     MEDIUM:
 *         Medium level of harm.
 *     HIGH:
 *         High level of harm.
 */
export enum HarmProbability {
  HARM_PROBABILITY_UNSPECIFIED = 'HARM_PROBABILITY_UNSPECIFIED',
  NEGLIGIBLE = 'NEGLIGIBLE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

/**
 * Safety rating corresponding to the generated content.
 * @property {HarmCategory} - category. {@link HarmCategory}
 * @property {HarmProbability} - probability. {@link HarmProbability}
 */
export declare interface SafetyRating {
  category: HarmCategory;
  probability: HarmProbability;
}

/**
 * The base structured datatype containing multi-part content of a message.
 * @property {Part[]} -  parts. Array of {@link Part}
 * @property {string} - [role]. The producer of the content. Must be either 'user' or 'model'.
                            Useful to set for multi-turn conversations, otherwise can be left blank or unset.
 */
export declare interface Content {
  parts: Part[];
  role?: string;
}

/**
 * A part of a turn in a conversation with the model with a fixed MIME type.
 * It has one of the following mutually exclusive fields:
 * 1. text
 * 2. inline_data
 * 3. file_data
 */
// TODO: Adjust so one must be true.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BasePart {}

/**
 * A text part of a conversation with the model.
 * @property {string} - text. Only this propery is expected for TextPart.
 * @property {never} - [inline_data]. inline_data is not expected for TextPart.
 * @property {never} - [file_data]. file_data is not expected for TextPart.
 *
 */
export interface TextPart extends BasePart {
  text: string;
  inline_data?: never;
  file_data?: never;
}

/**
 * An inline data part of a conversation with the model.
 * @property {never} - [text]. text is not expected for InlineDataPart.
 * @property {GenerativeContentBlob} - inline_data. Only this property is expected for InlineDataPart. {@link GenerativeContentBlob}
 * @property {never} - [file_data]. file_data is not expected for InlineDataPart.
 */
export interface InlineDataPart extends BasePart {
  text?: never;
  inline_data: GenerativeContentBlob;
  file_data?: never;
}

/**
 * URI based data.
 * @property {string} - mime_type. The IANA standard MIME type of the source data.
 * @property {string} - file_uri. URI of the file.
 */
export interface FileData {
  mime_type: string;
  file_uri: string;
}

/**
 * A file data part of a conversation with the model.
 * @property {never} - [text]. text is not expected for FileDataPart.
 * @property {never} - [inline_data]. inline_data is not expected for FileDataPart.
 * @property {FileData} - file_data. Only this property is expected for FileDataPart. {@link FileData}
 */
export interface FileDataPart extends BasePart {
  text?: never;
  inline_data?: never;
  file_data: FileData;
}

/**
 * A datatype containing media that is part of a multi-part {@link Content} message.
 * A `Part` is a union type of {@link TextPart}, {@link InlineDataPart} and {@link FileDataPart}
 * A `Part` has one of the following mutually exclusive fields:
 * 1. text
 * 2. inline_data
 * 3. file_data
 */
export declare type Part = TextPart | InlineDataPart | FileDataPart;

/**
 * Raw media bytes sent directly in the request. Text should not be sent as
 * raw bytes.
 * @property {string} - mime_type. The MIME type of the source data. The only accepted values: "image/png" or "image/jpeg".
 * @property {string} - data. data must be base64 string
 */
export declare interface GenerativeContentBlob {
  mime_type: string;
  data: string;
}

/**
 * Usage metadata about response(s).
 * @property {number} - [prompt_token_count]. Number of tokens in the request.
 * @property {number} - [candidates_token_count]. Number of tokens in the response(s).
 * @property {number} - [totalTokenCount]. Total number of tokens.
 */
export declare interface UsageMetadata {
  prompt_token_count?: number;
  candidates_token_count?: number;
  totalTokenCount?: number;
}

/**
 * Content filter results for a prompt sent in the request.
 * @property {BlockedReason} - block_reason. {@link BlockReason}
 * @property {SafetyRating[]} - safety_ratings. Array of {@link SafetyRating}
 * @property {string} - block_reason_message. A readable block reason message.
 */
export declare interface PromptFeedback {
  block_reason: BlockedReason;
  safety_ratings: SafetyRating[];
  block_reason_message: string;
}

/**
 * @enum {string}
 * The reason why the reponse is blocked.
 * Values:
 *   BLOCKED_REASON_UNSPECIFIED
 *       Unspecified blocked reason.
 *   SAFETY
 *       Candidates blocked due to safety.
 *   OTHER
 *       Candidates blocked due to other reason.
 */
export enum BlockedReason {
  BLOCKED_REASON_UNSPECIFIED = 'BLOCK_REASON_UNSPECIFIED',
  SAFETY = 'SAFETY',
  OTHER = 'OTHER',
}

/**
 * @enum {string}
 * The reason why the model stopped generating tokens.
 * If empty, the model has not stopped generating the tokens.
 * Values:
 *   FINISH_REASON_UNSPECIFIED
 *       The finish reason is unspecified.
 *   STOP:
 *       Natural stop point of the model or provided
 *       stop sequence.
 *   MAX_TOKENS:
 *       The maximum number of tokens as specified in
 *       the request was reached.
 *   SAFETY:
 *       The token generation was stopped as the
 *       response was flagged for safety reasons. NOTE:
 *       When streaming the Candidate.content will be
 *       empty if content filters blocked the output.
 *   RECITATION:
 *       The token generation was stopped as the
 *       response was flagged for unauthorized citations.
 *   OTHER:
 *       All other reasons that stopped the token
 *       generation
 */
export enum FinishReason {
  FINISH_REASON_UNSPECIFIED = 'FINISH_REASON_UNSPECIFIED',
  STOP = 'STOP',
  MAX_TOKENS = 'MAX_TOKENS',
  SAFETY = 'SAFETY',
  RECITATION = 'RECITATION',
  OTHER = 'OTHER',
}

/**
 * Wrapper for respones from a generateContent request
 * @property {GenerateContentResponse} - response. All GenerateContentResponses received so far {@link GenerateContentResponse}
 */
export declare interface GenerateContentResult {
  response: GenerateContentResponse;
}

/**
 * Wrapper for respones from a generateContent method when `steam` parameter is `true`
 * @property {Promise<GenerateContentResponse>} - response. Promise of {@link GenerateContentResponse}
 * @property {AsyncGenerator<GenerateContentResponse>} - stream. Async iterable that provides one {@link GenerateContentResponse} at a time
 */
export declare interface StreamGenerateContentResult {
  response: Promise<GenerateContentResponse>;
  stream: AsyncGenerator<GenerateContentResponse>;
}

/**
 * Response from the model supporting multiple candidates
 * @property {GenerateContentCandidate} - candidates. {@link GenerateContentCandidate}
 * @property {PromptFeedback} - [promptFeedback]. This is only populated if there are no candidates due to a safety block {@link PromptFeedback}
 * @property {UsageMetadata} - [usageMetadata]. {@link UsageMetadata}
 */
export declare interface GenerateContentResponse {
  candidates: GenerateContentCandidate[];
  promptFeedback?: PromptFeedback;
  usageMetadata?: UsageMetadata;
}

/**
 * A response candidate generated from the model.
 * @property {Content} - content. {@link Content}
 * @property {number} - [index]. The index of the candidate in the {@link GenerateContentResponse}
 * @property {FinishReason} - [finishReason]. {@link FinishReason}
 * @property {string} - [finishMessage].
 * @property {SafetyRating[]} - [safetyRatings]. Array of {@link SafetyRating}
 * @property {CitationMetadata} - [citationMetadata]. {@link CitationMetadata}
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
 * A collection of source attributions for a piece of content.
 * @property {CitationSource[]} - citationSources. Array of {@link CitationSource}
 */
export declare interface CitationMetadata {
  citationSources: CitationSource[];
}

/**
 * Source attributions for content.
 * @property {number} - [startIndex] Start index into the content.
 * @property {number} - [endIndex] End index into the content.
 * @property {string} - [url] Url reference of the attribution.
 * @property {string} - [license] License of the attribution.
 */
export declare interface CitationSource {
  startIndex?: number;
  endIndex?: number;
  uri?: string;
  license?: string;
}
