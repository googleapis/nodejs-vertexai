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
import {GoogleAuth, GoogleAuthOptions} from 'google-auth-library';

/**
 * Params used to initialize the Vertex SDK.
 */
export declare interface VertexInit {
  /** The Google Cloud project name. It is not the numeric project ID. */
  project: string;
  /** The Google Cloud project location. */
  location: string;
  /**
   * Optional. The base Vertex AI endpoint to use for the request. If not
   * provided, the default regionalized endpoint (i.e.
   * us-central1-aiplatform.googleapis.com) will be used.
   */
  apiEndpoint?: string;
  /**
   * Optional. The Authentication options provided by google-auth-library.
   * Complete list of authentication options is documented in the
   * GoogleAuthOptions interface:
   * https://github.com/googleapis/google-auth-library-nodejs/blob/main/src/auth/googleauth.ts.
   */
  googleAuthOptions?: GoogleAuthOptions;
}

/**
 * Params used to call the generateContent method.
 */
export declare interface GenerateContentRequest extends BaseModelParams {
  /** Array of {@link Content}.*/
  contents: Content[];
}

/**
 * Params used to call the countTokens method.
 */
export declare interface CountTokensRequest {
  /** Array of {@link Content}. */
  contents: Content[];
}

/**
 * Response returned from countTokens method.
 */
export declare interface CountTokensResponse {
  /**
   * The total number of tokens counted across all instances from the request.
   */
  totalTokens: number;
  /**
   * Optional. The total number of billable characters counted across all
   * instances from the request.
   */
  totalBillableCharacters?: number;
}

/**
 * Params used to call the getGenerativeModel method.
 */
export declare interface GetGenerativeModelParams extends ModelParams {
  /** The name of the model to get. */
  model: string;
  /** The Google Cloud project to use for the request. */
  project: string;
  /** The Google Cloud project location to use for the request. */
  location: string;
  /**
   * GoogleAuth class instance that handles authentication.
   * Details about GoogleAuth is referred to
   * https://github.com/googleapis/google-auth-library-nodejs/blob/main/src/auth/googleauth.ts
   */
  googleAuth: GoogleAuth;
  /**
   * Optional. The base Vertex AI endpoint to use for the request. If not
   * provided, the default regionalized endpoint (i.e.
   * us-central1-aiplatform.googleapis.com) will be used.
   */
  apiEndpoint?: string;
  /** Optional. The configuration to use for generation. */
  generation_config?: GenerationConfig;
  /** Optional. The safety settings to use for generation. */
  safety_settings?: SafetySetting[];
  /** Optional. The tools to use for generation. */
  tools?: Tool[];
}

/**
 * Configuration for initializing a model, for example via getGenerativeModel in
 * VertexAI class.
 */
export declare interface ModelParams extends BaseModelParams {
  /**
   * The name of the model.
   * @example "gemini-1.0-pro".
   */
  model: string;
}

/**
 * Base params for initializing a model or calling GenerateContent.
 */
export declare interface BaseModelParams {
  /** Optional. Array of {@link SafetySetting}. */
  safety_settings?: SafetySetting[];
  /** Optional.  {@link GenerationConfig}. */
  generation_config?: GenerationConfig;
  /** Optional. Array of {@link Tool}. */
  tools?: Tool[];
}

/**
 * Safety feedback for an entire request.
 */
export declare interface SafetySetting {
  /** The harm category. {@link HarmCategory} */
  category: HarmCategory;
  /** The harm threshold. {@link HarmBlockThreshold} */
  threshold: HarmBlockThreshold;
}

/**
 * Configuration options for model generation and outputs.
 */
