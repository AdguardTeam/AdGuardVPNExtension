module.exports = {
    verbose: true,
    collectCoverage: true,
    collectCoverageFrom: [
        '**/src/background/**/*.{js,jsx}',
        '**/src/lib/**/*.{js,jsx}',
        '!**/node_modules/**',
    ],
};
