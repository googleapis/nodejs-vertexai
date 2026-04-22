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
    STRING = "STRING",
    /** Number type. */
    NUMBER = "NUMBER",
    /** Integer type. */
    INTEGER = "INTEGER",
    /** Boolean type. */
    BOOLEAN = "BOOLEAN",
    /** Array type. */
    ARRAY = "ARRAY",
    /** Object type. */
    OBJECT = "OBJECT"
}

// Helper type to map SchemaType to its corresponding value type
type SchemaValueByType<T extends SchemaType | undefined> =
  T extends SchemaType.STRING ? string :
  T extends SchemaType.NUMBER ? number :
  T extends SchemaType.INTEGER ? number :
  T extends SchemaType.BOOLEAN ? boolean :
  T extends SchemaType.ARRAY ? unknown[] :
  T extends SchemaType.OBJECT ? Record<string, unknown> :
  unknown;

/**
 * Schema is used to define the format of input/output data.
 * Represents a select subset of an OpenAPI 3.0 schema object.
 * More fields may be added in the future as needed.
 */
export type Schema<T extends SchemaType> = {
  type?: T;
  format?: string;
  title?: string;
  description?: string;
  nullable?: boolean;
  default?: SchemaValueByType<T>; // ahora depende del tipo
  example?: SchemaValueByType<T>; // también depende del tipo
  items?: Schema;
  minItems?: string;
  maxItems?: string;
  enum?: string[];
  properties?: {
      [key: string]: Schema;
  };
  propertyOrdering?: string[];
  required?: string[];
  minProperties?: string;
  maxProperties?: string;
  minimum?: number;
  maximum?: number;
  minLength?: string;
  maxLength?: string;
  pattern?: string;
  anyOf?: Schema[];
  additionalProperties?: boolean | Schema;
  ref?: string;
  defs?: {
      [key: string]: Schema;
  };
};
