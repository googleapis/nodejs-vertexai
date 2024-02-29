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
  /** Optional. The request options to use for generation. */
  requestOptions?: RequestOptions;
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
 * Harm categories that will block the content.
 */
export enum HarmCategory {
  /** The harm category is unspecified. */
  HARM_CATEGORY_UNSPECIFIED = 'HARM_CATEGORY_UNSPECIFIED',
  /** The harm category is hate speech. */
  HARM_CATEGORY_HATE_SPEECH = 'HARM_CATEGORY_HATE_SPEECH',
  /** The harm category is dangerous content. */
  HARM_CATEGORY_DANGEROUS_CONTENT = 'HARM_CATEGORY_DANGEROUS_CONTENT',
  /** The harm category is harassment. */
  HARM_CATEGORY_HARASSMENT = 'HARM_CATEGORY_HARASSMENT',
  /** The harm category is sexually explicit content. */
  HARM_CATEGORY_SEXUALLY_EXPLICIT = 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
}

/**
 * Probability based thresholds levels for blocking.
 */
export enum HarmBlockThreshold {
  /** Unspecified harm block threshold. */
  HARM_BLOCK_THRESHOLD_UNSPECIFIED = 'HARM_BLOCK_THRESHOLD_UNSPECIFIED',
  /** Block low threshold and above (i.e. block more). */
  BLOCK_LOW_AND_ABOVE = 'BLOCK_LOW_AND_ABOVE',
  /** Block medium threshold and above. */
  BLOCK_MEDIUM_AND_ABOVE = 'BLOCK_MEDIUM_AND_ABOVE',
  /** Block only high threshold (i.e. block less). */
  BLOCK_ONLY_HIGH = 'BLOCK_ONLY_HIGH',
  /** Block none. */
  BLOCK_NONE = 'BLOCK_NONE',
}

/**
 * Harm probability levels in the content.
 */
