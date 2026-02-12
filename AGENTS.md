# Project Instructions

## Package Manager

This project uses **pnpm** exclusively. Do not use npm, yarn, or any other package manager.

- `pnpm install` — install dependencies
- `pnpm add <package>` — add a dependency
- `pnpm add -D <package>` — add a dev dependency
- `pnpm run <script>` — run a script
- Lock file: `pnpm-lock.yaml` (not `package-lock.json` or `yarn.lock`)

## JSDoc Style

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