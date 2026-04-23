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

import {GenerateContentCandidate, FunctionCall, Part} from './content';

/** Helper class to render any extra properties out of
 * {@link GenerateContentResponse} or properties of {@link GenerateContentResponse}
 */
export class GenerateContentResponseHandler {
  /**
   * Extracts function calls from a {@link GenerateContentCandidate}.
   *
   * @param candidate - The candidate to extract function calls from.
   * @returns the array of function calls in a {@link GenerateContentCandidate}.
   */
  static getFunctionCallsFromCandidate(
    candidate?: GenerateContentCandidate
  ): FunctionCall[] {
    if (!candidate) return [] as FunctionCall[];
    return candidate.content.parts
      .filter((part: Part | undefined) => !!part && !!part.functionCall)
      .map((part: Part) => part.functionCall!);
  }
}
