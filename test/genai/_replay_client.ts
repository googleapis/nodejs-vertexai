/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Pager} from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

import {Client} from '../../src/genai/client.js';

/**
 * Bypass real credential fetching during replay.
 */
class FakeAuth {
  async addAuthHeaders(headers: Headers): Promise<void> {
    if (headers.get('Authorization')) return;
    headers.append('Authorization', 'Bearer fake-replay-token');
  }
}

/**
 * ReplayClient extends the Vertex AI SDK Client to support replay
 * testing with request and response verification against recorded JSON files.
 */
export class ReplayClient extends Client {
  private replayData: any;
  private interactionIndex = 0;

  constructor(options: {project: string; location: string}) {
    super(options);
  }

  /**
   * Loads a replay JSON file and sets up the fetch spy.
   */
  setupReplay(replayFileName: string): jasmine.Spy {
    const fakeAuth = new FakeAuth();
    const auth = this.apiClient.clientOptions.auth;
    spyOn(auth, 'addAuthHeaders').and.callFake(async (headers: Headers) => {
      await fakeAuth.addAuthHeaders(headers);
    });
    const replaysDir = process.env['GOOGLE_GENAI_REPLAYS_DIRECTORY'];
    if (!replaysDir) {
      throw new Error('Set GOOGLE_GENAI_REPLAYS_DIRECTORY env var.');
    }

    const replayFilePath = path.join(replaysDir, replayFileName);
    const rawData = fs.readFileSync(replayFilePath, 'utf8');
    this.replayData = JSON.parse(rawData);

    return spyOn(global, 'fetch')
        .and.callFake(async (url: any, init?: RequestInit) => {
          if (this.interactionIndex >= this.replayData.interactions.length) {
            throw new Error(`Unexpected fetch call to ${url.toString()}`);
          }

          const interaction =
              this.replayData.interactions[this.interactionIndex++];
          const responseStatus = interaction.response.status_code || 200;
          const bodySegments = interaction.response.body_segments || [];
          const responseBody =
              bodySegments.length === 1 ? JSON.stringify(bodySegments[0]) : '';

          return new Response(responseBody, {
            status: responseStatus,
            headers: new Headers(
                interaction.response.headers as Record<string, string>),
          });
        });
  }

  /**
   * Verifies the actual request sent matches the expected request in the
   * replay.
   */
  verifyInteraction(index: number, actualArgs: any[]) {
    const expectedRequest = this.replayData.interactions[index].request;
    const expectedRequestCamel: any =
        JSON.parse(snakeToCamel(JSON.stringify(expectedRequest)));

    if (expectedRequestCamel.headers) {
      expectedRequestCamel.headers =
          normalizeHeaders(expectedRequestCamel.headers);
    }

    const [url, init] = actualArgs;
    const normalizedActual = normalizeRequest(init || {}, url.toString());
    assertMessagesEqual(normalizedActual, expectedRequestCamel);
  }

  /**
   * Verifies the SDK response matches the expected response in the replay.
   */
  verifyResponse(index: number, actualResponse: any) {
    const expectedInteraction = this.replayData.interactions[index];
    const expectedResponse =
        expectedInteraction.response.sdk_response_segments?.[0] ||
        expectedInteraction.response.body_segments?.[0];

    const actualNormalized = JSON.parse(
        snakeToCamel(JSON.stringify(extractResponseFromPager(actualResponse))));
    const expectedNormalized =
        JSON.parse(snakeToCamel(JSON.stringify(expectedResponse)));

    assertMessagesEqual(actualNormalized, expectedNormalized);
  }

  verifyAllInteractions() {
    if (this.interactionIndex < this.replayData.interactions.length) {
      throw new Error(`Expected ${
          this.replayData.interactions.length} interactions but only ${
          this.interactionIndex} were executed.`);
    }
  }
}

function extractResponseFromPager(sdkResponse: any): any {
  if (!(sdkResponse instanceof Pager)) return sdkResponse;
  const response: Record<string, any> = {};
  response[sdkResponse.name] = sdkResponse.page;
  return response;
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

function normalizeRequest(request: RequestInit, url: string) {
  return {
    method: request.method?.toLowerCase(),
    url: redactUrl(url),
    headers: normalizeHeaders(request.headers as Headers),
    bodySegments: normalizeBody(request.body as string),
  };
}

function redactUrl(url: string) {
  return url
      .replace(
          /.*\/projects\/[^/]+\/locations\/[^/]+\//, '{VERTEX_URL_PREFIX}/')
      .replace(/\*/g, '%2A');
}


function normalizeHeaderName(headerName: string): string {
  if (!headerName) return '';
  return headerName.split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('-');
}

function normalizeHeaders(headers: any) {
  const obj: Record<string, string> = {};
  const entries = headers instanceof Headers ? Array.from(headers.entries()) :
                                               Object.entries(headers || {});

  for (const [k, v] of entries) {
    const key = k.toLowerCase();
    // Temporarily skip these checks until replay file headers match across
    // languages
    if (key === 'authorization' || key === 'user-agent' ||
        key === 'x-goog-api-client') {
      continue;
    }
    const normalizedKey = normalizeHeaderName(key);
    obj[normalizedKey] = v as string;
  }
  return obj;
}

function normalizeBody(body: string) {
  try {
    if (!body) return body;
    const parsed = JSON.parse(snakeToCamel(body));
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return body;
  }
}

function isObjectEmpty(obj: unknown): boolean {
  if (obj == null) return true;
  if (typeof obj !== 'object') return false;
  for (const key of Object.keys(obj as object)) {
    const val = (obj as any)[key];
    if (typeof val === 'object') {
      if (!isObjectEmpty(val)) return false;
    } else if (val !== undefined && val !== null) {
      return false;
    }
  }
  return true;
}

/**
 * Message comparison. This treats undefined and empty objects/arrays as equal.
 */
function assertMessagesEqual(actual: unknown, expected: unknown) {
  function isObjectEmpty(obj: unknown): boolean {
    if (obj == null) return true;
    if (typeof obj !== 'object') return false;
    for (const key of Object.keys(obj as object)) {
      const val = (obj as any)[key];
      if (typeof val === 'object') {
        if (!isObjectEmpty(val)) return false;
      } else if (val !== undefined && val !== null) {
        return false;
      }
    }
    return true;
  }

  function assertDeepEqual(a: any, b: any, path: string = '$') {
    if (a === b) return;

    if (a === undefined && typeof b === 'object') {
      if (!isObjectEmpty(b)) {
        throw new Error(`Mismatch at ${
            path}: Expected undefined to match empty object, but got ${
            JSON.stringify(b)}`);
      }
      return;
    }

    if (typeof a === 'object' && typeof b === 'object' && a && b) {
      const aKeys = Object.keys(a);
      const bKeys = Object.keys(b);

      for (const key of bKeys) {
        assertDeepEqual(a[key], b[key], `${path}.${key}`);
      }

      for (const key of aKeys) {
        if (!bKeys.includes(key) && !isObjectEmpty(a[key])) {
          throw new Error(
              `Mismatch at ${path}: Actual has extra non-empty key "${key}"`);
        }
      }
      return;
    }

    if (a !== b) {
      expect(a).withContext(`Path: ${path}`).toEqual(b);
    }
  }

  assertDeepEqual(actual, expected);
}
