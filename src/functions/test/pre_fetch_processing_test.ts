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
