module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
        'airbnb',
        'airbnb-typescript',
        'plugin:react/recommended',
    ],
    parserOptions: {
        project: ['tsconfig.eslint.json'],
        ecmaFeatures: {
            jsx: true,
        },
    },
    plugins: [
        'react',
        'import',
        'import-newlines',
    ],
    env: {
        browser: true,
        node: true,
        jest: true,
    },
    globals: {
        adguard: 'readonly',
    },
    settings: {
        react: {
            pragma: 'React',
            version: 'detect',
        },
        'import/resolver': {
            node: {
                extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
            },
        },
    },
    rules: {
        'import/order': [
            'error',
            {
                groups: [
                    'builtin',
                    'external',
                    'internal',
                    'parent',
                    'sibling',
                    'index',
                    'object',
                ],
                pathGroups: [
                    // Place all react libraries after external
                    {
                        pattern: '*react*',
                        group: 'external',
                        position: 'before',
                    },
                    // Place all our libraries after react-like
                    {
                        pattern: '@adguard/*',
                        group: 'external',
                        position: 'after',
                    },
                    // Separate group for all .pcss styles
                    {
                        pattern: '*.pcss',
                        group: 'object',
                        patternOptions: { matchBase: true },
                        position: 'after',
                    },
                ],
                pathGroupsExcludedImportTypes: ['builtin', 'react'],
                'newlines-between': 'always',
                // To include "side effect imports" in plugin checks
                // (like "import 'styles.pcss';")
                warnOnUnassignedImports: true,
            },
        ],
        'max-len': ['error', 120, 2, {
            ignoreUrls: true,
            ignoreComments: false,
            ignoreRegExpLiterals: true,
            ignoreStrings: true,
            ignoreTemplateLiterals: true,
        }],
        'no-shadow': 0,
        '@typescript-eslint/no-shadow': 0,
        '@typescript-eslint/consistent-type-imports': [
            'error',
            {
                prefer: 'type-imports',
                fixStyle: 'inline-type-imports',
            },
        ],
        'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
        'import/no-extraneous-dependencies': 0,
        // TODO: remove rule
        'import/no-cycle': 0,
        indent: ['error', 4, { SwitchCase: 1 }],
        'react/jsx-indent': 'off',
        'react/jsx-indent-props': 'off',
        '@typescript-eslint/indent': ['error', 4],
        'no-underscore-dangle': 'off',
        'react/destructuring-assignment': [
            'error',
            'always',
            {
                ignoreClassFields: true,
            },
        ],
        'react/function-component-definition': 0,
        'jsx-a11y/label-has-associated-control': [2, {
            labelComponents: ['label'],
            labelAttributes: ['htmlFor'],
            controlComponents: ['input'],
        }],
        'jsx-a11y/control-has-associated-label': [2, {
            ignoreElements: [
                'button',
                'input',
            ],
        }],
        'jsx-a11y/label-has-for': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
        'jsx-a11y/no-noninteractive-element-interactions': 'off',
        'jsx-a11y/anchor-is-valid': 'off',
        'jsx-a11y/no-static-element-interactions': 'off',
        // Since we do not use prop-types
        'react/prop-types': 'off',
        'react/require-default-props': 'off',
        'class-methods-use-this': 'off',
        'import/prefer-default-export': 'off',
        'arrow-body-style': 'off',
        'react/display-name': 'off',
        'import-newlines/enforce': ['error', { items: 3, 'max-len': 120 }],
        'import/extensions': [
            'error',
            'ignorePackages',
            {
                js: 'never',
                jsx: 'never',
                ts: 'never',
                tsx: 'never',
            },
        ],
    },
};
