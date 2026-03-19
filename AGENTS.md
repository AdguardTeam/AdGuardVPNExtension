# AGENTS.md

Instructions for LLM agents and human contributors working on this project.

## Project Overview

AdGuard VPN Browser Extension — a cross-browser extension that provides VPN
functionality for Chrome, Firefox, Edge, and Opera. The extension encrypts
connections, hides IP addresses, and enables anonymous browsing through
AdGuard's VPN infrastructure.

## Technical Context

- **Language**: TypeScript ~5.9, Node.js >=22.0.0 <24.0.0
- **Framework**: React 18 with MobX 5 for state management
- **Bundler**: Rspack (Rust-based webpack alternative)
- **Testing**: Vitest with jsdom environment
- **Linting**: ESLint with Airbnb config + TypeScript rules
- **Target Platform**: Browser extensions (Chrome MV3, Firefox MV3, Edge, Opera)
- **Storage**: Browser extension storage APIs (chrome.storage)
- **Build Environments**: dev, beta, release

## Project Structure

```text
├── src/                      # Extension source code
│   ├── background/           # Service worker / background scripts
│   │   ├── api/              # VPN API client
│   │   ├── connectivity/     # WebSocket + protobuf messaging
│   │   ├── proxy/            # Proxy configuration logic
│   │   ├── exclusions/       # Site exclusion rules
│   │   └── ...               # (30+ modules)
│   ├── popup/                # Browser action popup UI (React)
│   │   ├── components/       # React components
│   │   └── stores/           # MobX stores
│   ├── options/              # Options/settings page UI (React)
│   │   ├── components/       # React components
│   │   └── stores/           # MobX stores
│   ├── common/               # Shared utilities and components
│   │   ├── locale/           # i18n translation system
│   │   ├── log-storage/      # Debug logging
│   │   └── utils/            # Helper functions
│   ├── _locales/             # Translation files (40 languages)
│   ├── assets/               # Static assets (images, fonts)
│   ├── content-scripts/      # Content scripts injected into pages
│   └── offscreen/            # Offscreen document (MV3)
├── tasks/                    # Build tooling
│   ├── bundle-size/          # Bundle size monitoring
│   ├── chrome/               # Chrome-specific config
│   ├── firefox/              # Firefox-specific config
│   ├── edge/                 # Edge-specific config
│   └── rspack.common.ts      # Shared Rspack configuration
├── tests/                    # Test files (mirrors src/ structure)
├── bamboo-specs/             # CI/CD pipeline definitions
├── package.json              # Project dependencies
├── tsconfig.json             # TypeScript configuration
└── vitest.config.ts          # Test configuration
```

## Build And Test Commands

| Command | Description |
|---------|-------------|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Build development version (all browsers) |
| `pnpm dev chrome` | Build dev version for Chrome only |
| `pnpm beta` | Build beta version |
| `pnpm release` | Build release version |
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm lint` | Run ESLint + TypeScript type checking |
| `pnpm check-types` | TypeScript type checking only |
| `pnpm compile-proto` | Compile protobuf schemas |
| `pnpm bundle-size check <env> [browser]` | Check bundle sizes |

Build outputs go to `build/<env>/<browser>/`.

## Contribution Instructions

### Package Manager

Use **pnpm** exclusively. Do not use npm, yarn, or any other package manager.

- `pnpm install` — install dependencies
- `pnpm add <package>` — add a dependency
- `pnpm add -D <package>` — add a dev dependency
- Lock file: `pnpm-lock.yaml`

### Before Committing

1. Run `pnpm lint` — must pass with no errors
2. Run `pnpm test` — all tests must pass
3. Run `pnpm check-types` — no type errors

### Environment Setup

See [DEVELOPMENT.md](DEVELOPMENT.md#3-configure-environment-variables) for detailed
setup instructions.

## Code Guidelines

### Architecture

The extension has three isolated contexts that produce separate bundles:

- **background/** — Service worker (runs persistently)
- **popup/** — Browser action popup UI
- **options/** — Full-page settings UI

**Import rules:**
- Never import from `background/` into `popup/` or `options/` (or vice versa)
- Never import between `popup/` and `options/`
- Shared code must live in `common/` — this reduces duplicate code in bundles
- Each context communicates via message passing (`messenger.ts`)

Violating these rules increases bundle sizes and may cause runtime errors.

### JSDoc Style

Always use multiline JSDoc block comments, even for single-line descriptions:

```typescript
/**
 * Description here.
 */
