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
import {
  CountTokensResponse,
  GenerateContentResponse,
} from '../../types/content';

export const STREAM_RESPONSE_CHUNKS_1: GenerateContentResponse[] = [
  {
    candidates: [
      {
        content: {
          role: 'model',
          parts: [
            {
              text: 'chunk1Candidate1',
            },
          ],
        },
        safetyRatings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.448547,
            severity: 'HARM_SEVERITY_MEDIUM',
            severityScore: 0.40221596,
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.41935068,
            severity: 'HARM_SEVERITY_LOW',
            severityScore: 0.27067295,
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.40703878,
            severity: 'HARM_SEVERITY_LOW',
            severityScore: 0.26095408,
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.24220563,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.15140383,
          },
        ],
      },
      {
        content: {
          role: 'model',
          parts: [
            {
              text: 'chunk1Candidate2',
            },
          ],
        },
        safetyRatings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.448547,
            severity: 'HARM_SEVERITY_MEDIUM',
            severityScore: 0.40221596,
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.41935068,
            severity: 'HARM_SEVERITY_LOW',
            severityScore: 0.27067295,
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.40703878,
            severity: 'HARM_SEVERITY_LOW',
            severityScore: 0.26095408,
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.24220563,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.15140383,
          },
        ],
      },
    ],
  },
  {
    candidates: [
      {
        content: {
          role: 'model',
          parts: [
            {
              text: 'chunk2Candidate1',
            },
          ],
        },
        safetyRatings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.32594952,
            severity: 'HARM_SEVERITY_LOW',
            severityScore: 0.20481865,
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.32498476,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.18728127,
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.31742626,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.12940271,
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.14175598,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.12252322,
          },
        ],
      },
      {
        content: {
          role: 'model',
          parts: [
            {
              text: 'chunk2Candidate2',
            },
          ],
        },
        safetyRatings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.32594952,
            severity: 'HARM_SEVERITY_LOW',
            severityScore: 0.20481865,
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.32498476,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.18728127,
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.31742626,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.12940271,
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.14175598,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.12252322,
          },
        ],
      },
    ],
  },
  {
    candidates: [
      {
        content: {
          role: 'model',
          parts: [
            {
              text: 'chunk3Candidate1',
            },
          ],
        },
        groundingMetadata: {
          webSearchQueries: ['query for former chunk for first candidate'],
          groundingAttributions: [
            {
              segment: {
                endIndex: 421,
              },
              confidenceScore: 0.8585608,
              web: {
                uri: 'url for former chunk for first candidate',
                title: 'title for former chunk for first candidate',
              },
            },
          ],
          groundingChunks: [
            {
              web: {
                uri: 'url for former chunk for first candidate',
                title: 'title for former chunk for first candidate',
              },
            },
          ],
          groundingSupports: [
            {
              segment: {
                startIndex: 0,
                endIndex: 421,
                text: 'grounding support for former chunk for first candidate',
              },
            },
          ],
        },
        safetyRatings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.32402143,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.18892181,
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.32028955,
            severity: 'HARM_SEVERITY_LOW',
            severityScore: 0.21783626,
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.32124704,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.13568956,
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.16344544,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.11516222,
          },
        ],
      },
      {
        content: {
          role: 'model',
          parts: [
            {
              text: 'chunk3Candidate2',
            },
          ],
        },
        groundingMetadata: {
          webSearchQueries: ['query for former chunk for second candidate'],
          groundingAttributions: [
            {
              segment: {
                endIndex: 421,
              },
              confidenceScore: 0.8585608,
              web: {
                uri: 'url for former chunk for second candidate',
                title: 'title for former chunk for second candidate',
              },
            },
          ],
          groundingChunks: [
            {
              web: {
                uri: 'url for former chunk for second candidate',
                title: 'title for former chunk for second candidate',
              },
            },
          ],
          groundingSupports: [
            {
              segment: {
                startIndex: 0,
                endIndex: 421,
                text: 'grounding support for former chunk for second candidate',
              },
            },
          ],
        },
        safetyRatings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.32402143,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.18892181,
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.32028955,
            severity: 'HARM_SEVERITY_LOW',
            severityScore: 0.21783626,
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.32124704,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.13568956,
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.16344544,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.11516222,
          },
        ],
      },
    ],
  },
  {
    candidates: [
      {
        content: {
          role: 'model',
        },
        finishReason: 'STOP',
        groundingMetadata: {
          webSearchQueries: ['query for later chunk for first candidate'],
          groundingAttributions: [
            {
              segment: {
                endIndex: 421,
              },
              confidenceScore: 0.8585608,
              web: {
                uri: 'url for later chunk for first candidate',
                title: 'title for later chunk for first candidate',
              },
            },
          ],
          groundingChunks: [
            {
              web: {
                uri: 'url for later chunk for first candidate',
                title: 'title for later chunk for first candidate',
              },
            },
          ],
          groundingSupports: [
            {
              segment: {
                startIndex: 0,
                endIndex: 421,
                text: 'grounding support for later chunk for first candidate',
              },
            },
          ],
          searchEntryPoint: {
            renderedContent:
              'rendered content for later chunk for first candidate',
          },
        },
      },
      {
        content: {
          role: 'model',
        },
        finishReason: 'STOP',
        groundingMetadata: {
          webSearchQueries: ['query for later chunk for second candidate'],
          groundingAttributions: [
            {
              segment: {
                endIndex: 421,
              },
              confidenceScore: 0.8585608,
              web: {
                uri: 'url for later chunk for second candidate',
                title: 'title for later chunk for second candidate',
              },
            },
          ],
          groundingChunks: [
            {
              web: {
                uri: 'url for later chunk for second candidate',
                title: 'title for later chunk for second candidate',
              },
            },
          ],
          groundingSupports: [
            {
              segment: {
                startIndex: 0,
                endIndex: 421,
                text: 'grounding support for later chunk for second candidate',
              },
            },
          ],
          searchEntryPoint: {
            renderedContent:
              'rendered content for later chunk for second candidate',
          },
        },
      },
    ],
    usageMetadata: {
      promptTokenCount: 6,
      candidatesTokenCount: 91,
      totalTokenCount: 97,
    },
  },
] as GenerateContentResponse[];

