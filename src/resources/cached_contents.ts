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

import {formulateSystemInstructionIntoContent} from '../functions/util';
import {ClientError} from '../types';
import {CachedContent, ListCachedContentsResponse} from '../types';
import {ApiClient} from './shared/api_client';

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

class CachedContentsClient {
  constructor(readonly apiClient: ApiClient) {}

  create(cachedContent: CachedContent): Promise<CachedContent> {
    return this.apiClient.unaryApiCall(
      new URL(
        this.apiClient.getBaseUrl() +
          '/' +
          this.apiClient.getBaseResourePath() +
          '/cachedContents'
      ),
      {
        body: JSON.stringify(cachedContent),
      },
      'POST'
    );
  }

  update(
    cachedContent: CachedContent,
    updateMask: string[]
  ): Promise<CachedContent> {
    const url = new URL(this.apiClient.getBaseUrl() + '/' + cachedContent.name);
    url.searchParams.append(
      'updateMask',
      updateMask.map(e => camelToSnake(e)).join(',')
    );
    return this.apiClient.unaryApiCall(
      url,
      {
        body: JSON.stringify(cachedContent),
      },
      'PATCH'
    );
  }

  delete(name: string): Promise<void> {
    return this.apiClient.unaryApiCall(
      new URL(this.apiClient.getBaseUrl() + '/' + name),
      {},
      'DELETE'
    );
  }

  list(
    pageSize?: number,
    pageToken?: string
  ): Promise<ListCachedContentsResponse> {
    const url = new URL(
      this.apiClient.getBaseUrl() +
        '/' +
        this.apiClient.getBaseResourePath() +
        '/cachedContents'
    );
    if (pageSize) url.searchParams.append('pageSize', String(pageSize));
    if (pageToken) url.searchParams.append('pageToken', pageToken);
    return this.apiClient.unaryApiCall(url, {}, 'GET');
  }

  get(name: string): Promise<CachedContent> {
    return this.apiClient.unaryApiCall(
      new URL(this.apiClient.getBaseUrl() + '/' + name),
      {},
      'GET'
    );
  }
}

export function inferFullResourceName(
  project: string,
  location: string,
  cachedContentId: string
): string {
  if (cachedContentId.startsWith('projects/')) {
    return cachedContentId;
  }
  if (cachedContentId.startsWith('locations/')) {
    return `projects/${project}/${cachedContentId}`;
  }
  if (cachedContentId.startsWith('cachedContents/')) {
    return `projects/${project}/locations/${location}/${cachedContentId}`;
  }
  if (!cachedContentId.includes('/')) {
    return `projects/${project}/locations/${location}/cachedContents/${cachedContentId}`;
  }
  throw new ClientError(
    `Invalid CachedContent.name: ${cachedContentId}. CachedContent.name should start with 'projects/', 'locations/', 'cachedContents/' or is a number type.`
  );
}

/**
 * Infers the full model name based on the provided project, location, and model.
 *
 * @internal
 */
export function inferModelName(
  project: string,
  location: string,
  model?: string
) {
  if (!model) {
    throw new ClientError('Model name is required.');
  }
  if (model.startsWith('publishers/')) {
    return `projects/${project}/locations/${location}/${model}`;
  }
  if (!model.startsWith('projects/')) {
    return `projects/${project}/locations/${location}/publishers/google/models/${model}`;
  }
  return model;
}

/**
 * This class is for managing Vertex AI's CachedContent resource.
 * @public
 */
export class CachedContents {
  private readonly client: CachedContentsClient;
  constructor(client: ApiClient) {
    this.client = new CachedContentsClient(client);
  }

  /**
   * Creates cached content, this call will initialize the cached content in the data storage, and users need to pay for the cache data storage.
   * @param cachedContent
   * @param parent - Required. The parent resource where the cached content will be created.
   */
  create(cachedContent: CachedContent): Promise<CachedContent> {
    const curatedCachedContent = {
      ...cachedContent,
      systemInstruction: cachedContent.systemInstruction
        ? formulateSystemInstructionIntoContent(cachedContent.systemInstruction)
        : undefined,
      model: inferModelName(
        this.client.apiClient.project,
        this.client.apiClient.location,
        cachedContent.model
      ),
    } as CachedContent;
    return this.client.create(curatedCachedContent);
  }

  /**
   * Updates cached content configurations
   *
   * @param updateMask - Required. The list of fields to update. Format: google-fieldmask. See {@link https://cloud.google.com/docs/discovery/type-format}
   * @param name - Immutable. Identifier. The server-generated resource name of the cached content Format: projects/{project}/locations/{location}/cachedContents/{cached_content}.
   */
  update(
    cachedContent: CachedContent,
    updateMask: string[]
  ): Promise<CachedContent> {
    if (!cachedContent.name) {
      throw new ClientError('Cached content name is required for update.');
    }
    if (!updateMask || updateMask.length === 0) {
      throw new ClientError(
        'Update mask is required for update. Fields set in cachedContent but not in updateMask will be ignored. Examples: ["ttl"] or ["expireTime"].'
      );
    }
    const curatedCachedContent = {
      ...cachedContent,
      systemInstruction: cachedContent.systemInstruction
        ? formulateSystemInstructionIntoContent(cachedContent.systemInstruction)
        : undefined,
      name: inferFullResourceName(
        this.client.apiClient.project,
        this.client.apiClient.location,
        cachedContent.name
      ),
    };
    return this.client.update(curatedCachedContent, updateMask);
  }

  /**
   * Deletes cached content.
   *
   * @param name - Required. The resource name referring to the cached content.
   */
  delete(name: string): Promise<void> {
    return this.client.delete(
      inferFullResourceName(
        this.client.apiClient.project,
        this.client.apiClient.location,
        name
      )
    );
  }

  /**
   * Lists cached contents in a project.
   *
   * @param pageSize - Optional. The maximum number of cached contents to return. The service may return fewer than this value. If unspecified, some default (under maximum) number of items will be returned. The maximum value is 1000; values above 1000 will be coerced to 1000.
   * @param pageToken - Optional. A page token, received from a previous `ListCachedContents` call. Provide this to retrieve the subsequent page. When paginating, all other parameters provided to `ListCachedContents` must match the call that provided the page token.
   */
  list(
    pageSize?: number,
    pageToken?: string
  ): Promise<ListCachedContentsResponse> {
    return this.client.list(pageSize, pageToken);
  }

  /**
   * Gets cached content configurations.
   *
   * @param name - Required. The resource name referring to the cached content.
   */
  get(name: string): Promise<CachedContent> {
    return this.client.get(
      inferFullResourceName(
        this.client.apiClient.project,
        this.client.apiClient.location,
        name
      )
    );
  }
}