export declare interface GenerationConfig {
  /** Optional. Number of candidates to generate. */
  candidate_count?: number;
  /** Optional. Stop sequences. */
  stop_sequences?: string[];
  /** Optional. The maximum number of output tokens to generate per message. */
  max_output_tokens?: number;
  /** Optional. Controls the randomness of predictions. */
  temperature?: number;
  /** Optional. If specified, nucleus sampling will be used. */
  top_p?: number;
  /** Optional. If specified, top-k sampling will be used. */
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
 */
export declare interface SafetyRating {
  /** The harm category. {@link HarmCategory} */
  category: HarmCategory;
  /** The harm probability. {@link HarmProbability} */
  probability: HarmProbability;
}

/**
 * The base structured datatype containing multi-part content of a message.
 */
export declare interface Content {
  /** Array of {@link Part}. */
  parts: Part[];
  /** The producer of the content. */
  role?: string;
}

/**
 * A part of a turn in a conversation with the model with a fixed MIME type.
 * It has one of the following mutually exclusive fields:
 * 1. text
 * 2. inline_data
 * 3. file_data
 * 4. functionResponse
 * 5. functionCall
 */
// TODO: Adjust so one must be true.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BasePart {}

/**
 * A text part of a conversation with the model.
 */
export interface TextPart extends BasePart {
  /** Only this property is expected for TextPart. */
  text: string;
  /** inline_data is not expected for TextPart. */
  inline_data?: never;
  /** file_data is not expected for TextPart. */
  file_data?: never;
  /** functionResponse is not expected for TextPart. */
  functionResponse?: never;
  /** functionCall is not expected for TextPart. */
  functionCall?: never;
}

/**
 * An inline data part of a conversation with the model.
 */
export interface InlineDataPart extends BasePart {
  /** text is not expected for InlineDataPart. */
  text?: never;
  /** Only this property is expected for InlineDataPart. */
  inline_data: GenerativeContentBlob;
  /** file_data is not expected for InlineDataPart. */
  file_data?: never;
  /** functionResponse is not expected for InlineDataPart. */
  functionResponse?: never;
  /** functionCall is not expected for InlineDataPart. */
  functionCall?: never;
}

/**
 * URI based data.
 */
export interface FileData {
  /** The IANA standard MIME type of the source data. */
  mime_type: string;
  /** URI of the file. */
  file_uri: string;
}

/**
 * A file data part of a conversation with the model.
 */
export interface FileDataPart extends BasePart {
  /** text is not expected for FileDataPart. */
  text?: never;
  /** inline_data is not expected for FileDataPart. */
  inline_data?: never;
  /** Only this property is expected for FileDataPart. */
  file_data: FileData;
  /** functionResponse is not expected for FileDataPart. */
  functionResponse?: never;
  /** functionCall is not expected for FileDataPart. */
  functionCall?: never;
}

/**
 * A function response part of a conversation with the model.
 */
export interface FunctionResponsePart extends BasePart {
  /** text is not expected for FunctionResponsePart. */
  text?: never;
  /** inline_data is not expected for FunctionResponsePart. */
  inline_data?: never;
  /** file_data is not expected for FunctionResponsePart. */
  file_data?: never;
  /** Only this property is expected for FunctionResponsePart. */
  functionResponse: FunctionResponse;
  /** functionCall is not expected for FunctionResponsePart. */
  functionCall?: never;
}

/**
 * A function call part of a conversation with the model.
 */
export interface FunctionCallPart extends BasePart {
  /** text is not expected for FunctionCallPart. */
  text?: never;
  /** inline_data is not expected for FunctionCallPart. */
  inline_data?: never;
  /** file_data is not expected for FunctionCallPart. */
  file_data?: never;
  /** functionResponse is not expected for FunctionCallPart. */
  functionResponse?: never;
  /** Only this property is expected for FunctionCallPart. */
  functionCall: FunctionCall;
}

/**
 * A datatype containing media that is part of a multi-part {@link Content}
 * message. A `Part` is a union type of {@link TextPart}, {@link
 * InlineDataPart}, {@link FileDataPart}, and {@link FunctionResponsePart}. A
 * `Part` has one of the following mutually exclusive fields:
 * 1. text
 * 2. inline_data
 * 3. file_data
 * 4. functionResponse
 */
export declare type Part =
  | TextPart
  | InlineDataPart
  | FileDataPart
  | FunctionResponsePart
  | FunctionCallPart;

/**
 * Raw media bytes sent directly in the request. Text should not be sent as
 * raw bytes.
 */
export declare interface GenerativeContentBlob {
  /**
   * The MIME type of the source data. The only accepted values: "image/png" or
   * "image/jpeg".
   */
  mime_type: string;
  /** Base64 encoded data. */
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
 * @property {number} - [index]. The index of the candidate in the {@link
 * GenerateContentResponse}
 * @property {FinishReason} - [finishReason]. {@link FinishReason}
 * @property {string} - [finishMessage].
 * @property {SafetyRating[]} - [safetyRatings]. Array of {@link SafetyRating}
 * @property {CitationMetadata} - [citationMetadata]. {@link CitationMetadata}
 * @property {GroundingMetadata} - [groundingMetadata]. {@link
 * GroundingMetadata}
 */
export declare interface GenerateContentCandidate {
  content: Content;
  index?: number;
  finishReason?: FinishReason;
  finishMessage?: string;
  safetyRatings?: SafetyRating[];
  citationMetadata?: CitationMetadata;
  groundingMetadata?: GroundingMetadata;
  functionCall?: FunctionCall;
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

/**
 * A collection of grounding attributions for a piece of content.
 * @property {string[]} - [webSearchQueries]. Web search queries for the
 * following-up web search.
 * @property {GroundingAttribution[]} - [groundingAttributions]. Array of {@link
 * GroundingAttribution}
 */
export declare interface GroundingMetadata {
  webSearchQueries?: string[];
  groundingAttributions?: GroundingAttribution[];
}

/**
 * Grounding attribution.
 * @property {GroundingAttributionWeb} - [web] Attribution from the web.
 * @property {GroundingAttributionSegment} - [segment] Segment of the content
 * this attribution belongs to.
 * @property {number} - [confidenceScore]  Confidence score of the attribution.
 * Ranges from 0 to 1. 1 is the most confident.
 */
export declare interface GroundingAttribution {
  web?: GroundingAttributionWeb;
  segment?: GroundingAttributionSegment;
  confidenceScore?: number;
}

/**
 * Segment of the content this attribution belongs to.
 * @property {number} - [part_index] The index of a Part object within its
 * parent Content object.
 * @property {number} - [startIndex] Start index in the given Part, measured in
 * bytes. Offset from the start of the Part, inclusive, starting at zero.
 * @property {number} - [endIndex] End index in the given Part, measured in
 * bytes. Offset from the start of the Part, exclusive, starting at zero.
 */
export declare interface GroundingAttributionSegment {
  partIndex?: number;
  startIndex?: number;
  endIndex?: number;
}

/**
 * Attribution from the web.
 * @property {string} - [uri] URI reference of the attribution.
 * @property {string} - [title] Title of the attribution.
 */
export declare interface GroundingAttributionWeb {
  uri?: string;
  title?: string;
}

/**
 * A predicted FunctionCall returned from the model that contains a string
 * representating the FunctionDeclaration.name with the parameters and their
 * values.
 * @property {string} - name The name of the function specified in
 * FunctionDeclaration.name.
 * @property {object} - args The arguments to pass to the function.
 */
export declare interface FunctionCall {
  name: string;
  args: object;
}

/**
 * The result output of a FunctionCall that contains a string representing
 * the FunctionDeclaration.name and a structured JSON object containing any
 * output from the function call. It is used as context to the model.
 * @property {string} - name The name of the function specified in
 * FunctionDeclaration.name.
 * @property {object} - response The expected response from the model.
 */
export declare interface FunctionResponse {
  name: string;
  response: object;
}

/**
 * Structured representation of a function declaration as defined by the
 * [OpenAPI 3.0 specification](https://spec.openapis.org/oas/v3.0.3). Included
 * in this declaration are the function name and parameters. This
 * FunctionDeclaration is a representation of a block of code that can be used
 * as a Tool by the model and executed by the client.
 * @property {string} - name The name of the function to call. Must start with a
 * letter or an underscore. Must be a-z, A-Z, 0-9, or contain underscores and
 * dashes, with a max length of 64.
 * @property {string} - description Description and purpose of the function.
 * Model uses it to decide how and whether to call the function.
 * @property {FunctionDeclarationSchema} - parameters Describes the parameters
 * to this function in JSON Schema Object format. Reflects the Open API 3.03
 * Parameter Object. string Key: the name of the parameter. Parameter names are
 * case sensitive. Schema Value: the Schema defining the type used for the
 * parameter. For function with no parameters, this can be left unset. Example
 * with 1 required and 1 optional parameter: type: OBJECT properties:

      param1:

        type: STRING
      param2:

        type: INTEGER
    required:

      - param1
 */
export declare interface FunctionDeclaration {
  name: string;
  description?: string;
  parameters?: FunctionDeclarationSchema;
}

/**
 * A FunctionDeclarationsTool is a piece of code that enables the system to
 * interact with external systems to perform an action, or set of actions,
 * outside of knowledge and scope of the model.
 * @property {object} - function_declarations One or more function declarations
 * to be passed to the model along with the current user query. Model may decide
 * to call a subset of these functions by populating
 * [FunctionCall][content.part.function_call] in the response. User should
 * provide a [FunctionResponse][content.part.function_response] for each
 * function call in the next turn. Based on the function responses, Model will
 * generate the final response back to the user. Maximum 64 function
 * declarations can be provided.
 */
export declare interface FunctionDeclarationsTool {
  function_declarations?: FunctionDeclaration[];
}

export declare interface RetrievalTool {
  retrieval?: Retrieval;
}

export declare interface GoogleSearchRetrievalTool {
  googleSearchRetrieval?: GoogleSearchRetrieval;
}

export declare type Tool =
  | FunctionDeclarationsTool
  | RetrievalTool
  | GoogleSearchRetrievalTool;

/**
 * Defines a retrieval tool that model can call to access external knowledge.
 * @property {VertexAISearch} - [vertexAiSearch] Set to use data source powered
 by Vertex AI Search.
  * @property {boolean} - [disableAttribution] Disable using the result from
 this tool in detecting grounding attribution. This does not affect how the
 result is given to the model for generation.
 */
export declare interface Retrieval {
  vertexAiSearch?: VertexAISearch;
  disableAttribution?: boolean;
}

/**
 * Tool to retrieve public web data for grounding, powered by Google.
 * @property {boolean} - [disableAttribution] Disable using the result from this
 * tool in detecting grounding attribution. This does not affect how the result
 * is given to the model for generation.
 */
export declare interface GoogleSearchRetrieval {
  disableAttribution?: boolean;
}

/**
 * Retrieve from Vertex AI Search datastore for grounding. See
 https://cloud.google.com/vertex-ai-search-and-conversation
 * @property {string} - [datastore] Fully-qualified Vertex AI Search's datastore
 resource ID. projects/<>/locations/<>/collections/<>/dataStores/<>
 */
export declare interface VertexAISearch {
  datastore: string;
}

/**
 * Contains the list of OpenAPI data types
 * as defined by https://swagger.io/docs/specification/data-models/data-types/
 * @public
 */
export enum FunctionDeclarationSchemaType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  INTEGER = 'INTEGER',
  BOOLEAN = 'BOOLEAN',
  ARRAY = 'ARRAY',
  OBJECT = 'OBJECT',
}

/**
 * Schema for parameters passed to [FunctionDeclaration.parameters]
 * @public
 */
export interface FunctionDeclarationSchema {
  type: FunctionDeclarationSchemaType;
  properties: {[k: string]: FunctionDeclarationSchemaProperty};
  description?: string;
  required?: string[];
}

/**
 * Schema is used to define the format of input/output data.
 * Represents a select subset of an OpenAPI 3.0 schema object.
 * More fields may be added in the future as needed.
 * @public
 */
export interface FunctionDeclarationSchemaProperty {
  type?: FunctionDeclarationSchemaType;
  format?: string;
  description?: string;
  nullable?: boolean;
  items?: FunctionDeclarationSchema;
  enum?: string[];
  properties?: {[k: string]: FunctionDeclarationSchema};
  required?: string[];
  example?: unknown;
}

/**
 * Params to initiate a multiturn chat with the model via startChat
 * @property {Content[]} - [history] history of the chat session. {@link Content}
 * @property {SafetySetting[]} - [safety_settings] Array of {@link SafetySetting}
 * @property {GenerationConfig} - [generation_config] {@link GenerationConfig}
 */
export declare interface StartChatParams {
  history?: Content[];
  safety_settings?: SafetySetting[];
  generation_config?: GenerationConfig;
  tools?: Tool[];
  api_endpoint?: string;
}

/**
 * All params passed to initiate multiturn chat via startChat
 * @property {string} project - project The Google Cloud project to use for the request
 * @property {string} location - The Google Cloud project location to use for the request
 */
export declare interface StartChatSessionRequest extends StartChatParams {
  project: string;
  location: string;
  googleAuth: GoogleAuth;
  publisher_model_endpoint: string;
}
