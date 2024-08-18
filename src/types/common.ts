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

/** This file contains interfaces that are usable in the types folder. */

/**
 * The list of OpenAPI data types
 * as defined by https://swagger.io/docs/specification/data-models/data-types/
 */
export enum SchemaType {
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
 * Schema is used to define the format of input/output data.
 * Represents a select subset of an OpenAPI 3.0 schema object.
 * More fields may be added in the future as needed.
 */
export interface Schema {
  /**
   * Optional. The type of the property. {@link
   * SchemaType}.
   */
  type?: SchemaType;
  /** Optional. The format of the property. */
  format?: string;
  /** Optional. The description of the property. */
  description?: string;
  /** Optional. Whether the property is nullable. */
  nullable?: boolean;
  /** Optional. The items of the property. {@link Schema} */
  items?: Schema;
  /** Optional. The enum of the property. */
  enum?: string[];
  /** Optional. Map of {@link Schema}. */
  properties?: {[k: string]: Schema};
  /** Optional. Array of required property. */
  required?: string[];
  /** Optional. The example of the property. */
  example?: unknown;
}