export const AGGREGATED_RESPONSE_STREAM_RESPONSE_CHUNKS_1: GenerateContentResponse =
  {
    usageMetadata: {
      promptTokenCount: 6,
      candidatesTokenCount: 91,
      totalTokenCount: 97,
    },
    candidates: [
      {
        index: 0,
        content: {
          role: 'model',
          parts: [{text: 'chunk1Candidate1chunk2Candidate1chunk3Candidate1'}],
        },
        safetyRatings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.32402143,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.18892181,
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.32028955,
            severity: 'HARM_SEVERITY_LOW',
            severityScore: 0.21783626,
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.32124704,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.13568956,
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.16344544,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.11516222,
          },
        ],
        groundingMetadata: {
          webSearchQueries: [
            'query for former chunk for first candidate',
            'query for later chunk for first candidate',
          ],
          groundingAttributions: [
            {
              segment: {endIndex: 421},
              confidenceScore: 0.8585608,
              web: {
                uri: 'url for former chunk for first candidate',
                title: 'title for former chunk for first candidate',
              },
            },
            {
              segment: {endIndex: 421},
              confidenceScore: 0.8585608,
              web: {
                uri: 'url for later chunk for first candidate',
                title: 'title for later chunk for first candidate',
              },
            },
          ],
          retrievalQueries: [],
          groundingChunks: [
            {
              web: {
                uri: 'url for former chunk for first candidate',
                title: 'title for former chunk for first candidate',
              },
            },
            {
              web: {
                uri: 'url for later chunk for first candidate',
                title: 'title for later chunk for first candidate',
              },
            },
          ],
          groundingSupports: [
            {
              segment: {
                startIndex: 0,
                endIndex: 421,
                text: 'grounding support for former chunk for first candidate',
              },
            },
            {
              segment: {
                startIndex: 0,
                endIndex: 421,
                text: 'grounding support for later chunk for first candidate',
              },
            },
          ],
          searchEntryPoint: {
            renderedContent:
              'rendered content for later chunk for first candidate',
          },
        },
        finishReason: 'STOP',
      },
      {
        index: 1,
        content: {
          role: 'model',
          parts: [{text: 'chunk1Candidate2chunk2Candidate2chunk3Candidate2'}],
        },
        safetyRatings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.32402143,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.18892181,
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.32028955,
            severity: 'HARM_SEVERITY_LOW',
            severityScore: 0.21783626,
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.32124704,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.13568956,
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.16344544,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.11516222,
          },
        ],
        groundingMetadata: {
          webSearchQueries: [
            'query for former chunk for second candidate',
            'query for later chunk for second candidate',
          ],
          groundingAttributions: [
            {
              segment: {endIndex: 421},
              confidenceScore: 0.8585608,
              web: {
                uri: 'url for former chunk for second candidate',
                title: 'title for former chunk for second candidate',
              },
            },
            {
              segment: {endIndex: 421},
              confidenceScore: 0.8585608,
              web: {
                uri: 'url for later chunk for second candidate',
                title: 'title for later chunk for second candidate',
              },
            },
          ],
          retrievalQueries: [],
          groundingChunks: [
            {
              web: {
                uri: 'url for former chunk for second candidate',
                title: 'title for former chunk for second candidate',
              },
            },
            {
              web: {
                uri: 'url for later chunk for second candidate',
                title: 'title for later chunk for second candidate',
              },
            },
          ],
          groundingSupports: [
            {
              segment: {
                startIndex: 0,
                endIndex: 421,
                text: 'grounding support for former chunk for second candidate',
              },
            },
            {
              segment: {
                startIndex: 0,
                endIndex: 421,
                text: 'grounding support for later chunk for second candidate',
              },
            },
          ],
          searchEntryPoint: {
            renderedContent:
              'rendered content for later chunk for second candidate',
          },
        },
        finishReason: 'STOP',
      },
    ],
  } as GenerateContentResponse;

