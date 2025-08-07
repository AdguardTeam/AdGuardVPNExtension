import path from 'path';

import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
// TODO remove @ts-ignore
// @ts-ignore
import CreateFileWebpack from 'create-file-webpack';

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
    modifyExtensionName,
    updateOperaShortNameKey,
} = require('./helpers');

const BACKGROUND_PATH = path.resolve(__dirname, SRC_PATH, 'background');
const OPTIONS_PATH = path.resolve(__dirname, SRC_PATH, 'options');
const POPUP_PATH = path.resolve(__dirname, SRC_PATH, 'popup');
const AUTH_SCRIPT = path.resolve(__dirname, SRC_PATH, 'content-scripts/auth.ts');
const CUSTOM_DNS_LINKS_SCRIPT = path.resolve(__dirname, SRC_PATH, 'content-scripts/custom-dns-links.ts');
const PRELOAD_THEME_SCRIPT = path.resolve(__dirname, SRC_PATH, 'common/preloadTheme.ts');
const EXPORT_PATH = path.resolve(__dirname, SRC_PATH, 'export');

const OUTPUT_PATH = getOutputPathByEnv(BUILD_ENV);

const EN_MESSAGES_PATH = '/en/messages.json';

const BUILD_TXT_FILENAME = 'build.txt';
const BUILD_TXT_CONTENT = IS_BETA
    // required for proper github tag preparing. AG-27644
    ? `version=${packageJson.version}-beta`
    : `version=${packageJson.version}`;

// this options needed to exclude clean static files in the watch mode
const cleanOptions = IS_DEV ? { cleanAfterEveryBuildPatterns: ['!**/*.json', '!assets/**/*'] } : {};

export const getCommonConfig = (browser: string): webpack.Configuration => {
    return {
        mode: IS_DEV ? 'development' : 'production',
        // we don't use eval source maps because of CSP
        devtool: IS_DEV ? 'inline-source-map' : false,
        optimization: {
            minimize: false,
        },
        cache: true,
        entry: {
            background: BACKGROUND_PATH,
            options: OPTIONS_PATH,
            popup: POPUP_PATH,
            auth: AUTH_SCRIPT,
            'custom-dns-links': CUSTOM_DNS_LINKS_SCRIPT,
            preloadTheme: PRELOAD_THEME_SCRIPT,
            export: EXPORT_PATH,
        },
        output: {
            path: path.resolve(__dirname, BUILD_PATH, OUTPUT_PATH),
            filename: '[name].js',
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
                 * As a result, Webpack may fail to resolve these "nested" dependencies in pnpm's setup,
                 * since they are not in the root `node_modules`.
                 * To ensure Webpack can locate dependencies correctly in a pnpm project,
                 * we add `node_modules/.pnpm/node_modules` to the module resolution path as a fallback.
                 */
                'node_modules/.pnpm/node_modules',
            ],
            extensions: ['.*', '.js', '.jsx', '.ts', '.tsx'],
            // pnpm uses symlinks to manage dependencies, so we need to resolve them
            symlinks: true,
            fallback: {
                buffer: require.resolve('buffer'),
            },
        },

        module: {
            rules: [
                /*
                 * Prevent browser console warnings with source map issue
                 * by deleting source map url comments in production build
                 */
                {
                    test: /\.(ts|js)x?$/,
                    enforce: 'pre',
                    use: [
                        {
                            loader: 'source-map-loader',
                            options: {
                                filterSourceMappingUrl: () => (IS_DEV ? 'skip' : 'remove'),
                            },
                        },
                    ],
                },
                {
                    test: /\.(ts|js)x?$/,
                    exclude: /node_modules/,
                    use: [{ loader: 'babel-loader', options: { babelrc: true } }],
                },
                {
                    test: /\.(css|pcss)$/,
                    exclude: /node_modules/,
                    use: [
                        'style-loader',
                        {
                            loader: 'css-loader',
                            options: {
                                importLoaders: 1,
                                modules: {
                                    mode: 'local',
                                    auto: true,
                                    exportGlobals: false,
                                    localIdentName: IS_DEV ? '[path][name]__[local]--[hash:base64:5]' : '[hash:base64]',
                                    exportLocalsConvention: 'camelCaseOnly',
                                    exportOnlyLocals: false,
                                },
                            },
                        },
                        'postcss-loader',
                    ],
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
            new webpack.ProvidePlugin({
                process: 'process/browser',
                Buffer: ['buffer', 'Buffer'],
            }),
            // Define environment for choosing appropriate api urls
            new webpack.DefinePlugin({
                __APP_CONFIG__: JSON.stringify(genAppConfig(
                    browser,
                    process.env.STAGE_ENV,
                    process.env.BUILD_ENV,
                )),
            }),
            new webpack.NormalModuleReplacementPlugin(/\.\/(proxy\/)?abstractProxyApi/, ((resource: any) => {
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
            new webpack.NormalModuleReplacementPlugin(/\.\/AbstractTimers/, ((resource: any) => {
                if (browser !== Browser.Firefox) {
                    // TODO remove this replacement when Chromium based MV3 will fix alarms bug,
                    //  https://github.com/AdguardTeam/AdGuardVPNExtension/issues/116
                    //  https://bugs.chromium.org/p/chromium/issues/detail?id=1472759
                    // eslint-disable-next-line no-param-reassign
                    resource.request = resource.request.replace(/\.\/AbstractTimers/, './Mv2Timers');
                } else {
                    // eslint-disable-next-line no-param-reassign
                    resource.request = resource.request.replace(/\.\/AbstractTimers/, './Mv3Timers');
                }
            })),
            new CleanWebpackPlugin(cleanOptions),
            new CopyWebpackPlugin({
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
                        transform: (content: Buffer, path: string) => {
                            let updateLocales = updateLocalesMSGName(
                                content,
                                process.env.BUILD_ENV,
                            );

                            // TODO: Remove after Opera Add-Ons store fixes the issue (AG-44559)
                            updateLocales = updateOperaShortNameKey(updateLocales, browser);

                            return modifyExtensionName(
                                updateLocales,
                                process.env.BUILD_ENV,
                                ' for Chrome',
                                browser === Browser.Chrome && path.includes(EN_MESSAGES_PATH),
                            );
                        },
                    },
                ],
            }),
            new HtmlWebpackPlugin({
                template: path.join(OPTIONS_PATH, 'index.html'),
                filename: 'options.html',
                chunks: ['options'],
                cache: false,
            }),
            new HtmlWebpackPlugin({
                template: path.join(POPUP_PATH, 'index.html'),
                filename: 'popup.html',
                chunks: ['popup'],
                cache: false,
            }),
            new HtmlWebpackPlugin({
                template: path.join(EXPORT_PATH, 'index.html'),
                filename: 'export.html',
                chunks: ['export'],
                cache: false,
            }),
            new CreateFileWebpack({
                path: path.resolve(__dirname, BUILD_PATH, OUTPUT_PATH),
                fileName: BUILD_TXT_FILENAME,
                content: BUILD_TXT_CONTENT,
            }),
        ],
    };
};