export enum HarmProbability {
  /** Harm probability unspecified. */
  HARM_PROBABILITY_UNSPECIFIED = 'HARM_PROBABILITY_UNSPECIFIED',
  NEGLIGIBLE = 'NEGLIGIBLE',
  /** Low level of harm. */
  LOW = 'LOW',
  /** Medium level of harm. */
  MEDIUM = 'MEDIUM',
  /** High level of harm. */
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
 */
export declare interface UsageMetadata {
  /** Optional. Number of tokens in the request. */
  promptTokenCount?: number;
  /** Optional. Number of tokens in the response(s). */
  candidatesTokenCount?: number;
  /** Optional. Total number of tokens. */
  totalTokenCount?: number;
}

/**
 * Content filter results for a prompt sent in the request.
 */
export declare interface PromptFeedback {
  /** The reason why the response is blocked. {@link BlockReason}. */
  block_reason: BlockedReason;
  /** Array of {@link SafetyRating} */
  safety_ratings: SafetyRating[];
  /** A readable block reason message. */
  block_reason_message: string;
}

/**
 * The reason why the reponse is blocked.
 */
export enum BlockedReason {
  /** Unspecified blocked reason. */
  BLOCKED_REASON_UNSPECIFIED = 'BLOCK_REASON_UNSPECIFIED',
  /** Candidates blocked due to safety. */
  SAFETY = 'SAFETY',
  /** Candidates blocked due to other reason. */
  OTHER = 'OTHER',
}

/**
 * The reason why the model stopped generating tokens.
 * If empty, the model has not stopped generating the tokens.
 */
export enum FinishReason {
  /** The finish reason is unspecified. */
  FINISH_REASON_UNSPECIFIED = 'FINISH_REASON_UNSPECIFIED',
  /** Natural stop point of the model or provided stop sequence. */
  STOP = 'STOP',
  /** The maximum number of tokens as specified in the request was reached. */
  MAX_TOKENS = 'MAX_TOKENS',
  /**
   * The token generation was stopped as the response was flagged for safety
   * reasons.
   */
  SAFETY = 'SAFETY',
  /**
   * The token generation was stopped as the response was flagged for
   * unauthorized citations.
   */
  RECITATION = 'RECITATION',
  /** All other reasons that stopped the token generation. */
  OTHER = 'OTHER',
}

/**
 * Wrapper for respones from a generateContent request.
 */
export declare interface GenerateContentResult {
  /**
   * All GenerateContentResponses received so far. {@link
   * GenerateContentResponse}
   */
  response: GenerateContentResponse;
}

/**
 * Wrapper for respones from a generateContent method when `steam` parameter is
 * `true`.
 */
export declare interface StreamGenerateContentResult {
  /** Promise of {@link GenerateContentResponse}. */
  response: Promise<GenerateContentResponse>;
  /**
   * Async iterable that provides one {@link GenerateContentResponse} at a
   * time.
   */
  stream: AsyncGenerator<GenerateContentResponse>;
}

/**
 * Response from the model supporting multiple candidates.
 */
export declare interface GenerateContentResponse {
  /** Array of {@link GenerateContentCandidate}. */
  candidates: GenerateContentCandidate[];
  /**
   * Optional. This is only populated if there are no candidates due to a
   * safety block. {@link PromptFeedback}.
   */
  promptFeedback?: PromptFeedback;
  /** Optional. {@link UsageMetadata}. */
  usageMetadata?: UsageMetadata;
}

/**
 * A response candidate generated from the model.
 */
export declare interface GenerateContentCandidate {
  /** {@link Content}. */
  content: Content;
  /**
   * Optional. The index of the candidate in the {@link
   * GenerateContentResponse}.
   */
  index?: number;
  /**
   * Optional. The reason why the model stopped generating tokens. {@link
   * FinishReason}.
   */
  finishReason?: FinishReason;
  /**
   * Optional. A readable message describing why the model stopped generating
   * tokens.
   */
  finishMessage?: string;
  /** Optional. Array of {@link SafetyRating}. */
  safetyRatings?: SafetyRating[];
  /** Optional. {@link CitationMetadata}. */
  citationMetadata?: CitationMetadata;
  /** Optional. {@link GroundingMetadata}. */
  groundingMetadata?: GroundingMetadata;
  /** Optional. {@link FunctionResponse}. */
  functionCall?: FunctionCall;
}

/**
 * A collection of source attributions for a piece of content.
 */
export declare interface CitationMetadata {
  /** Array of {@link CitationSource}. */
  citationSources: CitationSource[];
}

/**
 * Source attributions for content.
 */
export declare interface CitationSource {
  /** Optional. Start index into the content. */
  startIndex?: number;
  /** Optional. End index into the content. */
  endIndex?: number;
  /** Optional. Url reference of the attribution. */
  uri?: string;
  /** Optional. License of the attribution. */
  license?: string;
}

/**
 * A collection of grounding attributions for a piece of content.
 */
export declare interface GroundingMetadata {
  /** Optional. Web search queries for the following-up web search. */
  webSearchQueries?: string[];
  /** Optional. Array of {@link GroundingAttribution}. */
  groundingAttributions?: GroundingAttribution[];
}

/**
 * Grounding attribution.
 */
export declare interface GroundingAttribution {
  /** Optional. Attribution from the web. */
  web?: GroundingAttributionWeb;
  /** Optional. Segment of the content this attribution belongs to. */
  segment?: GroundingAttributionSegment;
  /**
   * Optional. Confidence score of the attribution. Ranges from 0 to 1. 1 is
   * the most confident.
   */
  confidenceScore?: number;
}

/**
 * Segment of the content this attribution belongs to.
 */
export declare interface GroundingAttributionSegment {
  /** Optional. The index of a Part object within its parent Content object. */
  partIndex?: number;
  /**
   * Optional. Start index in the given Part, measured in bytes. Offset from the
   * start of the Part, inclusive, starting at zero.
   */
  startIndex?: number;
  /**
   * Optional. End index in the given Part, measured in bytes. Offset from the
   * start of the Part, exclusive, starting at zero.
   */
  endIndex?: number;
}

/**
 * Attribution from the web.
 */
export declare interface GroundingAttributionWeb {
  /** Optional. URI reference of the attribution. */
  uri?: string;
  /** Optional. Title of the attribution. */
  title?: string;
}

/**
 * A predicted FunctionCall returned from the model that contains a string
 * representating the FunctionDeclaration.name with the parameters and their
 * values.
 */
export declare interface FunctionCall {
  /** The name of the function specified in FunctionDeclaration.name. */
  name: string;
  /** The arguments to pass to the function. */
  args: object;
}

/**
 * The result output of a FunctionCall that contains a string representing
 * the FunctionDeclaration.name and a structured JSON object containing any
 * output from the function call. It is used as context to the model.
 */
export declare interface FunctionResponse {
  /** The name of the function specified in FunctionDeclaration.name. */
  name: string;
  /** The expected response from the model. */
  response: object;
}

/**
 * Structured representation of a function declaration as defined by the
 * [OpenAPI 3.0 specification](https://spec.openapis.org/oas/v3.0.3). Included
 * in this declaration are the function name and parameters. This
 * FunctionDeclaration is a representation of a block of code that can be used
 * as a Tool by the model and executed by the client.
 */
export declare interface FunctionDeclaration {
  /**
   * The name of the function to call. Must start with a letter or an
   * underscore. Must be a-z, A-Z, 0-9, or contain underscores and dashes, with
   * a max length of 64.
   */
  name: string;
  /**
   * Optional. Description and purpose of the function. Model uses it to decide
   * how and whether to call the function.
   */
  description?: string;
  /**
   * Optional. Describes the parameters to this function in JSON Schema Object
   * format. Reflects the Open API 3.03 Parameter Object. string Key: the name
   * of the parameter. Parameter names are case sensitive. Schema Value: the
   * Schema defining the type used for the parameter. For function with no
   * parameters, this can be left unset.
   *
   * @example with 1 required and 1 optional parameter: type: OBJECT properties:
   * ```
   * param1:
   *
   *   type: STRING
   * param2:
   *
   *  type: INTEGER
   * required:
   *
   *   - param1
   * ```
   */
  parameters?: FunctionDeclarationSchema;
}

/**
 * A FunctionDeclarationsTool is a piece of code that enables the system to
 * interact with external systems to perform an action, or set of actions,
 * outside of knowledge and scope of the model.
 */
export declare interface FunctionDeclarationsTool {
  /**
   * Optional. One or more function declarations
   * to be passed to the model along with the current user query. Model may
   * decide to call a subset of these functions by populating
   * [FunctionCall][content.part.function_call] in the response. User should
   * provide a [FunctionResponse][content.part.function_response] for each
   * function call in the next turn. Based on the function responses, Model will
   * generate the final response back to the user. Maximum 64 function
   * declarations can be provided.
   */
  function_declarations?: FunctionDeclaration[];
}

/**
 * Defines a retrieval tool that model can call to access external knowledge.
 */
export declare interface RetrievalTool {
  /** Optional. {@link Retrieval}. */
  retrieval?: Retrieval;
}

/**
 * Defines a retrieval tool that model can call to access external knowledge.
 */
export declare interface GoogleSearchRetrievalTool {
  /** Optional. {@link GoogleSearchRetrieval}. */
  googleSearchRetrieval?: GoogleSearchRetrieval;
}

/** Defines a tool that model can call to access external knowledge. */
export declare type Tool =
  | FunctionDeclarationsTool
  | RetrievalTool
  | GoogleSearchRetrievalTool;

/**
 * Defines a retrieval tool that model can call to access external knowledge.
 */
export declare interface Retrieval {
  /**
   * Optional. Set to use data source powered by Vertex AI Search. {@link
   * VertexAISearch}.
   */
  vertexAiSearch?: VertexAISearch;
  /**
   * Optional. Disable using the result from this tool in detecting grounding
   * attribution. This does not affect how the result is given to the model for
   * generation.
   */
  disableAttribution?: boolean;
}

/**
 * Tool to retrieve public web data for grounding, powered by Google.
 */
export declare interface GoogleSearchRetrieval {
  /**
   * Optional. Disable using the result from this tool in detecting grounding
   * attribution. This does not affect how the result is given to the model for
   * generation.
   */
  disableAttribution?: boolean;
}

/**
 * Retrieve from Vertex AI Search datastore for grounding.
 */
export declare interface VertexAISearch {
  /**
   * Fully-qualified Vertex AI Search's datastore resource ID. See
   * https://cloud.google.com/vertex-ai-search-and-conversation
   * @example: "projects/<>/locations/<>/collections/<>/dataStores/<>"
   */
  datastore: string;
}

/**
 * Contains the list of OpenAPI data types
 * as defined by https://swagger.io/docs/specification/data-models/data-types/
 */
export enum FunctionDeclarationSchemaType {
  /** String type. */
  STRING = 'STRING',
  /** Number type. */
  NUMBER = 'NUMBER',
  /** Integer type. */
  INTEGER = 'INTEGER',
  /** Boolean type. */
  BOOLEAN = 'BOOLEAN',
  /** Array type. */
  ARRAY = 'ARRAY',
  /** Object type. */
  OBJECT = 'OBJECT',
}

/**
 * Schema for parameters passed to {@link FunctionDeclaration.parameters}.
 */
export interface FunctionDeclarationSchema {
  /** The type of the parameter. */
  type: FunctionDeclarationSchemaType;
  /** The format of the parameter. */
  properties: {[k: string]: FunctionDeclarationSchemaProperty};
  /** Optional. Description of the parameter. */
  description?: string;
  /** Optional. Array of required parameters. */
  required?: string[];
}

/**
 * Schema is used to define the format of input/output data.
 * Represents a select subset of an OpenAPI 3.0 schema object.
 * More fields may be added in the future as needed.
 */
export interface FunctionDeclarationSchemaProperty {
  /**
   * Optional. The type of the property. {@link
   * FunctionDeclarationSchemaType}.
   */
  type?: FunctionDeclarationSchemaType;
  /** Optional. The format of the property. */
  format?: string;
  /** Optional. The description of the property. */
  description?: string;
  /** Optional. Whether the property is nullable. */
  nullable?: boolean;
  /** Optional. The items of the property. {@link FunctionDeclarationSchema} */
  items?: FunctionDeclarationSchema;
  /** Optional. The enum of the property. */
  enum?: string[];
  /** Optional. Map of {@link FunctionDeclarationSchema}. */
  properties?: {[k: string]: FunctionDeclarationSchema};
  /** Optional. Array of required property. */
  required?: string[];
  /** Optional. The example of the property. */
  example?: unknown;
}

/**
 * Params to initiate a multiturn chat with the model via startChat.
 */
export declare interface StartChatParams {
  /** Optional. History of the chat session. {@link Content} */
  history?: Content[];
  /** Optional. Array of {@link SafetySetting}. */
  safety_settings?: SafetySetting[];
  /** Optional. {@link GenerationConfig}. */
  generation_config?: GenerationConfig;
  /** Optional. Array of {@link Tool}. */
  tools?: Tool[];
  /** Optional. The base Vertex AI endpoint to use for the request. */
  api_endpoint?: string;
}

/**
 * All params passed to initiate multiturn chat via startChat.
 */
export declare interface StartChatSessionRequest extends StartChatParams {
  /** The Google Cloud project to use for the request. */
  project: string;
  /** The Google Cloud project location to use for the request. */
  location: string;
  /** The Google Auth to use for the request. */
  googleAuth: GoogleAuth;
  /** The publisher model endpoint to use for the request. */
  publisher_model_endpoint: string;
}

/**
 * Request options params passed to getGenerativeModel method in VertexAI class.
 */
export interface RequestOptions {
  /** time out in milli seconds. time out value needs to be non negative. */
  timeoutMillis?: number;
}
