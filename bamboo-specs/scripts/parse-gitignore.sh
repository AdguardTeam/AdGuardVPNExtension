#!/bin/bash

# Reads a pre-generated exclude list and outputs `find`-compatible exclusion arguments.
#
# Usage:
#   source parse-gitignore.sh gitignore-excludes.txt
#
# Sets GITIGNORE_EXCLUDE_ARGS as a bash array with find-compatible exclusion patterns.
# No eval needed — use: find . -type f "${GITIGNORE_EXCLUDE_ARGS[@]}"
#
# The input file must be pre-generated on the host by generate-find-excludes.sh
# (where .git is available). Each line is a simple path with no wildcards.
# If the file is absent, this script fails with an error. Do not substitute
# .gitignore directly — its patterns are not fully representable as find predicates.

INPUT_FILE="${1:-gitignore-excludes.txt}"

GITIGNORE_EXCLUDE_ARGS=()

if [ ! -f "$INPUT_FILE" ]; then
  echo "Error: exclude list '$INPUT_FILE' not found." \
    "Run generate-find-excludes.sh on the host before entering Docker." >&2
  return 1 2>/dev/null || exit 1
fi

while IFS= read -r line; do
  [ -z "$line" ] && continue
  GITIGNORE_EXCLUDE_ARGS+=("!" "-path" "./$line" "!" "-path" "./$line/*")
done < "$INPUT_FILE"