```

Do **not** use single-line JSDoc:

```typescript
/** Description here. */
```

### JSDoc Tag Descriptions

Do **not** use a hyphen (`-`) between the tag name/parameter and its description.
Use a plain space instead.

Correct:

```typescript
/**
 * @param key Translation message key.
 * @returns Translated message.
 */
```

Incorrect:

```typescript
/**
 * @param key - Translation message key.
 * @returns - Translated message.
 */
```

### JSDoc Type Annotations

Do **not** add type annotations in JSDoc tags (`@param`, `@returns`, `@throws`,
etc.) since TypeScript provides its own type system.

Correct:

```typescript
/**
 * @param key Translation message key.
 * @returns Translated message.
 * @throws If the key does not exist.
 */
```

Incorrect:

```typescript
/**
 * @param {string} key Translation message key.
 * @returns {string} Translated message.
 * @throws {Error} If the key does not exist.
 */
```

### JSDoc Documentation

- All exported constants, types, interfaces, and enums must have JSDoc (if purpose not obvious from name)
- Type/interface properties and enum values need JSDoc only if purpose not obvious from name

### TypeScript Strictness

Never use `any`. Use precise types, generics, `unknown`, or `@ts-expect-error`
(with a comment) when dealing with intentionally invalid values in tests.

### Import Order

ESLint enforces import ordering:
1. Built-in modules
2. External packages (React first, then `@adguard/*`)
3. Internal modules
4. Parent/sibling imports
5. Styles (`.pcss` files last)

### Code Style

- 4-space indentation
- 120 character max line length
- Use type imports: `import { type Foo } from './foo'`
- Logger calls must include context tag (enforced by ESLint)

### Class Members

All class methods and properties must have explicit access modifiers:

- Use `private` for internal implementation details
- Use `public` for public API
- Use `protected` for methods accessible in subclasses

### Naming Conventions

- Include units in constant names: `_PX` for pixels, `_MS` for milliseconds, `_PCT` for percentages (e.g., `ITEM_HEIGHT_PX`, `TIMEOUT_MS`, `OPACITY_PCT`)

### Constants and Magic Numbers

- All numeric constants must be extracted to named constants
- All string literals must be extracted to constants or enums (no hardcoded strings)
- No duplicate constants across files — extract to shared constants file

### Type Assertions

- Avoid `as` type assertions. Use proper typing instead.
- In tests, `as` is allowed when necessary, but prefer proper typing when possible.

### Localization

- Numbers in translations must be extracted to code constants
- If translation contains number with text (e.g., `"Watch from 80+ locations"`) — extract number to constant and use placeholder (e.g., `"Watch from %count%+ locations"`)
- No line separator character (U+2028) in translations — use `<br/>` tag or separate translation keys
- Non-breaking space (U+00A0) can be used where semantically needed

### CSS/PCSS Guidelines

- Use CSS variables for colors (no hardcoded `#fff`, `rgb()`, `rgba()`)
- Use CSS variables for `z-index` values (no hardcoded `z-index: 1`, `z-index: 25`)
- Use `@custom-media` from `media.pcss` for media queries (no hardcoded `@media (max-width: 640px)`)
- All CSS variables and `@custom-media` must exist in the project before use

### SVG Icons

- SVG icons must not contain hardcoded colors (e.g., `stroke="#74a352"`, `fill="#fff"`)
- Use `stroke="currentColor"` or `fill="currentColor"` instead
- Icon color should be set via CSS class using CSS variables

### React Components

- One component per file
- Use simple string for static classes: `className="class1 class2"`
- Use `cn()` only for dynamic classes: `className={cn("class1", variable)}`
- Single attribute tags on one line: `<td className="...">`
- Multiple attributes on separate lines
- No useless checks (e.g., `typeof window === 'undefined'` in browser extension)

### Code Readability

- Use guard clauses and prefer early returns to reduce nesting
- Extract complex ternaries with objects to variables

### File Hygiene

- No commented-out code
- Opening block comments must have closing comments (e.g., `{/* start */}` ... `{/* end */}`)