export const STREAM_RESPONSE_CHUNKS_2: GenerateContentResponse[] = [
  {
    candidates: [
      {
        content: {
          role: 'model',
          parts: [
            {
              text: 'chunk1Candidate1',
            },
          ],
        },
        citationMetadata: {
          citations: [
            {
              startIndex: 1,
              endIndex: 42,
              uri: '1st url for former chunk for first candidate',
              title: '1st title for former chunk for first candidate',
              license: '1st license for former chunk for first candidate',
            },
            {
              startIndex: 2,
              endIndex: 67,
              uri: '2nd url for former chunk for first candidate',
              title: '2nd title for former chunk for first candidate',
              license: '2nd license for former chunk for first candidate',
            },
          ],
        },
      },
      {
        content: {
          role: 'model',
          parts: [
            {
              text: 'chunk1Candidate2',
            },
          ],
        },
        citationMetadata: {
          citations: [
            {
              startIndex: 5,
              endIndex: 921,
              uri: '1st url for former chunk for second candidate',
              title: '1st title for former chunk for second candidate',
              license: '1st license for former chunk for second candidate',
            },
          ],
        },
      },
    ],
  },
  {
    candidates: [
      {
        content: {
          role: 'model',
          parts: [
            {
              text: 'chunk2Candidate1',
            },
          ],
        },
      },
      {
        content: {
          role: 'model',
          parts: [
            {
              text: 'chunk2Candidate2',
            },
          ],
        },
        safetyRatings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.32594952,
            severity: 'HARM_SEVERITY_LOW',
            severityScore: 0.20481865,
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.32498476,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.18728127,
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.31742626,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.12940271,
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.14175598,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.12252322,
          },
        ],
      },
    ],
  },
  {
    candidates: [
      {
        content: {
          role: 'model',
          parts: [
            {
              text: 'chunk3Candidate1',
            },
          ],
        },
        citationMetadata: {
          citations: [
            {
              startIndex: 1,
              endIndex: 42,
              uri: '1st url for later chunk for first candidate',
              title: '1st title for later chunk for first candidate',
              license: '1st license for later chunk for first candidate',
            },
            {
              startIndex: 2,
              endIndex: 67,
              uri: '2nd url for later chunk for first candidate',
              title: '2nd title for later chunk for first candidate',
              license: '2nd license for later chunk for first candidate',
            },
          ],
        },
      },
      {
        content: {
          role: 'model',
          parts: [
            {
              text: 'chunk3Candidate2',
            },
          ],
        },
        citationMetadata: {
          citations: [
            {
              startIndex: 6,
              endIndex: 432,
              uri: '1st url for later chunk for second candidate',
              title: '1st title for later chunk for second candidate',
              license: '1st license for later chunk for second candidate',
            },
          ],
        },
      },
    ],
  },
  {
    candidates: [
      {
        content: {
          role: 'model',
        },
        finishReason: 'STOP',
      },
      {
        content: {
          role: 'model',
        },
        finishReason: 'STOP',
      },
    ],
    usageMetadata: {
      promptTokenCount: 6,
      candidatesTokenCount: 91,
      totalTokenCount: 97,
    },
  },
] as GenerateContentResponse[];

