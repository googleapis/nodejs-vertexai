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

import {createFakeGoogleAuth} from './fake_google_auth';

describe('Fake GoogleAuth', () => {
  it('can create fake GoogleAuth with GoogleAuth instance.', () => {
    const auth = createFakeGoogleAuth();

    expect(auth).toBeInstanceOf(GoogleAuth);
  });

  it('can setup and get fake token.', async () => {
    const accessToken = 'abc123';

    const auth = createFakeGoogleAuth({accessToken});
    const token = await auth.getAccessToken();

    expect(token).toEqual('abc123');
  });

  it('can setup and get undefined token.', async () => {
    const accessToken = undefined;

    const auth = createFakeGoogleAuth({accessToken});
    const token = await auth.getAccessToken();

    expect(token).toBeUndefined();
  });

  it('can setup and get null token.', async () => {
    const accessToken = null;

    const auth = createFakeGoogleAuth({accessToken});
    const token = await auth.getAccessToken();

    expect(token).toBeNull();
  });
});
