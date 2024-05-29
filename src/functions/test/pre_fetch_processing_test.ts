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

import {Tool} from '../../types/content';
import {
  getApiVersion,
  validateGenerateContentRequest,
} from '../pre_fetch_processing';

const TOOL1 = {retrieval: {vertexAiSearch: {datastore: 'datastore'}}} as Tool;
const TOOL2 = {
  retrieval: {vertexRagStore: {ragResources: [{ragCorpus: 'ragCorpus'}]}},
} as Tool;
const TOOL3 = {
  retrieval: {
    vertexAiSearch: {datastore: 'datastore'},
    vertexRagStore: {ragResources: [{ragCorpus: 'ragCorpus'}]},
  },
} as Tool;

const VALID_TOOL_ERROR_MESSAGE =
  '[VertexAI.ClientError]: Found both vertexAiSearch and vertexRagStore field are set in tool. Either set vertexAiSearch or vertexRagStore.';

describe('validateTools', () => {
  it('should pass validation when set tool correctly', () => {
    expect(() =>
      validateGenerateContentRequest({tools: [TOOL1], contents: []})
    ).not.toThrow();
    expect(() =>
      validateGenerateContentRequest({tools: [TOOL2], contents: []})
    ).not.toThrow();
  });

  it('should throw error when set VertexAiSearch and VertexRagStore in two tools in request', () => {
    expect(() =>
      validateGenerateContentRequest({tools: [TOOL1, TOOL2], contents: []})
    ).toThrowError(VALID_TOOL_ERROR_MESSAGE);
  });

  it('should throw error when set VertexAiSearch and VertexRagStore in a single tool in request', () => {
    expect(() =>
      validateGenerateContentRequest({tools: [TOOL3], contents: []})
    ).toThrowError(VALID_TOOL_ERROR_MESSAGE);
  });
});

describe('getApiVersion', () => {
  it('should return v1', () => {
    expect(getApiVersion({contents: [], tools: [TOOL1]})).toEqual('v1');
  });

  it('should return v1beta1', () => {
    expect(getApiVersion({contents: [], tools: [TOOL2]})).toEqual('v1beta1');
    expect(getApiVersion({contents: [], tools: [TOOL1, TOOL2]})).toEqual(
      'v1beta1'
    );
  });
});
