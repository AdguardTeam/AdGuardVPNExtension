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
(git -c safe.directory=$PWD ls-files; echo ".env") | zip -@ "$OUTPUT_ZIP"

# Remove README_FIREFOX.md from source.zip (build instructions are appended below)
zip -d "$OUTPUT_ZIP" "bamboo-specs/scripts/README_FIREFOX.md" 2>/dev/null || true

# Append Firefox Add-ons Review team build instructions to README.md inside source.zip.
# The review instructions are embedded here as a heredoc so everything stays in one file.
# See https://extensionworkshop.com/documentation/publish/source-code-submission/
TEMP_DIR=$(mktemp -d)
unzip -o "$OUTPUT_ZIP" README.md -d "$TEMP_DIR"
# Replace the TOC anchor with a TOC entry for the Firefox reviewer section.
sed -i.bak 's/<!-- TOC:AMO_REVIEW -->/- [Building Instructions for Firefox Add-ons Review Team](#building-instructions-for-firefox-add-ons-review-team)/' "$TEMP_DIR/README.md"
rm -f "$TEMP_DIR/README.md.bak"
cat >> "$TEMP_DIR/README.md" << 'REVIEW_EOF'

## Building Instructions for Firefox Add-ons Review Team

This section is intended for the Firefox Add-ons Review team to reproduce
the extension build from source.

### Prerequisites

The only prerequisite is [Docker](https://docs.docker.com/get-docker/).
All build tools (Node.js v22, pnpm) are pre-installed in the Docker image.

### Building the release version

```sh
docker run --rm -it \
    -v $(pwd):/workspace \
    -w /workspace \
    --env-file .env \
    adguard/node-ssh:22.17--0 \
    /bin/sh -c "pnpm install && STAGE_ENV=prod pnpm release firefox"
```

The build output will be located at `build/release/firefox.zip`.

### Building the beta version

```sh
docker run --rm -it \
    -v $(pwd):/workspace \
    -w /workspace \
    --env-file .env \
    adguard/node-ssh:22.17--0 \
    /bin/sh -c "pnpm install && STAGE_ENV=prod pnpm beta firefox"
```

The build output will be located at `build/beta/firefox.zip`.
REVIEW_EOF
ABS_OUTPUT_ZIP="$(cd "$(dirname "$OUTPUT_ZIP")" && pwd)/$(basename "$OUTPUT_ZIP")"
(cd "$TEMP_DIR" && zip "$ABS_OUTPUT_ZIP" README.md)
rm -rf "$TEMP_DIR"

# Copy approval notes for AMO deploy
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cp "$SCRIPT_DIR/approval-notes.txt" "$OUTPUT_DIR/approval-notes.txt"

echo "source.zip created at $OUTPUT_ZIP"
echo "NOTE: never upload source.zip to public servers, it contains .env file"

# delete .env file after archiving source.zip
rm -f .env
