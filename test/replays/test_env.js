/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const path = require('path');

module.exports = {
  beforeJasmine: () => {
    process.env['GOOGLE_CLOUD_PROJECT'] = 'vertex-sdk-dev';
    process.env['GOOGLE_CLOUD_LOCATION'] = 'us-central1';

    if (process.env['RUNFILES']) {
      process.env['GOOGLE_GENAI_REPLAYS_DIRECTORY'] = path.join(
          process.env['RUNFILES'],
          'google3/google/cloud/aiplatform/sdk/genai/replays/tests/vertex_sdk_genai_replays'
      );
    }

    return Promise.resolve();
  },
  afterJasmine: (failureReason) => Promise.resolve(failureReason),
};
