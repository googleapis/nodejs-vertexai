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

/** This config is shared for all tools provided in the request. */
export interface ToolConfig {
  /** Function calling config. */
  functionCallingConfig?: FunctionCallingConfig;
}

/** Function calling mode. */
export enum FunctionCallingMode {
  /** Unspecified function calling mode. This value should not be used. */
  MODE_UNSPECIFIED = 'MODE_UNSPECIFIED',
  /**
   * Default model behavior, model decides to predict either function calls
   * or natural language response.
   */
  AUTO = 'AUTO',
  /**
   * Model is constrained to always predicting function calls only.
   * If "allowedFunctionNames" are set, the predicted function calls will be
   * limited to any one of "allowedFunctionNames", else the predicted
   * function calls will be any one of the provided "function_declarations".
   */
  ANY = 'ANY',
  /**
   * Model will not predict any function calls. Model behavior is same as when
   * not passing any function declarations.
   */
  NONE = 'NONE',
}

export interface FunctionCallingConfig {
  /** Optional. Function calling mode. */
  mode?: FunctionCallingMode;

  /**
   * Optional. Function names to call. Only set when the Mode is ANY. Function
   * names should match [FunctionDeclaration.name]. With mode set to ANY, model
   * will predict a function call from the set of function names provided.
   */
  allowedFunctionNames?: string[];
}
