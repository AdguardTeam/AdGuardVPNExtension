module.exports = {
    verbose: true,
    testEnvironment: './tests/custom-test-env.js',
    collectCoverage: true,
    collectCoverageFrom: [
        '**/src/background/**/*.{js,jsx}',
        '**/src/lib/**/*.{js,jsx}',
        '!**/node_modules/**',
    ],
    setupFiles: ['./tests/__setups__/chrome.js'],
};
