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

import {interfaceTestEngine} from '../utils/interface_test_engine';
import * as path from 'path';

const TEST_REPO = process.env['TEST_REPO'];
let sdkInterfaceDirs: string[];
let contractInterfaceFiles: string[];
if (TEST_REPO === 'generative-ai-js') {
  sdkInterfaceDirs = [path.resolve('types')];
  contractInterfaceFiles = [
    path.resolve(
      'nodejs-vertexai/sdk_schema_test/sdk_schema_common_interface_contract.ts'
    ),
    path.resolve(
      'nodejs-vertexai/sdk_schema_test/google_ai_only_interface_contract.ts'
    ),
  ];
} else if (TEST_REPO === 'nodejs-vertexai') {
  sdkInterfaceDirs = [path.resolve('generative-ai-js/types')];
  contractInterfaceFiles = [
    path.resolve('sdk_schema_test/sdk_schema_common_interface_contract.ts'),
    path.resolve('sdk_schema_test/google_ai_only_interface_contract.ts'),
  ];
} else {
  throw new Error(
    'Unknown test repo, please set the TEST_REPO environment variable to either generative-ai-js or nodejs-vertexai'
  );
}
const SDK_NAME = 'Google AI SDK';
interfaceTestEngine(SDK_NAME, sdkInterfaceDirs, contractInterfaceFiles);
