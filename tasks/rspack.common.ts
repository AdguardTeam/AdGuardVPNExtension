import path from 'path';

import { rspack, type Configuration } from '@rspack/core';

import { genAppConfig } from './appConfig';
import {
    SRC_PATH,
    IS_DEV,
    IS_BETA,
    BUILD_ENV,
    BUILD_PATH,
    Browser,
} from './consts';

const packageJson = require('../package.json');

const {
    getOutputPathByEnv,
    updateLocalesMSGName,
    updateOperaShortNameKey,
} = require('./helpers');

const BACKGROUND_PATH = path.resolve(__dirname, SRC_PATH, 'background');
const OPTIONS_PATH = path.resolve(__dirname, SRC_PATH, 'options');
const POPUP_PATH = path.resolve(__dirname, SRC_PATH, 'popup');
const CUSTOM_DNS_LINKS_SCRIPT = path.resolve(__dirname, SRC_PATH, 'content-scripts/custom-dns-links.ts');
const PRELOAD_THEME_SCRIPT = path.resolve(__dirname, SRC_PATH, 'common/preloadTheme.ts');
const EXPORT_PATH = path.resolve(__dirname, SRC_PATH, 'export');
const CONSENT_PATH = path.resolve(__dirname, SRC_PATH, 'consent');
const SUCCESS_AUTH_PATH = path.resolve(__dirname, SRC_PATH, 'success-auth');

const OUTPUT_PATH = getOutputPathByEnv(BUILD_ENV);

const BUILD_TXT_FILENAME = 'build.txt';
const BUILD_TXT_CONTENT = IS_BETA
    // required for proper github tag preparing. AG-27644
    ? `version=${packageJson.version}-beta`
    : `version=${packageJson.version}`;

