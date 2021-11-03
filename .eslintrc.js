module.exports = {
    parser: 'babel-eslint',
    extends: [
        'airbnb',
        'plugin:react/recommended',
    ],
    plugins: ['react'],
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
    },
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
                extensions: ['.js', '.jsx', '.ts', '.json'],
            },
        },
    },
    rules: {
        'no-shadow': 'off',
        'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
        'import/no-extraneous-dependencies': 0,
        indent: ['error', 4, { SwitchCase: 1 }],
        'react/jsx-indent': 'off',
        'react/jsx-indent-props': 'off',
        'no-underscore-dangle': 'off',
        'react/destructuring-assignment': [
            'error',
            'always',
            {
                ignoreClassFields: true,
            },
        ],
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
        'react/prop-types': 'off', // TODO remove this rule when app will grow bigger
        'class-methods-use-this': 'off',
        'import/prefer-default-export': 'off',
        'arrow-body-style': 'off',
        'react/display-name': 'off',
        'import/extensions': [
            'error',
            'ignorePackages',
            {
                js: 'never',
                jsx: 'never',
                ts: 'never',
            },
        ],
    },
};
