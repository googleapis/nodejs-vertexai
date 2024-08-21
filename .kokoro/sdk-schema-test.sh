#!/bin/bash

# Copyright 2024 Google LLC
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

set -e

export TEST_REPO=nodejs-vertexai
CURRENT_VERSION=$(node -v 2>/dev/null || echo "none")
REQUIRED_VERSION="v18.0.0"

install_node() {
  echo "Installing Node.js via NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
}

compare_versions() {
  [ "$(printf '%s\n' "$1" "$2" | sort -V | head -n1)" != "$1" ]
}

if [ "$CURRENT_VERSION" = "none" ]; then
  echo "Node.js is not installed. Installing Node.js..."
  install_node
else
  echo "Current Node.js version: $CURRENT_VERSION"

  if compare_versions "$CURRENT_VERSION" "$REQUIRED_VERSION"; then
    echo "Node.js version is greater than or equal to $REQUIRED_VERSION"
  else
    echo "Node.js version is less than $REQUIRED_VERSION. Installing the required version..."
    install_node
  fi
fi

echo "Node.js installation or upgrade process completed."

npm install
git clone https://github.com/google-gemini/generative-ai-js.git
npm install ts-node && npm install typescript
npx ts-node sdk_schema_test/vertex_ai/*test.ts
npx ts-node sdk_schema_test/google_ai/*test.ts
rm -rf generative-ai-js
rm -rf build
rm -rf node_modules
find . -type f -name "*.js" ! -path "./test/spec/*" ! -name ".*.js" -exec rm {} \;
rm package-lock.json
