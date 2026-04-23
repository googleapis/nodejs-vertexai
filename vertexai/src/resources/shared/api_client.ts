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
import {constants} from '../../util';
import {
  ClientError,
  GoogleApiError,
  GoogleAuthError,
  GoogleGenerativeAIError,
} from '../../types';

const AUTHORIZATION_HEADER = 'Authorization';
const CONTENT_TYPE_HEADER = 'Content-Type';
const USER_AGENT_HEADER = 'User-Agent';

export class ApiClient {
  constructor(
    readonly project: string,
    readonly location: string,
    readonly apiVersion: 'v1' | 'v1beta1',
    private readonly googleAuth: GoogleAuth
  ) {}

  /**
   * Gets access token from GoogleAuth. Throws {@link GoogleAuthError} when
   * fails.
   * @returns Promise of token string.
   */
  private fetchToken(): Promise<string | null | undefined> {
    const tokenPromise = this.googleAuth.getAccessToken().catch(e => {
      throw new GoogleAuthError(constants.CREDENTIAL_ERROR_MESSAGE, e);
    });
    return tokenPromise;
  }

  getBaseUrl() {
    return `https://${this.location}-aiplatform.googleapis.com/${this.apiVersion}`;
  }

  getBaseResourePath() {
    return `projects/${this.project}/locations/${this.location}`;
  }

  async unaryApiCall(
    url: URL,
    requestInit: RequestInit,
    httpMethod: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  ): Promise<any> {
    const token = await this.getHeaders();
    return this.apiCall(url.toString(), {
      ...requestInit,
      method: httpMethod,
      headers: token,
    });
  }

  private async apiCall(
    url: string,
    requestInit: RequestInit
  ): Promise<Response> {
    const response = await fetch(url, requestInit).catch(e => {
      throw new GoogleGenerativeAIError(
        `exception sending request to url: ${url} with requestInit: ${JSON.stringify(requestInit)}}`,
        e
      );
    });
    await throwErrorIfNotOK(response, url, requestInit).catch(e => {
      throw e;
    });
    try {
      return await response.json();
    } catch (e) {
      throw new GoogleGenerativeAIError(JSON.stringify(response), e as Error);
    }
  }

  private async getHeaders(): Promise<Headers> {
    const token = await this.fetchToken();
    return new Headers({
      [AUTHORIZATION_HEADER]: `Bearer ${token}`,
      [CONTENT_TYPE_HEADER]: 'application/json',
      [USER_AGENT_HEADER]: constants.USER_AGENT,
    });
  }
}

async function throwErrorIfNotOK(
  response: Response | undefined,
  url: string,
  requestInit: RequestInit
) {
  if (response === undefined) {
    throw new GoogleGenerativeAIError('response is undefined');
  }
  if (!response.ok) {
    const status: number = response.status;
    const statusText: string = response.statusText;
    let errorBody;
    if (response.headers.get('content-type')?.includes('application/json')) {
      errorBody = await response.json();
    } else {
      errorBody = {
        error: {
          message: `exception sending request to url: ${url} with requestInit: ${JSON.stringify(requestInit)}}`,
          code: response.status,
          status: response.statusText,
        },
      };
    }
    const errorMessage = `got status: ${status} ${statusText}. ${JSON.stringify(
      errorBody
    )}`;
    if (status >= 400 && status < 500) {
      const error = new ClientError(
        errorMessage,
        new GoogleApiError(
          errorBody.error.message,
          errorBody.error.code,
          errorBody.error.status,
          errorBody.error.details
        )
      );
      throw error;
    }
    throw new GoogleGenerativeAIError(errorMessage);
  }
}
