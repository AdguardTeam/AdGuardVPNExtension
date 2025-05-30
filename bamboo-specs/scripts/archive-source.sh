#!/bin/bash

# Usage: ./archive-source.sh beta|release
# Example: ./archive-source.sh release

# 'set' should be added to the beginning of each script to ensure that it runs with the correct options.
# Please do not move it to some common file, like `setup-tests.sh`, because sourcing A script from B script
# cannot change the options of B script.
#  -e: Exit immediately if any command exits with a non-zero status (i.e., if a command fails).
#  -x: Print each command to the terminal as it is executed, which is useful for debugging.
set -ex

# Validate argument
TARGET="$1"
if [ "$TARGET" != "beta" ] && [ "$TARGET" != "release" ]; then
  echo "Error: Argument must be 'beta' or 'release'"
  exit 1
fi

# Set output path
OUTPUT_DIR="build/$TARGET"
OUTPUT_ZIP="$OUTPUT_DIR/source.zip"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# write environment variables to .env file
echo "VPN_API_URL=${VPN_API_URL}" >> .env
echo "AUTH_API_URL=${AUTH_API_URL}" >> .env
echo "FORWARDER_DOMAIN=${FORWARDER_DOMAIN}" >> .env

# build source code for uploading to AMO / Standalone
(git ls-files; echo ".env") | zip -@ "$OUTPUT_ZIP"

echo "source.zip created at $OUTPUT_ZIP"

# delete .env file after archiving source.zip
rm -f .env