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
# TEST_RUN_ID busts the cache so tests re-run on every publish; PR CI passes
# no TEST_RUN_ID and may reuse cached layers (deliberate — see ci.yml).
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
# TEST_RUN_ID busts the cache so the check re-runs on every publish
# (PR CI passes no TEST_RUN_ID and may reuse cached layers — deliberate).
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
# Stage: sign-src-beta
# Symlinks the beta CRX certificate from a BuildKit secret (never copied into
# an image layer). Requires CERTIFICATE_PEM at build time.
# ============================================================================
FROM source AS sign-src-beta

# sha256 of the PEM. BuildKit secret *content* is not in the RUN cache
# key; ARG values are. Echoing CERT_DIGEST here busts the signed layers
# when the certificate rotates (including re-runs of the same RUN_ID),
# and BuildKit cascades the invalidation to every stage FROM this one.
# The file is not read later — it exists only to bind the ARG to this layer.
ARG CERT_DIGEST

RUN --mount=type=secret,id=CERTIFICATE_PEM,mode=0444 \
    echo "${CERT_DIGEST}" > /tmp/.cert-digest && \
    mkdir -p private/AdguardVPN && \
    ln -sf /run/secrets/CERTIFICATE_PEM \
        private/AdguardVPN/certificate-beta.pem

# ============================================================================
# Stage: sign-src-release
# Symlinks the release CRX certificate from a BuildKit secret.
# ============================================================================
FROM source AS sign-src-release

# See sign-src-beta: ARG is the cert-rotation cache key.
ARG CERT_DIGEST

RUN --mount=type=secret,id=CERTIFICATE_PEM,mode=0444 \
    echo "${CERT_DIGEST}" > /tmp/.cert-digest && \
    mkdir -p private/AdguardVPN && \
    ln -sf /run/secrets/CERTIFICATE_PEM \
        private/AdguardVPN/certificate-release.pem

# ============================================================================
# Stage: beta-build
# Creates beta build with zip files for CI artifacts.
# The CRX certificate comes from a BuildKit secret via sign-src-beta
# (see above), replacing the former Bamboo extensions-private checkout.
# ============================================================================
FROM sign-src-beta AS beta-build

ARG STAGE_ENV
ARG VPN_API_URL
ARG ACCOUNTS_API_URL
ARG FORWARDER_DOMAIN
ARG TEST_RUN_ID

RUN --mount=type=cache,target=/pnpm-store,id=vpn-extension-pnpm \
    --mount=type=secret,id=CERTIFICATE_PEM,mode=0444 \
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
    mv build/beta/update.xml /out/artifacts/

FROM scratch AS beta-build-output
COPY --from=beta-build /out/artifacts/ /

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
    ./scripts/ci/archive-source.sh beta && \
    mkdir -p /out/artifacts && \
    mv build/beta/firefox.zip /out/artifacts/ && \
    mv build/beta/update.json /out/artifacts/ && \
    mv build/beta/source.zip /out/artifacts/ && \
    mv build/beta/approval-notes.txt /out/artifacts/

FROM scratch AS firefox-beta-build-output
COPY --from=firefox-beta-build /out/artifacts/ /

# ============================================================================
# Stage: firefox-beta-sign
# Signs Firefox beta with go-webext (requires AMO credentials).
# Reuses artifacts from the firefox-beta-build stage (single docker build
# invocation builds both stages; AMO credentials are BuildKit secrets and
# never land in an image layer).
# Uses adguard/extension-builder image which has go-webext pre-installed.
# ============================================================================
FROM adguard/extension-builder:22.22--0.4.1--0 AS firefox-beta-sign

WORKDIR /sign

COPY --from=firefox-beta-build /out/artifacts/firefox.zip /sign/firefox.zip
COPY --from=firefox-beta-build /out/artifacts/update.json /sign/update.json
COPY --from=firefox-beta-build /out/artifacts/source.zip /sign/source.zip
COPY --from=firefox-beta-build /out/artifacts/approval-notes.txt /sign/approval-notes.txt

ARG TEST_RUN_ID
# Bound the AMO sign wait (go-webext polls without a timeout of its own) so
# a stuck AMO cannot occupy the runner until the 180 min job cap kills it.
ARG AMO_SIGN_TIMEOUT_S=900

RUN --mount=type=secret,id=FIREFOX_CLIENT_ID \
    --mount=type=secret,id=FIREFOX_CLIENT_SECRET \
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    mkdir -p /out/artifacts && \
    FIREFOX_CLIENT_ID="$(cat /run/secrets/FIREFOX_CLIENT_ID)" \
    FIREFOX_CLIENT_SECRET="$(cat /run/secrets/FIREFOX_CLIENT_SECRET)" \
    timeout --kill-after=60 "${AMO_SIGN_TIMEOUT_S}" \
    go-webext -v sign firefox -f 'firefox.zip' -s 'source.zip' -o 'firefox.xpi' \
        -n "$(cat approval-notes.txt)" && \
    cp firefox.zip /out/artifacts/ && \
    cp firefox.xpi /out/artifacts/ && \
    cp update.json /out/artifacts/ && \
    cp source.zip /out/artifacts/

FROM scratch AS firefox-beta-sign-output
COPY --from=firefox-beta-sign /out/artifacts/ /

# ============================================================================
# Stage: release-build
# Creates release build with zip files for CI artifacts.
# The CRX certificate comes from a BuildKit secret via sign-src-release
# (see above), replacing the former Bamboo extensions-private checkout.
# ============================================================================
FROM sign-src-release AS release-build

ARG STAGE_ENV
ARG VPN_API_URL
ARG ACCOUNTS_API_URL
ARG FORWARDER_DOMAIN
ARG TEST_RUN_ID

RUN --mount=type=cache,target=/pnpm-store,id=vpn-extension-pnpm \
    --mount=type=secret,id=CERTIFICATE_PEM,mode=0444 \
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    export STAGE_ENV="${STAGE_ENV}" && \
    export VPN_API_URL="${VPN_API_URL}" && \
    export AUTH_API_URL="${ACCOUNTS_API_URL}" && \
    export FORWARDER_DOMAIN="${FORWARDER_DOMAIN}" && \
    pnpm release && \
    pnpm crx:release && \
    ./scripts/ci/archive-source.sh release && \
    mkdir -p /out/artifacts && \
    mv build/release/chrome.zip /out/artifacts/ && \
    mv build/release/edge.zip /out/artifacts/ && \
    mv build/release/opera.zip /out/artifacts/ && \
    mv build/release/firefox.zip /out/artifacts/ && \
    mv build/release/chrome.crx /out/artifacts/ && \
    mv build/release/source.zip /out/artifacts/ && \
    mv build/release/approval-notes.txt /out/artifacts/

FROM scratch AS release-build-output
COPY --from=release-build /out/artifacts/ /
