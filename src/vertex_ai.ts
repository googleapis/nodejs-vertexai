/**
 * @license
 * Copyright 2023 Google LLC
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

/* tslint:disable */
import {GoogleAuth, GoogleAuthOptions} from 'google-auth-library';

import {GenerativeModelPreview, GenerativeModel} from './models';
import {
  GetGenerativeModelParams,
  ModelParams,
  RequestOptions,
  VertexInit,
} from './types/content';
import {GoogleAuthError} from './types/errors';

/**
 * Base class for authenticating to Vertex, creates the preview namespace.
 * Users use getGenerativeModel method to start using Google's generative models in GA.
 */
export class VertexAI {
  public preview: VertexAIPreview;
  private readonly project: string;
  private readonly location: string;
  protected googleAuth: GoogleAuth;
  private readonly apiEndpoint?: string;

  /**
   * @constructor
   * @param init - assign authentication related information,
   *     including project and location string, to instantiate a Vertex AI
   * client.
   */
  constructor(init: VertexInit) {
    const opts = validateGoogleAuthOptions(
      init.project,
      init.googleAuthOptions
    );
    this.project = init.project;
    this.location = init.location;
    this.googleAuth = new GoogleAuth(opts);
    this.apiEndpoint = init.apiEndpoint;
    this.preview = new VertexAIPreview(
      this.project,
      this.location,
      this.googleAuth,
      this.apiEndpoint
    );
  }

  /**
   * @param modelParams - {@link ModelParams} Parameters to
   *     specify the generative model.
   * @param requestOptions - {@link RequestOptions} Parameters to specify
   *     request options
   * @returns Instance of the GenerativeModel class.
   */
  getGenerativeModel(
    modelParams: ModelParams,
    requestOptions?: RequestOptions
  ): GenerativeModel {
    const getGenerativeModelParams: GetGenerativeModelParams = {
      model: modelParams.model,
      project: this.project,
      location: this.location,
      googleAuth: this.googleAuth,
      apiEndpoint: this.apiEndpoint,
      safetySettings: modelParams.safetySettings,
      generationConfig: modelParams.generationConfig,
      tools: modelParams.tools,
      requestOptions: requestOptions,
    };
    return new GenerativeModel(getGenerativeModelParams);
  }
}

/**
 * Preview namespace for VertexAI. Users invoke getGenerativeModel method to start using Google's generative models in preview.
 */
class VertexAIPreview {
  private readonly project: string;
  private readonly location: string;
  protected readonly googleAuth: GoogleAuth;
  private readonly apiEndpoint?: string;

  /**
   * @constructor
   * @param project - The Google Cloud project to use for the request
   * @param location - location The Google Cloud project location to use for the
   *     request
   * @param googleAuth - googleAuth The GoogleAuthen class instance from
   *     google-auth-library.
   *        Complete list of authentication options is documented in the
   * GoogleAuthOptions interface:
   *        https://github.com/googleapis/google-auth-library-nodejs/blob/main/src/auth/googleauth.ts
   * @param apiEndpoint - [apiEndpoint] The base Vertex AI endpoint to use for
   *     the request. If
   *        not provided, the default regionalized endpoint
   *        (i.e. us-central1-aiplatform.googleapis.com) will be used.
   */
  constructor(
    project: string,
    location: string,
    googleAuth: GoogleAuth,
    apiEndpoint?: string
  ) {
    this.project = project;
    this.location = location;
    this.googleAuth = googleAuth;
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * @param modelParams - {@link ModelParams} Parameters to
   *     specify the generative model.
   * @returns Instance of the GenerativeModelPreview class.
   */
  getGenerativeModel(
    modelParams: ModelParams,
    requestOptions?: RequestOptions
  ): GenerativeModelPreview {
    const getGenerativeModelParams: GetGenerativeModelParams = {
      model: modelParams.model,
      project: this.project,
      location: this.location,
      googleAuth: this.googleAuth,
      apiEndpoint: this.apiEndpoint,
      safetySettings: modelParams.safetySettings,
      generationConfig: modelParams.generationConfig,
      tools: modelParams.tools,
      requestOptions: requestOptions,
    };
    return new GenerativeModelPreview(getGenerativeModelParams);
  }
}

function validateGoogleAuthOptions(
  project: string,
  googleAuthOptions?: GoogleAuthOptions
): GoogleAuthOptions {
  let opts: GoogleAuthOptions;
  const requiredScope = 'https://www.googleapis.com/auth/cloud-platform';
  if (!googleAuthOptions) {
    opts = {
      scopes: requiredScope,
    };
    return opts;
  }
  if (googleAuthOptions.projectId && googleAuthOptions.projectId !== project) {
    throw new Error(
      `project ID value received to instantiate VertexAI class and project ID value received via GoogleAuthOptions are different.`
    );
  }
  opts = googleAuthOptions;
  if (!opts.scopes) {
    opts.scopes = requiredScope;
    return opts;
  }
  if (
    (typeof opts.scopes === 'string' && opts.scopes !== requiredScope) ||
    (Array.isArray(opts.scopes) && opts.scopes.indexOf(requiredScope) < 0)
  ) {
    throw new GoogleAuthError(
      `input GoogleAuthOptions.scopes ${opts.scopes} doesn't contain required scope ${requiredScope}, please include ${requiredScope} into GoogleAuthOptions.scopes or leave GoogleAuthOptions.scopes undefined`
    );
  }
  return opts;
}
