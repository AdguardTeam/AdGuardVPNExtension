module.exports = {
    extends: '../.eslintrc.js',
    parserOptions: {
        project: [require.resolve('../tsconfig.eslint.json')],
    },
    ignorePatterns: ['.eslintrc.js'],
    rules: {
        '@typescript-eslint/explicit-function-return-type': [
            'error',
            {
                // to not enforce it for cases like this -> useEffect(() => {})
                allowHigherOrderFunctions: true,
            },
        ],
        "jsdoc/require-returns": ['error', {
            checkGetters: false,
            // Added react components to exclusions
            contexts: [
                'ArrowFunctionExpression:not(:has(TSTypeAnnotation TSTypeReference Identifier[name="ReactElement"]))',
                'FunctionDeclaration:not(:has(TSTypeAnnotation TSTypeReference Identifier[name="ReactElement"]))',
            ]
        }]
    },
};
