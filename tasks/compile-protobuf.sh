#!/usr/bin/env bash
BANNER="/**
 * This file was automatically generated with protobufjs cli tool, see \"pnpm compile-proto\"
 */"
echo "$BANNER" > src/background/connectivity/protobufCompiled.js
pbjs -t static-module -w es6 -l " eslint-disable " src/background/connectivity/connectivity.proto >> src/background/connectivity/protobufCompiled.js
