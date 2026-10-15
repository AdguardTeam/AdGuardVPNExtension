/**
 * Standalone ESLint config used only by the pre-commit type-assertion gate
 * (see .lintstagedrc.mjs). It is passed explicitly via --config and never
 * affects `pnpm lint` or CI.
 *
 * Keep the plugin list in sync with the root .eslintrc.js: files use inline
 * eslint-disable comments referencing these plugins, and an unloaded plugin
 * produces "Definition for rule X was not found" errors.
 */
module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
        'import',
        'react',
        'jsx-a11y',
        'react-hooks',
        'jsdoc',
        'import-newlines',
        '@adguard/logger-context',
    ],
    rules: {
        '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
    },
};