export const getCommonConfig = (browser: string): Configuration => {
    return {
        mode: IS_DEV ? 'development' : 'production',
        // we don't use eval source maps because of CSP
        devtool: IS_DEV ? 'inline-source-map' : false,
        // Enable persistent caching for faster rebuilds
        cache: true,
        experiments: {
            // Enable native CSS handling (replaces css-loader/style-loader)
            css: true,
        },
        optimization: {
            minimize: false,
        },
        entry: {
            background: BACKGROUND_PATH,
            options: OPTIONS_PATH,
            popup: POPUP_PATH,
            'custom-dns-links': CUSTOM_DNS_LINKS_SCRIPT,
            preloadTheme: PRELOAD_THEME_SCRIPT,
            export: EXPORT_PATH,
            consent: CONSENT_PATH,
            'success-auth': SUCCESS_AUTH_PATH,
        },
        output: {
            path: path.resolve(__dirname, BUILD_PATH, OUTPUT_PATH),
            filename: '[name].js',
            // Don't clean in dev mode to preserve static files during watch rebuilds
            clean: !IS_DEV,
        },
        resolve: {
            modules: [
                'node_modules',
                /**
                 * By default, package managers like Yarn and NPM create a flat structure in the `node_modules` folder,
                 * placing all dependencies directly in the root `node_modules`.
                 * For instance, when we install `eslint-config-airbnb` in this project, both it and its dependency,
                 * `eslint-plugin-import`, are typically placed in the root `node_modules` folder.
                 *
                 * However, pnpm follows a different, nested structure where dependencies are stored
                 * under `node_modules/.pnpm/node_modules`.
                 * This structure helps reduce duplication but also means that dependencies of dependencies
                 * are not directly accessible in the root.
                 *
                 * As a result, Rspack may fail to resolve these "nested" dependencies in pnpm's setup,
                 * since they are not in the root `node_modules`.
                 * To ensure Rspack can locate dependencies correctly in a pnpm project,
                 * we add `node_modules/.pnpm/node_modules` to the module resolution path as a fallback.
                 */
                'node_modules/.pnpm/node_modules',
            ],
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
            symlinks: true,
            fallback: {
                buffer: require.resolve('buffer'),
                util: require.resolve('util/'),
                process: require.resolve('process/browser'),
            },
        },

        module: {
            rules: [
                {
                    test: /\.(ts|js)x?$/,
                    exclude: /node_modules/,
                    loader: 'builtin:swc-loader',
                    options: {
                        jsc: {
                            parser: {
                                syntax: 'typescript',
                                tsx: true,
                                decorators: true,
                            },
                            transform: {
                                legacyDecorator: true,
                                decoratorMetadata: true,
                                useDefineForClassFields: false,
                                react: {
                                    runtime: 'automatic',
                                },
                            },
                            target: 'es2015',
                        },
                    },
                    type: 'javascript/auto',
                },
                {
                    test: /\.(css|pcss)$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: 'postcss-loader',
                        },
                    ],
                    type: 'css/auto',
                    generator: {
                        localIdentName: IS_DEV ? '[local]--[hash:base64:5]' : '[hash:base64]',
                        exportsConvention: 'camel-case-only',
                    },
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'assets/fonts/[name][ext]',
                    },
                },
                {
                    test: /\.(svg|png)$/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'assets/images/[name][ext]',
                    },
                },
                {
                    test: /\.(webm)$/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'assets/videos/[name][ext]',
                    },
                },
            ],
        },
        plugins: [
            new rspack.ProvidePlugin({
                process: 'process/browser',
                Buffer: ['buffer', 'Buffer'],
            }),
            // Define environment for choosing appropriate api urls
            new rspack.DefinePlugin({
                __APP_CONFIG__: JSON.stringify(genAppConfig(
                    browser,
                    process.env.STAGE_ENV,
                    process.env.BUILD_ENV,
                )),
            }),
            new rspack.NormalModuleReplacementPlugin(/\.\/(proxy\/)?abstractProxyApi/, ((resource: any) => {
                if (browser === Browser.Firefox) {
                    // eslint-disable-next-line no-param-reassign
                    resource.request = resource.request
                        .replace(/\.\/abstractProxyApi/, './firefox/proxyApi')
                        .replace(/\.\/proxy\/abstractProxyApi/, './proxy/firefox/proxyApi');
                } else if (browser === Browser.Chrome
                    || browser === Browser.Edge
                    || browser === Browser.Opera) {
                    // eslint-disable-next-line no-param-reassign
                    resource.request = resource.request
                        .replace(/\.\/abstractProxyApi/, './chrome/proxyApi')
                        .replace(/\.\/proxy\/abstractProxyApi/, './proxy/chrome/proxyApi');
                } else {
                    throw new Error(`There is no proxy api for browser: ${browser}`);
                }
            })),
            // TODO remove this replacement when Chromium based MV3 will fix alarms bug,
            //  https://github.com/AdguardTeam/AdGuardVPNExtension/issues/116
            //  https://bugs.chromium.org/p/chromium/issues/detail?id=1472759
            new rspack.NormalModuleReplacementPlugin(/\.\/AbstractTimers/, ((resource: any) => {
                if (browser !== Browser.Firefox) {
                    // eslint-disable-next-line no-param-reassign
                    resource.request = resource.request.replace(/\.\/AbstractTimers/, './Mv2Timers');
                } else {
                    // eslint-disable-next-line no-param-reassign
                    resource.request = resource.request.replace(/\.\/AbstractTimers/, './Mv3Timers');
                }
            })),
            new rspack.CopyRspackPlugin({
                patterns: [
                    {
                        context: 'src',
                        from: 'PERMISSIONS.md',
                        to: 'PERMISSIONS.md',
                    },
                    {
                        context: 'src',
                        from: 'assets/images/flags',
                        to: 'assets/images/flags',
                    },
                    {
                        context: 'src',
                        from: 'assets/images/icons',
                        to: 'assets/images/icons',
                    },
                    {
                        context: 'src',
                        from: 'assets/prebuild-data',
                        to: 'assets/prebuild-data',
                    },
                    {
                        context: 'src',
                        from: '_locales/',
                        to: '_locales/',
                        transform: (content: Buffer) => {
                            let updateLocales = updateLocalesMSGName(
                                content,
                                process.env.BUILD_ENV,
                            );

                            // TODO: Remove after Opera Add-Ons store fixes the issue (AG-44559)
                            updateLocales = updateOperaShortNameKey(updateLocales, browser);

                            return updateLocales;
                        },
                    },
                    // Generate build.txt file
                    {
                        from: path.resolve(__dirname, 'manifest.common.json'),
                        to: BUILD_TXT_FILENAME,
                        transform: () => BUILD_TXT_CONTENT,
                    },
                ],
            }),
            new rspack.HtmlRspackPlugin({
                template: path.join(OPTIONS_PATH, 'index.html'),
                filename: 'options.html',
                chunks: ['options'],
                cache: false,
            }),
            new rspack.HtmlRspackPlugin({
                template: path.join(POPUP_PATH, 'index.html'),
                filename: 'popup.html',
                chunks: ['popup'],
                cache: false,
            }),
            new rspack.HtmlRspackPlugin({
                template: path.join(EXPORT_PATH, 'index.html'),
                filename: 'export.html',
                chunks: ['export'],
                cache: false,
            }),
            new rspack.HtmlRspackPlugin({
                template: path.join(CONSENT_PATH, 'index.html'),
                filename: 'consent.html',
                chunks: ['consent'],
                cache: false,
            }),
            new rspack.HtmlRspackPlugin({
                template: path.join(SUCCESS_AUTH_PATH, 'index.html'),
                filename: 'success-auth.html',
                chunks: ['success-auth'],
                cache: false,
            }),
        ],
    };
};
