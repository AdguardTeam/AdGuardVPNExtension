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

## JSDoc Tag Descriptions

Do **not** use a hyphen (`-`) between the tag name/parameter and its description. Use a plain space instead.

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

## JSDoc Type Annotations

Do **not** add type annotations in JSDoc tags (`@param`, `@returns`, `@throws`, etc.) since TypeScript provides its own type system.

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

## TypeScript Strictness

Never use `any`. Use precise types, generics, `unknown`, or `@ts-expect-error` (with a comment) when dealing with intentionally invalid values in tests.
