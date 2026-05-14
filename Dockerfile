# ============================================================================
# Base image with system dependencies
# ============================================================================
FROM adguard/node-ssh:22.22--0 AS base
SHELL ["/bin/bash", "-lc"]

RUN apt-get update \
    && apt-get install -y zip \
    && rm -rf /var/lib/apt/lists/*

# Prevent "dubious ownership" error in git
RUN git config --global --add safe.directory '*'

WORKDIR /extension

ENV npm_config_store_dir=/pnpm-store

# ============================================================================
# Stage: deps
# Cached until package.json/pnpm-lock.yaml changes
# ============================================================================
FROM base AS deps

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,target=/pnpm-store,id=vpn-extension-pnpm \
    pnpm install \
        --frozen-lockfile \
        --prefer-offline \
        --ignore-scripts

# ============================================================================
# Stage: source
# Has source + node_modules
# ============================================================================
FROM deps AS source

COPY . /extension

# ============================================================================
# Stage: lint
# Runs ESLint + type checking
# ============================================================================
FROM source AS lint

ARG TEST_RUN_ID

RUN --mount=type=cache,target=/pnpm-store,id=vpn-extension-pnpm \
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    pnpm lint && \
    mkdir -p /out && \
    touch /out/lint.txt

FROM scratch AS lint-output
COPY --from=lint /out/ /

# ============================================================================
# Stage: unit-tests
# Runs unit tests with JUnit output
# TEST_RUN_ID busts cache so tests always re-run
# ============================================================================
FROM source AS unit-tests

ARG TEST_RUN_ID

RUN --mount=type=cache,target=/pnpm-store,id=vpn-extension-pnpm \
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    mkdir -p /out/tests-reports && \
    set +e; \
    pnpm test:ci; \
    EXIT_CODE=$?; \
    if [ -d tests-reports ]; then \
      cp -R tests-reports/. /out/tests-reports/; \
    fi; \
    echo ${EXIT_CODE} > /out/exit-code.txt; \
    exit 0

FROM scratch AS unit-tests-output
COPY --from=unit-tests /out/ /

# ============================================================================
# Stage: bundle-size-check
# Builds and checks bundle sizes for a given BUILD_TYPE and optional BROWSER
# ============================================================================
FROM source AS bundle-size-check

ARG BUILD_TYPE
ARG BROWSER=""
ARG STAGE_ENV
ARG VPN_API_URL
ARG ACCOUNTS_API_URL
ARG FORWARDER_DOMAIN
ARG TEST_RUN_ID

RUN --mount=type=cache,target=/pnpm-store,id=vpn-extension-pnpm \
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    export STAGE_ENV="${STAGE_ENV}" && \
    export VPN_API_URL="${VPN_API_URL}" && \
    export AUTH_API_URL="${ACCOUNTS_API_URL}" && \
    export FORWARDER_DOMAIN="${FORWARDER_DOMAIN}" && \
    pnpm ${BUILD_TYPE} ${BROWSER} && \
    pnpm bundle-size check ${BUILD_TYPE} ${BROWSER} && \
    mkdir -p /out && \
    touch /out/bundle-size-check.txt

FROM scratch AS bundle-size-check-output
COPY --from=bundle-size-check /out/ /

# ============================================================================
# Stage: locales-check
# Validates translation files
# TEST_RUN_ID busts cache so check always re-runs
# ============================================================================
FROM source AS locales-check

ARG TEST_RUN_ID

RUN --mount=type=cache,target=/pnpm-store,id=vpn-extension-pnpm \
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    pnpm locales validate --min && \
    mkdir -p /out && \
    touch /out/locales-check.txt

FROM scratch AS locales-check-output
COPY --from=locales-check /out/ /

# ============================================================================
# Stage: dev-build
# Creates dev builds with both test and prod API endpoints
# ============================================================================
FROM source AS dev-build

ARG TEST_RUN_ID
ARG VPN_API_URL_TEST
ARG ACCOUNTS_API_URL_TEST
ARG FORWARDER_DOMAIN_TEST
ARG VPN_API_URL_PROD
ARG ACCOUNTS_API_URL_PROD
ARG FORWARDER_DOMAIN_PROD

RUN --mount=type=cache,target=/pnpm-store,id=vpn-extension-pnpm \
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    # Build with test API endpoints.
    STAGE_ENV=test \
    VPN_API_URL="${VPN_API_URL_TEST}" \
    AUTH_API_URL="${ACCOUNTS_API_URL_TEST}" \
    FORWARDER_DOMAIN="${FORWARDER_DOMAIN_TEST}" \
    pnpm dev && \
    # Build CRX with test env.
    STAGE_ENV=test pnpm crx:dev && \
    # Build with prod API endpoints.
    STAGE_ENV=prod \
    VPN_API_URL="${VPN_API_URL_PROD}" \
    AUTH_API_URL="${ACCOUNTS_API_URL_PROD}" \
    FORWARDER_DOMAIN="${FORWARDER_DOMAIN_PROD}" \
    pnpm dev && \
    # Build CRX with prod env.
    STAGE_ENV=prod pnpm crx:dev && \
    mkdir -p /out/artifacts && \
    # Test env artifacts.
    cp build/dev/chrome.zip /out/artifacts/ && \
    cp build/dev/edge.zip /out/artifacts/ && \
    cp build/dev/opera.zip /out/artifacts/ && \
    cp build/dev/firefox.zip /out/artifacts/ && \
    cp build/dev/chrome.crx /out/artifacts/ && \
    # Prod env artifacts (with -prod suffix).
    cp build/dev/chrome-prod.zip /out/artifacts/ && \
    cp build/dev/edge-prod.zip /out/artifacts/ && \
    cp build/dev/opera-prod.zip /out/artifacts/ && \
    cp build/dev/firefox-prod.zip /out/artifacts/ && \
    cp build/dev/chrome-prod.crx /out/artifacts/

FROM scratch AS dev-build-output
COPY --from=dev-build /out/ /

# ============================================================================
# Stage: beta-build
# Creates beta build with zip files for CI artifacts
# Requires private repo for CRX certificate (passed via named build context)
# ============================================================================
FROM source AS beta-build

COPY --from=private . /extension/private

ARG STAGE_ENV
ARG VPN_API_URL
ARG ACCOUNTS_API_URL
ARG FORWARDER_DOMAIN
ARG TEST_RUN_ID

RUN --mount=type=cache,target=/pnpm-store,id=vpn-extension-pnpm \
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    export STAGE_ENV="${STAGE_ENV}" && \
    export VPN_API_URL="${VPN_API_URL}" && \
    export AUTH_API_URL="${ACCOUNTS_API_URL}" && \
    export FORWARDER_DOMAIN="${FORWARDER_DOMAIN}" && \
    pnpm beta && \
    pnpm crx:beta && \
    mkdir -p /out/artifacts && \
    mv build/beta/chrome.zip /out/artifacts/ && \
    mv build/beta/edge.zip /out/artifacts/ && \
    mv build/beta/opera.zip /out/artifacts/ && \
    mv build/beta/chrome.crx /out/artifacts/ && \
    mv build/beta/update.xml /out/artifacts/ && \
    mv build/beta/build.txt /out/artifacts/

FROM scratch AS beta-build-output
COPY --from=beta-build /out/ /

# ============================================================================
# Stage: firefox-beta-build
# Creates Firefox beta build with zip files and source archive for AMO
# ============================================================================
FROM source AS firefox-beta-build

ARG STAGE_ENV
ARG VPN_API_URL
ARG ACCOUNTS_API_URL
ARG FORWARDER_DOMAIN
ARG TEST_RUN_ID

RUN --mount=type=cache,target=/pnpm-store,id=vpn-extension-pnpm \
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    export STAGE_ENV="${STAGE_ENV}" && \
    export VPN_API_URL="${VPN_API_URL}" && \
    export AUTH_API_URL="${ACCOUNTS_API_URL}" && \
    export FORWARDER_DOMAIN="${FORWARDER_DOMAIN}" && \
    pnpm beta firefox && \
    ./bamboo-specs/scripts/archive-source.sh beta && \
    mkdir -p /out/artifacts && \
    mv build/beta/firefox.zip /out/artifacts/ && \
    mv build/beta/update.json /out/artifacts/ && \
    mv build/beta/build.txt /out/artifacts/ && \
    mv build/beta/source.zip /out/artifacts/ && \
    mv build/beta/approval-notes.txt /out/artifacts/

FROM scratch AS firefox-beta-build-output
COPY --from=firefox-beta-build /out/ /

# ============================================================================
# Stage: firefox-beta-sign
# Signs Firefox beta with go-webext (requires AMO credentials)
# Expects artifacts via named build context: --build-context firefox-artifacts=...
# Uses adguard/extension-builder image which has go-webext pre-installed
# ============================================================================
FROM adguard/extension-builder:22.22--0.4.1--0 AS firefox-beta-sign

WORKDIR /sign

COPY --from=firefox-artifacts firefox.zip /sign/firefox.zip
COPY --from=firefox-artifacts update.json /sign/update.json
COPY --from=firefox-artifacts source.zip /sign/source.zip
COPY --from=firefox-artifacts build.txt /sign/build.txt
COPY --from=firefox-artifacts approval-notes.txt /sign/approval-notes.txt

ARG FIREFOX_CLIENT_ID
ARG TEST_RUN_ID

RUN --mount=type=secret,id=FIREFOX_CLIENT_SECRET \
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    mkdir -p /out/artifacts && \
    FIREFOX_CLIENT_ID="${FIREFOX_CLIENT_ID}" \
    FIREFOX_CLIENT_SECRET="$(cat /run/secrets/FIREFOX_CLIENT_SECRET)" \
    go-webext -v sign firefox -f 'firefox.zip' -s 'source.zip' -o 'firefox.xpi' \
        -n "$(cat approval-notes.txt)" && \
    cp build.txt /out/artifacts/ && \
    cp firefox.zip /out/artifacts/ && \
    cp firefox.xpi /out/artifacts/ && \
    cp update.json /out/artifacts/ && \
    cp source.zip /out/artifacts/

FROM scratch AS firefox-beta-sign-output
COPY --from=firefox-beta-sign /out/ /

# ============================================================================
# Stage: release-build
# Creates release build with zip files for CI artifacts
# Requires private repo for CRX certificate (passed via named build context)
# ============================================================================
FROM source AS release-build

COPY --from=private . /extension/private

ARG STAGE_ENV
ARG VPN_API_URL
ARG ACCOUNTS_API_URL
ARG FORWARDER_DOMAIN
ARG TEST_RUN_ID

RUN --mount=type=cache,target=/pnpm-store,id=vpn-extension-pnpm \
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    export STAGE_ENV="${STAGE_ENV}" && \
    export VPN_API_URL="${VPN_API_URL}" && \
    export AUTH_API_URL="${ACCOUNTS_API_URL}" && \
    export FORWARDER_DOMAIN="${FORWARDER_DOMAIN}" && \
    pnpm release && \
    pnpm crx:release && \
    ./bamboo-specs/scripts/archive-source.sh release && \
    mkdir -p /out/artifacts && \
    mv build/release/chrome.zip /out/artifacts/ && \
    mv build/release/edge.zip /out/artifacts/ && \
    mv build/release/opera.zip /out/artifacts/ && \
    mv build/release/firefox.zip /out/artifacts/ && \
    mv build/release/chrome.crx /out/artifacts/ && \
    mv build/release/build.txt /out/artifacts/ && \
    mv build/release/source.zip /out/artifacts/ && \
    mv build/release/approval-notes.txt /out/artifacts/

FROM scratch AS release-build-output
COPY --from=release-build /out/ /
