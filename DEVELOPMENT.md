# Development Guide

This guide covers setting up your development environment, building the
extension, running tests, and contributing code to the AdGuard VPN Browser
Extension.

## Prerequisites

### Required Tools

| Tool | Version | Notes |
|------|---------|-------|
| [Node.js](https://nodejs.org/) | 22.x | Use [nvm](https://github.com/nvm-sh/nvm) to manage versions |
| [pnpm](https://pnpm.io/) | 10.x | Package manager |
| [Git](https://git-scm.com/) | Latest | Version control |

> **Warning**: Node.js 24 is not supported. Node 24 introduced breaking changes
> that affect test dependencies (`util.isRegExp` removal, `AbortSignal` changes).
> Use Node 22.x until upstream dependencies are updated.

> **Note**: Development is tested on macOS and Linux. Windows users should use
> WSL or a virtual machine.

### Recommended IDE Setup

- **VS Code** or **WebStorm** with TypeScript and ESLint plugins
- Configure your editor to use 4-space indentation
- Enable ESLint auto-fix on save

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/AdguardTeam/AdGuardVPNExtension.git
cd AdGuardVPNExtension
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Copy the example environment file and fill in the required values:

```bash
cp .env.example .env
```

Environment variables:

| Variable | Description |
|----------|-------------|
| `STAGE_ENV` | Environment stage (`test`, `dev`, `prod`) |
| `VPN_API_URL` | VPN backend API URL |
| `AUTH_API_URL` | Authentication API URL |
| `FORWARDER_DOMAIN` | Forwarder service domain |

You can also pass environment variables inline:

```bash
STAGE_ENV=test VPN_API_URL="..." pnpm dev chrome
```

### 4. Build the Extension

```bash
# Build development version for all browsers
pnpm dev

# Build for a specific browser
pnpm dev chrome
```

Build output: `build/dev/<browser>/`

### 5. Load the Extension in Your Browser

**Chrome:**
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `build/dev/chrome/` directory

**Firefox:**
1. Navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Select any file in the `build/dev/firefox/` directory

**Edge:**
1. Navigate to `edge://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `build/dev/edge/` directory

## Development Workflow

### Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Build development version (all browsers) |
| `pnpm dev <browser>` | Build dev version for specific browser |
| `pnpm beta` | Build beta version |
| `pnpm release` | Build release version |
| `pnpm lint` | Run ESLint + TypeScript type checking |
| `pnpm check-types` | TypeScript type checking only |
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm compile-proto` | Compile protobuf schemas |
| `pnpm bundle-size check <env> [browser]` | Check bundle sizes |

Supported browsers: `chrome`, `firefox`, `edge`, `opera`

### Before Committing

Run these checks before every commit:

```bash
# 1. Lint and type check
pnpm lint

# 2. Run tests
pnpm test
```

Both must pass with no errors. Husky pre-commit hooks will run `lint-staged`
automatically.

### Branching Strategy

1. Create a feature branch from `master`
2. Make your changes
3. Ensure `pnpm lint` and `pnpm test` pass
4. Submit a pull request to `master`

## Common Tasks

### Building for Different Environments

```bash
# Development (unminified, source maps)
pnpm dev chrome

# Beta (minified, includes beta features)
pnpm beta chrome

# Release (minified, production)
pnpm release chrome
```

### Building CRX Files

For Chrome `.crx` package files:

```bash
# Development (uses test certificate)
pnpm crx:dev

# Beta/Release (requires certificates in ./private/AdguardVPN/)
pnpm crx:beta
pnpm crx:release
```

Certificates required for beta/release:
- `./private/AdguardVPN/certificate-beta.pem`
- `./private/AdguardVPN/certificate-release.pem`

Generate your own certificate:

```bash
pnpm crx keygen ./private/AdguardVPN
```

### Updating Protobuf Schemas

After modifying `src/background/connectivity/connectivity.proto`:

```bash
pnpm compile-proto
```

This regenerates `src/background/connectivity/protobufCompiled.js`.

### Managing Translations

```bash
# Upload base English locale
pnpm locales:upload

# Download all locales
pnpm locales:download

# Validate all locales
pnpm locales:validate

# Validate major locales only
pnpm locales:validate --min
```

Configure locale settings in `tasks/locales.js`.

### Bundle Size Monitoring

The project includes a bundle size monitoring system in `tasks/bundle-size/` that:

- Tracks and compares bundle sizes across build types and browser targets
- Detects significant size increases (default threshold: 10%)
- Checks for duplicate package versions
- Stores reference sizes in `.bundle-sizes.json`
- Enforces Firefox Add-ons Store limits: 4MB per `.js` file, 200MB total

**How it works:** On beta/release builds, current sizes are compared against
`.bundle-sizes.json`. The build fails if any size exceeds the threshold or
Firefox limits.

Check bundle sizes after building:

```bash
# Check all browsers for an environment
pnpm bundle-size check beta

# Check specific browser
pnpm bundle-size check release chrome
pnpm bundle-size check beta firefox

# Custom threshold (default: 10%)
pnpm bundle-size check beta --threshold 5
```

> **Note:** `pnpm bundle-size check beta` does not check Firefox. Run
> `pnpm bundle-size check beta firefox` separately.

Update reference sizes when increases are justified:

```bash
pnpm bundle-size update beta firefox
```

Commit the updated `.bundle-sizes.json` with justification in your PR.

### Updating Resources

Before releasing, update exclusions-services data:

```bash
pnpm resources
```

## Testing

### Running Tests

```bash
# Run all tests once
pnpm test

# Watch mode (re-runs on file changes)
pnpm test:watch

# CI mode (generates JUnit XML report)
pnpm test:ci
```

### Test Configuration

- **Framework**: Vitest with jsdom environment
- **Setup files**: `tests/__setups__/mocks.ts`, `tests/__setups__/chrome.ts`
- **Config**: `vitest.config.ts`

Test files are located in `tests/` and mirror the `src/` structure.

## Troubleshooting

### Node.js Version Issues

**Problem**: Tests fail with errors about `util.isRegExp` or `AbortSignal`.

**Solution**: Use Node.js 22.x. Check your version:

```bash
node --version  # Should be v22.x.x
```

If using nvm:

```bash
nvm use  # Uses version from .nvmrc
```

### pnpm Not Found

**Problem**: `pnpm: command not found`

**Solution**: Install pnpm globally:

```bash
npm install -g pnpm
# or
corepack enable
corepack prepare pnpm@latest --activate
```

### ESLint Errors on Import Order

**Problem**: ESLint reports import order violations.

**Solution**: ESLint enforces strict import ordering:
1. Built-in modules
2. External packages (React first, then `@adguard/*`)
3. Internal modules
4. Parent/sibling imports
5. Styles (`.pcss` files last)

Auto-fix with:

```bash
pnpm lint --fix
```

### Build Fails with Bundle Size Error

**Problem**: Build fails because bundle size exceeds limits.

**Solution**:
1. Investigate the cause (new dependencies, large assets)
2. If justified, update reference sizes:
   ```bash
   pnpm bundle-size update <env> <browser>
   ```
3. Commit `.bundle-sizes.json` with justification

### Firefox-Specific Build Errors

**Problem**: Firefox build fails with 4MB file limit error.

**Solution**: Individual `.js` files cannot exceed 4MB for Firefox Add-ons Store.
Split large modules or lazy-load code.

### Extension Not Loading

**Problem**: Browser shows errors when loading the extension.

**Solution**:
1. Check the browser console for specific errors
2. Ensure you built for the correct browser
3. Verify manifest version compatibility:
   - Chrome, Firefox, Edge, Opera: MV3

## Additional Resources

- [AGENTS.md](AGENTS.md) — Code guidelines and contribution rules
- [README.md](README.md) — Project overview and user documentation
- [CHANGELOG.md](CHANGELOG.md) — Version history
- [src/PERMISSIONS.md](src/PERMISSIONS.md) — Extension permissions documentation
