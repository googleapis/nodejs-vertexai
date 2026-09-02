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

import {GoogleAuth} from 'google-auth-library';
import {ApiClient} from '../api_client';

function makeClient(location: string): ApiClient {
  return new ApiClient(
    'test-project',
    location,
    'v1',
    {} as unknown as GoogleAuth
  );
}

describe('ApiClient.getBaseUrl', () => {
  it('global location should return endpoint without region prefix', () => {
    const client = makeClient('global');
    expect(client.getBaseUrl()).toBe('https://aiplatform.googleapis.com/v1');
    expect(client.getBaseUrl()).not.toContain('global-');
  });

  it('regional location should return endpoint with region prefix', () => {
    const client = makeClient('us-central1');
    expect(client.getBaseUrl()).toBe(
      'https://us-central1-aiplatform.googleapis.com/v1'
    );
  });

  it('eu-west4 location should return endpoint with correct region prefix', () => {
    const client = makeClient('eu-west4');
    expect(client.getBaseUrl()).toBe(
      'https://eu-west4-aiplatform.googleapis.com/v1'
    );
  });
});