export const AGGREGATED_RESPONSE_STREAM_RESPONSE_CHUNKS_2: GenerateContentResponse =
  {
    usageMetadata: {
      promptTokenCount: 6,
      candidatesTokenCount: 91,
      totalTokenCount: 97,
    },
    candidates: [
      {
        index: 0,
        content: {
          role: 'model',
          parts: [
            {
              text: 'chunk1Candidate1chunk2Candidate1chunk3Candidate1',
            },
          ],
        },
        citationMetadata: {
          citations: [
            {
              startIndex: 1,
              endIndex: 42,
              uri: '1st url for former chunk for first candidate',
              title: '1st title for former chunk for first candidate',
              license: '1st license for former chunk for first candidate',
            },
            {
              startIndex: 2,
              endIndex: 67,
              uri: '2nd url for former chunk for first candidate',
              title: '2nd title for former chunk for first candidate',
              license: '2nd license for former chunk for first candidate',
            },
            {
              startIndex: 1,
              endIndex: 42,
              uri: '1st url for later chunk for first candidate',
              title: '1st title for later chunk for first candidate',
              license: '1st license for later chunk for first candidate',
            },
            {
              startIndex: 2,
              endIndex: 67,
              uri: '2nd url for later chunk for first candidate',
              title: '2nd title for later chunk for first candidate',
              license: '2nd license for later chunk for first candidate',
            },
          ],
        },
        finishReason: 'STOP',
      },
      {
        index: 1,
        content: {
          role: 'model',
          parts: [
            {
              text: 'chunk1Candidate2chunk2Candidate2chunk3Candidate2',
            },
          ],
        },
        citationMetadata: {
          citations: [
            {
              startIndex: 5,
              endIndex: 921,
              uri: '1st url for former chunk for second candidate',
              title: '1st title for former chunk for second candidate',
              license: '1st license for former chunk for second candidate',
            },
            {
              startIndex: 6,
              endIndex: 432,
              uri: '1st url for later chunk for second candidate',
              title: '1st title for later chunk for second candidate',
              license: '1st license for later chunk for second candidate',
            },
          ],
        },
        safetyRatings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.32594952,
            severity: 'HARM_SEVERITY_LOW',
            severityScore: 0.20481865,
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.32498476,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.18728127,
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.31742626,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.12940271,
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            probability: 'NEGLIGIBLE',
            probabilityScore: 0.14175598,
            severity: 'HARM_SEVERITY_NEGLIGIBLE',
            severityScore: 0.12252322,
          },
        ],
        finishReason: 'STOP',
      },
    ],
  } as GenerateContentResponse;

export const STREAM_RESPONSE_CHUNKS_3: GenerateContentResponse[] = [
  {
    candidates: [
      {content: {parts: [{text: 'chunk1Candidate1'}]}},
      {content: {parts: [{text: 'chunk1Candidate2'}]}},
    ],
  },
  {
    candidates: [
      {content: {parts: [{text: 'chunk2Candidate1'}]}},
      {content: {parts: [{text: 'chunk2Candidate2'}]}},
    ],
  },
] as GenerateContentResponse[];

export const AGGREGATED_RESPONSE_STREAM_RESPONSE_CHUNKS_3: GenerateContentResponse =
  {
    candidates: [
      {
        index: 0,
        content: {
          role: 'model',
          parts: [{text: 'chunk1Candidate1chunk2Candidate1'}],
        },
      },
      {
        index: 1,
        content: {
          role: 'model',
          parts: [{text: 'chunk1Candidate2chunk2Candidate2'}],
        },
      },
    ],
  } as GenerateContentResponse;

export const STREAM_RESPONSE_CHUNKS_4: GenerateContentResponse[] = [
  {
    candidates: [{}],
  },
] as GenerateContentResponse[];

export const AGGREGATED_RESPONSE_STREAM_RESPONSE_CHUNKS_4: GenerateContentResponse =
  {
    candidates: [
      {
        index: 0,
        content: {
          role: 'model',
          parts: [{text: ''}],
        },
      },
    ],
  } as GenerateContentResponse;

