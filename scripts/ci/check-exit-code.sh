#!/bin/bash

# Fails the step with the exit code recorded by the unit-tests Docker stage.
# The stage always exits 0 (writing the real code to exit-code.txt) so the
# JUnit report is extracted even when tests fail; this script restores the
# real result. Used by both ci.yml and publish-release.yml.
set -euo pipefail

if [[ -f output/unit-tests/exit-code.txt ]]; then
  exit "$(cat output/unit-tests/exit-code.txt)"
fi
echo "::error::output/unit-tests/exit-code.txt not found"
exit 1
