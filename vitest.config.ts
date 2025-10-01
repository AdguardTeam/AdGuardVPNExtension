import path from 'node:path';

import { defineConfig } from 'vitest/config';

/**
 * Assets extensions RegExp.
 */
const RE_ASSET_EXTENSIONS = /\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$/;

/**
 * Styles extensions RegExp.
 */
const RE_STYLE_EXTENSIONS = /\.(css|less|pcss|sass|scss)$/;

export default defineConfig({
    test: {
        environment: 'jsdom',
        setupFiles: [
            './tests/__setups__/mocks.ts',
            './tests/__setups__/chrome.ts',
        ],
    },
    plugins: [{
        name: 'mock-assets-imports',
        enforce: 'pre',
        resolveId(source: string) {
            if (RE_ASSET_EXTENSIONS.test(source)) {
                return path.resolve(__dirname, 'tests/__mocks__/fileMock.ts');
            }

            if (RE_STYLE_EXTENSIONS.test(source)) {
                return path.resolve(__dirname, 'tests/__mocks__/styleMock.ts');
            }

            return null;
        },
    }],
});
