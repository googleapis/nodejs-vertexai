#!/bin/bash

# This script runs replay tests for the Vertex SDK JS GenAI modules.
# It is intended to be used from the google3 directory of a CitC client.
#
# Example:
#   ./third_party/javascript/node_modules/vertexai/test/genai/run_replay_tests.sh

START_DIR=$(pwd)

if [[ "$START_DIR" != */google3 ]]; then
    echo "Error: This script must be run from your client's '/google3' directory."
    echo "Your current directory is: $START_DIR"
    exit 1
fi

export GOOGLE_GENAI_REPLAYS_DIRECTORY="$START_DIR/google/cloud/aiplatform/sdk/genai/replays/tests/vertex_sdk_genai_replays/"

if [ ! -d "$GOOGLE_GENAI_REPLAYS_DIRECTORY" ]; then
    echo "Error: Replays directory not found at $GOOGLE_GENAI_REPLAYS_DIRECTORY"
    exit 1
fi

PARSED_ARGS=$(getopt -o "" -l "mode:" -- "$@")

if [ $? -ne 0 ]; then
    echo "Error: Failed to parse command line arguments." >&2
    exit 1
fi

eval set -- "$PARSED_ARGS"
MODE_VALUE="replay"

while true; do
    case "$1" in
        --mode)
            MODE_VALUE="$2"
            shift 2
            ;;
        --)
            shift
            break
            ;;
        *)
            echo "Internal error: Unrecognized arg option: '$1'" >&2
            exit 1
            ;;
    esac
done

if [ "$MODE_VALUE" != "replay" ]; then
    echo "Error: The JS SDK currently only supports --mode replay."
    exit 1
fi

echo "Running JS GenAI replay tests via blaze..."

blaze test --test_strategy=local \
  --test_env=GOOGLE_GENAI_REPLAYS_DIRECTORY="$GOOGLE_GENAI_REPLAYS_DIRECTORY" \
  --test_output=errors \
  //third_party/javascript/node_modules/vertexai/test:genai_modules_replay_tests

EXIT_CODE=$?
echo "Tests completed with exit code: $EXIT_CODE."
exit $EXIT_CODE