export const UNARY_RESPONSE_1: GenerateContentResponse = {
  candidates: [
    {
      content: {
        role: 'model',
        parts: [
          {
            text: 'candidate1',
          },
        ],
      },
      index: 0,
      safetyRatings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          probability: 'NEGLIGIBLE',
          probabilityScore: 0.448547,
          severity: 'HARM_SEVERITY_MEDIUM',
          severityScore: 0.40221596,
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          probability: 'NEGLIGIBLE',
          probabilityScore: 0.41935068,
          severity: 'HARM_SEVERITY_LOW',
          severityScore: 0.27067295,
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          probability: 'NEGLIGIBLE',
          probabilityScore: 0.40703878,
          severity: 'HARM_SEVERITY_LOW',
          severityScore: 0.26095408,
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          probability: 'NEGLIGIBLE',
          probabilityScore: 0.24220563,
          severity: 'HARM_SEVERITY_NEGLIGIBLE',
          severityScore: 0.15140383,
        },
      ],
    },
    {
      content: {
        role: 'model',
        parts: [
          {
            text: 'candidate2',
          },
        ],
      },
      index: 1,
      safetyRatings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          probability: 'NEGLIGIBLE',
          probabilityScore: 0.448547,
          severity: 'HARM_SEVERITY_MEDIUM',
          severityScore: 0.40221596,
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          probability: 'NEGLIGIBLE',
          probabilityScore: 0.41935068,
          severity: 'HARM_SEVERITY_LOW',
          severityScore: 0.27067295,
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          probability: 'NEGLIGIBLE',
          probabilityScore: 0.40703878,
          severity: 'HARM_SEVERITY_LOW',
          severityScore: 0.26095408,
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          probability: 'NEGLIGIBLE',
          probabilityScore: 0.24220563,
          severity: 'HARM_SEVERITY_NEGLIGIBLE',
          severityScore: 0.15140383,
        },
      ],
    },
  ],
  promptFeedback: {
    blockReason: 'BLOCK_REASON_UNSPECIFIED',
    safetyRatings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        probability: 'NEGLIGIBLE',
        probabilityScore: 0.448547,
        severity: 'HARM_SEVERITY_MEDIUM',
        severityScore: 0.40221596,
      },
    ],
    blockReasonMessage: 'block reason message',
  },
  usageMetadata: {
    promptTokenCount: 6,
    candidatesTokenCount: 91,
    totalTokenCount: 97,
  },
} as GenerateContentResponse;

export const UNARY_RESPONSE_MISSING_ROLE_INDEX: GenerateContentResponse = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: 'candidate1',
          },
        ],
      },
      index: 0,
      safetyRatings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          probability: 'NEGLIGIBLE',
          probabilityScore: 0.448547,
          severity: 'HARM_SEVERITY_MEDIUM',
          severityScore: 0.40221596,
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          probability: 'NEGLIGIBLE',
          probabilityScore: 0.41935068,
          severity: 'HARM_SEVERITY_LOW',
          severityScore: 0.27067295,
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          probability: 'NEGLIGIBLE',
          probabilityScore: 0.40703878,
          severity: 'HARM_SEVERITY_LOW',
          severityScore: 0.26095408,
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          probability: 'NEGLIGIBLE',
          probabilityScore: 0.24220563,
          severity: 'HARM_SEVERITY_NEGLIGIBLE',
          severityScore: 0.15140383,
        },
      ],
    },
    {
      content: {
        parts: [
          {
            text: 'candidate2',
          },
        ],
      },
      safetyRatings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          probability: 'NEGLIGIBLE',
          probabilityScore: 0.448547,
          severity: 'HARM_SEVERITY_MEDIUM',
          severityScore: 0.40221596,
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          probability: 'NEGLIGIBLE',
          probabilityScore: 0.41935068,
          severity: 'HARM_SEVERITY_LOW',
          severityScore: 0.27067295,
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          probability: 'NEGLIGIBLE',
          probabilityScore: 0.40703878,
          severity: 'HARM_SEVERITY_LOW',
          severityScore: 0.26095408,
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          probability: 'NEGLIGIBLE',
          probabilityScore: 0.24220563,
          severity: 'HARM_SEVERITY_NEGLIGIBLE',
          severityScore: 0.15140383,
        },
      ],
    },
  ],
  promptFeedback: {
    blockReason: 'BLOCK_REASON_UNSPECIFIED',
    safetyRatings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        probability: 'NEGLIGIBLE',
        probabilityScore: 0.448547,
        severity: 'HARM_SEVERITY_MEDIUM',
        severityScore: 0.40221596,
      },
    ],
    blockReasonMessage: 'block reason message',
  },
  usageMetadata: {
    promptTokenCount: 6,
    candidatesTokenCount: 91,
    totalTokenCount: 97,
  },
} as GenerateContentResponse;

export const COUNT_TOKENS_RESPONSE_1: CountTokensResponse = {
  totalTokens: 6,
  totalBillableCharacters: 20,
};
