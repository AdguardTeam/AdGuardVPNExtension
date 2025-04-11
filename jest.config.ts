module.exports = {
    verbose: true,
    testEnvironment: '<rootDir>/tests/custom-test-env.ts',
    collectCoverage: true,
    collectCoverageFrom: [
        '**/src/background/**/*.{js,jsx}',
        '**/src/common/**/*.{js,jsx}',
        '!**/node_modules/**',
    ],
    setupFiles: ['<rootDir>/tests/__setups__/chrome.ts'],
    setupFilesAfterEnv: ['<rootDir>/tests/__setups__/jest-setup.ts'],
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/tests/__mocks__/fileMock.ts',
        '\\.(css|less|pcss)$': '<rootDir>/tests/__mocks__/styleMock.ts',
    },
    transform: {
        '^.+\\.(t|j)sx?$': '@swc/jest',
    },
    transformIgnorePatterns: [
        // We should ignore packages from:
        // - node_modules
        // - node_modules/.pnpm
        // - node_modules/.pnpm/node_modules
        // - node_modules/.pnpm/<pnpm-generated-folder>/node_modules

        // eslint-disable-next-line max-len
        '<rootDir>/node_modules/(?!(?:.pnpm(?:/(?:[^/]+)?/node_modules/)?)?(is-ip|ip-regex|@vespaiach/axios-fetch-adapter))',
    ],
};
