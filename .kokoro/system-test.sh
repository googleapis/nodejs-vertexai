#!/bin/bash

# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -eo pipefail

export NPM_CONFIG_PREFIX=${HOME}/.npm-global

# Setup service account credentials.
export GCLOUD_PROJECT=ucaip-sample-tests

cd $(dirname $0)/..

# Run a pre-test hook, if a pre-system-test.sh is in the project
#
if [ -f .kokoro/pre-system-test.sh ]; then
    set +x
    . .kokoro/pre-system-test.sh
    set -x
fi

npm install

# If tests are running against main branch, configure flakybot
# to open issues on failures:
if [[ $KOKORO_BUILD_ARTIFACTS_SUBDIR = *"continuous"* ]] || [[ $KOKORO_BUILD_ARTIFACTS_SUBDIR = *"nightly"* ]]; then
  export MOCHA_REPORTER_OUTPUT=test_output_sponge_log.xml
  export MOCHA_REPORTER=xunit
  cleanup() {
    chmod +x $KOKORO_GFILE_DIR/linux_amd64/flakybot
    $KOKORO_GFILE_DIR/linux_amd64/flakybot
  }
  trap cleanup EXIT HUP
fi

# Switch to 'fail at end' to allow tar command to complete before exiting.
set +e

npm run cover:unit && npm run cover:integration
EXIT=$?

tar cvfz build.tar.gz build

npm run cover:report

if [ -d "coverage" ]; then
  tar cvfz coverage.tar.gz coverage
fi

if [[ $EXIT -ne 0 ]]; then
  echo -e "\n Testing failed: npm returned a non-zero exit code. \n"
  exit $EXIT
fi

set -e
