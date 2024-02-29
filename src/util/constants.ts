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
export const GENERATE_CONTENT_METHOD = 'generateContent';
export const STREAMING_GENERATE_CONTENT_METHOD = 'streamGenerateContent';
export const USER_ROLE = 'user';
export const MODEL_ROLE = 'model';
export const FUNCTION_ROLE = 'function';
const USER_AGENT_PRODUCT = 'model-builder';
const CLIENT_LIBRARY_VERSION = '0.5.0'; // x-release-please-version
const CLIENT_LIBRARY_LANGUAGE = `grpc-node/${CLIENT_LIBRARY_VERSION}`;
export const USER_AGENT = `${USER_AGENT_PRODUCT}/${CLIENT_LIBRARY_VERSION} ${CLIENT_LIBRARY_LANGUAGE}`;
export const CREDENTIAL_ERROR_MESSAGE =
  '\nUnable to authenticate your request\
        \nDepending on your run time environment, you can get authentication by\
        \n- if in local instance or cloud shell: `!gcloud auth login`\
        \n- if in Colab:\
        \n    -`from google.colab import auth`\
        \n    -`auth.authenticate_user()`\
        \n- if in service account or other: please follow guidance in https://cloud.google.com/docs/authentication';
