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

interface FakeGoogleAuthParams {
  scopes?: string;
  /** Returned from getAccessToken(). */
  accessToken?: string | null;
  /** If provided, will be thrown when getAccessToken() is called. */
  accessTokenError?: Error;
}

/** Fake version of GoogleAuth. */
export class FakeGoogleAuth extends GoogleAuth {
  constructor(private readonly params: FakeGoogleAuthParams) {
    super();
  }

  override getAccessToken(): Promise<string | null | undefined> {
    if (this.params.accessTokenError) throw this.params.accessTokenError;

    return Promise.resolve(this.params.accessToken);
  }
}

/** Creates a fake GoogleAuth for testing. */
export function createFakeGoogleAuth(
  params: FakeGoogleAuthParams = {
    accessToken: 'DEFAULT_TOKEN',
  }
): GoogleAuth {
  return new FakeGoogleAuth(params);
}
