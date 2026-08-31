# Deployment — AdGuard VPN Browser Extension

AdGuard VPN browser extension is deployed via GitHub Actions. There is no
server infrastructure — deployment means publishing build artifacts
(signed CRX/XPI/ZIP files) to static file servers, submitting to browser
stores, and creating a GitHub Release on the public
`AdguardTeam/AdGuardVPNExtension` mirror.

> **Channel model:** Tags containing `-beta.N` (e.g. `v2.11.2-beta.1`) go
> through the **beta** pipeline. Tags without a pre-release suffix
> (e.g. `v2.11.2`) go through the **release** pipeline. This matches the
> former Bamboo beta vs release plans. The build stamps the version per
> browser (see [Version Tagging](#version-tagging)): Chrome/Edge betas use
> the store-legal four-component `X.Y.Z.N`, Firefox betas the toolkit
> `X.Y.ZbetaN`, releases the numeric `X.Y.Z` core.

## Table of Contents

- [Deployment Targets](#deployment-targets)
- [CI/CD Infrastructure](#cicd-infrastructure)
  - [CI Workflow](#ci-workflow)
  - [Release Preparation](#release-preparation)
  - [Publish Workflow](#publish-workflow)
  - [Failure recovery](#failure-recovery)
  - [Mirror](#mirror)
- [Pipeline Flow](#pipeline-flow)
- [Docker Image](#docker-image)
- [Build Artifacts](#build-artifacts)
- [Version Tagging](#version-tagging)
- [Secrets and Variables](#secrets-and-variables)
- [Follow-ups](#follow-ups)
- [Additional Resources](#additional-resources)

## Deployment Targets

| Target | What is deployed | Channels |
| --- | --- | --- |
| **static.adtidy.net** (Chrome) | beta: `chrome.crx`, `chrome.zip`, `update.xml`; release: `chrome.zip` | beta, release |
| **static.adtidy.net** (Firefox) | beta: `firefox.xpi`, `firefox.zip`, `update.json`; release: `firefox.zip` | beta, release |
| **Chrome Web Store** | `chrome.zip` | beta, release |
| **Firefox AMO** (listed) | `firefox.zip` + `source.zip` | release only |
| **Edge Add-ons** | `edge.zip` | release only |
| **GitHub Release** (`AdguardTeam/AdGuardVPNExtension`) | Channel build assets | beta, release |
| **Opera add-ons** | Manual upload (no store API) | release |

Static uploads use the internal **deployer** service. Modules:

- `vpn-webext-chrome-beta` / `vpn-webext-chrome-release`
- `vpn-webext-firefox-beta` / `vpn-webext-firefox-release`

Store listing IDs live in `publish-release.yml` (source of truth — see the
`publish-chrome-webstore`, `publish-amo`, and `publish-edge` jobs). They are
public constants: the Chrome Web Store release and beta (separate unlisted)
item ids, the Edge Partner Center product id, and the AMO add-on id.

## CI/CD Infrastructure

All CI/CD is managed via **GitHub Actions**. Workflow definitions live in
`.github/workflows/`. Jobs run on the `team-extensions` self-hosted
runner group.

### CI Workflow

**File:** `.github/workflows/ci.yml`

Runs on pull requests and pushes to `master`. Stamps a `-dev` version
via `ext-shared-actions/set-dev-version`, then runs the Docker stages
`lint-output`, `unit-tests-output` (with `exit-code.txt` check), and
`dev-build-output` (builds both test- and prod-endpoint variants).
Uploads dev archives and JUnit test reports as workflow artifacts.

### Release Preparation

**File:** `.github/workflows/prepare-release.yml`

Triggered manually via `workflow_dispatch` with a `tag` input
(`v2.11.2` or `v2.11.2-beta.1`). Calls `create-release-pr.yml` to open a
release PR that finalizes `CHANGELOG.md`.

When the release PR is merged to `master`, `publish-release.yml` takes
over.

### Publish Workflow

**File:** `.github/workflows/publish-release.yml`

Triggered when a `release-bump/*` PR from the release bot is merged, or
manually via `workflow_dispatch` (ref must be empty, `master`, or a
`vX.Y.Z[-beta.N]` tag — arbitrary SHAs/branches are rejected because
the build mounts CRX/AMO secrets).

1. **Tag** — `tag-from-changelog.yml` reads the version from
   `CHANGELOG.md` and creates `v<version>` / `v<version>-beta.N`.
2. **Checks** — lint, unit tests, translations, and bundle-size gates
   (former Bamboo "Checks" stage).
3. **Build** — Injects the full version into `package.json` (the build
   converts it per browser — see [Version Tagging](#version-tagging)),
   fetches the channel CRX certificate from Vault, builds
   `{beta|release}-build-output`.
4. **Static Chrome** — `deploy-to-static.yml` →
   `vpn-webext-chrome-{beta|release}`.
5. **Chrome Web Store** — `deploy-to-chrome-web-store.yml` (beta or
   release item id).
6. **Release AMO** — `deploy-to-firefox-addons.yml` (listed) with
   `firefox.zip` + `source.zip` + approval notes.
7. **Release Edge** — `deploy-to-edge-addons.yml`.
8. **Release static Firefox** — `deploy-to-static.yml` →
   `vpn-webext-firefox-release`.
9. **GitHub Release** — `create-gh-release.yml` on
   `AdguardTeam/AdGuardVPNExtension` (Octopass).
10. **Beta Firefox (isolated)** — Docker `firefox-beta-sign-output`
    signs via `go-webext`, then static deploy
    `vpn-webext-firefox-beta`, then attaches assets to the GitHub
    Release.
11. **Slack** — `#adguard-extension-vcs`.

### Failure recovery

- Prefer **Re-run failed jobs**, not **Re-run all jobs**. Re-running
  everything force-retags and re-uploads store packages (CWS/AMO/Edge
  reject duplicate versions).
- AMO sign can stay pending after a job timeout. Re-run the Firefox beta
  job later; a duplicate-version rejection usually means the first
  submission is still in review.
- The AMO wait is bounded by the `amo-sign-timeout-s` dispatch input
  (default 900 s, clamped to 9000 s to stay inside the 180-minute job
  cap). On a timeout, dispatch a fresh run for the same tag with a larger
  value — note that re-running an *existing* run reuses its original
  inputs.
- Publish runs are serialized (`cancel-in-progress: false`). A hung
  Firefox sign holds the next publish until it finishes or times out
  (job cap 180 minutes).
- The green “published” Slack message waits for the Firefox beta static
  deploy + GitHub Release assets on beta tags; on release tags those
  jobs are skipped.

### Mirror

**File:** `.github/workflows/mirror.yml`

On every push to `master` and on `v*` tags, mirrors to the public
`AdguardTeam/AdGuardVPNExtension` repository.

Note: tags pushed by the pipeline (via `GITHUB_TOKEN`) do **not** trigger
`mirror.yml` — GitHub suppresses workflow triggers from token-pushed refs.
The public tag materializes through the GitHub Release created by
`create-gh-release.yml` instead. This also means a force-retag after a
failed publish does not re-mirror; the release assets go to whichever
commit the public tag points at, and compare links in the release notes
can 404 until the tag is recreated.

## Pipeline Flow

```text
PR opened / push to master
  └─► ci.yml — set-dev-version + lint + unit tests + dev build

Manual: prepare-release.yml (tag input)
  └─► release PR (CHANGELOG.md)

Release PR merged to master
  └─► publish-release.yml
        ├─ tag-from-changelog.yml
        ├─ checks (lint, unit tests, locales, bundle size)
        ├─ build (Chrome CRX/ZIP + Edge/Opera [+ Firefox zip + source on release])
        ├─ static chrome (+ static firefox on release)
        ├─ Chrome Web Store
        ├─ release: AMO listed + Edge Add-ons
        ├─ create-gh-release.yml
        └─ beta only (parallel, may be slow):
              build-firefox-beta (AMO sign) → static firefox → GH release assets
```

## Docker Image

Build and test jobs use the image in the Dockerfile `FROM … AS base`
line. The Firefox beta sign stage uses `adguard/extension-builder`
(go-webext pre-installed).

The pnpm store is a BuildKit cache
(`--mount=type=cache,target=/pnpm-store`). Signing secrets are BuildKit
`--secret` mounts, symlinked into `private/AdguardVPN/` by the
`sign-src-beta` / `sign-src-release` stages so they never appear in
image layers. `CERT_DIGEST` (sha256 of the PEM) is passed as a build ARG
to bust the signed layers on certificate rotation; BuildKit cascades the
invalidation to the stages `FROM` the sign stages.

CI helper scripts live under `scripts/ci/` (source archive, AMO approval
notes, gitignore excludes for Docker).

## Build Artifacts

Exact file lists live in the Dockerfile `*-output` stages and
`publish-release.yml` upload steps. Conceptually:

- **Beta Chrome** — `chrome.crx`, `chrome.zip`, `edge.zip`, `opera.zip`,
  `update.xml`
- **Beta Firefox** — `firefox.xpi`, `firefox.zip`, `update.json`
- **Release** — `chrome.zip` / `chrome.crx`, `edge.zip`, `opera.zip`,
  `firefox.zip`, `source.zip`, `approval-notes.txt`
- **CI** — dev zips plus a test-certificate-signed `chrome.crx`, in both
  test- and prod-endpoint variants (not for distribution)

`source.zip` contains a generated `.env` with the API endpoints —
**never upload it to public servers**; it is only submitted to AMO.
`approval-notes.txt` is internal reviewer notes for AMO.

## Version Tagging

- **Beta:** `v<version>-beta.N` (e.g. `v2.11.2-beta.1`)
- **Release:** `v<version>` (e.g. `v2.11.2`)
- Version is parsed from `CHANGELOG.md`. The full version goes into
  `package.json`; the build (`tasks/helpers.ts`) converts it per browser:
  Chrome/Edge/Opera betas become `X.Y.Z.N` (stores reject pre-release
  suffixes, and the four-component form keeps successive betas distinct
  for CWS and `update.xml`), Firefox betas become the toolkit form
  `X.Y.ZbetaN` (sorts `beta.1 < beta.2 < release` for `update.json`),
  and releases keep the numeric `X.Y.Z` core.
- The Bamboo `build.txt`-driven tagging and the `increment` plan are
  gone — versions are managed through `prepare-release.yml` release PRs.

## Secrets and Variables

CI secrets are **organization-level** (HashiCorp Vault). Org variable:
`VAULT_URL`.

### Extension-specific Vault secrets

- Path: `secret/data/ci-secrets/extensions-private-adguard-vpn`
- Role: `extensions-private-adguard-vpn`
- Keys: `UNTRUSTED_certificate-beta` / `UNTRUSTED_certificate-release`
  (Chrome CRX signing PEMs; consumed by the `vault-action` step in
  `publish-release.yml`, which is the source of truth)

These replace the former Bamboo `extensions-private` checkout. **DevOps
must create the Vault role and keys before the first publish.**

### Shared store Vault secrets

Used via the shared reusable workflows (see the `publish-*` jobs in
`publish-release.yml`): `firefox-amo-deployer` (beta `go-webext` sign and
release AMO), `edge-addons-deployer`, and the Chrome Web Store deployer.

The public GitHub Release uses Octopass (`id-token: write`) against
`AdguardTeam/AdGuardVPNExtension`, not `GITHUB_TOKEN` on this private
repo.

### Repository variables (API endpoints)

The build needs backend endpoints (test + prod). They are baked into the
public build output, so they are **variables**, not secrets. The
authoritative list is the `env:` block of `publish-release.yml` (prod
endpoints) and the dev-build step of `ci.yml` (test + prod):

- `VPN_API_URL_TEST` / `ACCOUNTS_API_URL_TEST` / `FORWARDER_DOMAIN_TEST`
- `VPN_API_URL_PROD` / `ACCOUNTS_API_URL_PROD` / `FORWARDER_DOMAIN_PROD`

These replace the former Bamboo plan variables (`devVpnApiUrl`,
`devAuthApiUrl`, `devVpnForwarderDomain`, `prodVpnApiUrl`,
`prodAuthApiUrl`, `prodVpnForwarderDomain`).

### Former Bamboo secret names (reference)

| Bamboo | Replacement |
| --- | --- |
| `extensions-private` repo checkout | Vault CRX PEMs |
| `bamboo_firefoxAmoClientId` / `bamboo_firefoxAmoClientSecret` | `firefox-amo-deployer` |
| Chrome Web Store client id/secret/refresh | shared CWS deployer in Vault |
| Edge client id / API key | `edge-addons-deployer` |
| `bamboo.githubPublicRepoPassword` | Octopass (`create-gh-release.yml`) |

## Follow-ups

- Provision Vault path/role `extensions-private-adguard-vpn` with
  `UNTRUSTED_certificate-beta` and `UNTRUSTED_certificate-release`.
- Set the six repository variables listed above.
- GitHub Environments (provisioned via terraform-github):
  `beta-static`, `production-static`, `chrome-webstore-beta`,
  `chrome-webstore-release`, `firefox-amo-release`,
  `edge-addons-release`, `github-release`.
- After the first beta static deploy, confirm existing update URLs still
  resolve (`https://static.adtidy.net/extensions/adguardvpn/beta/update.xml`
  and `update.json`). Deployer module names changed; paths must not.
- Disable the old Bamboo plans only after a green GHA CI run and a
  successful beta publish.

## Additional Resources

- [DEVELOPMENT.md](DEVELOPMENT.md) — local development
- [AGENTS.md](AGENTS.md) — agent / contributor guidelines
- [README.md](README.md) — product overview
