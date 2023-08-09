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
    BUILD_ENV,
    BUILD_PATH,
    Browser,
} from './consts';

const { getOutputPathByEnv, updateLocalesMSGName, modifyExtensionName } = require('./helpers');

const BACKGROUND_PATH = path.resolve(__dirname, SRC_PATH, 'background');
const OPTIONS_PATH = path.resolve(__dirname, SRC_PATH, 'options');
const POPUP_PATH = path.resolve(__dirname, SRC_PATH, 'popup');
const AUTH_SCRIPT = path.resolve(__dirname, SRC_PATH, 'content-scripts/auth.ts');
const THANKYOU_PAGE_AUTH_SCRIPT = path.resolve(__dirname, SRC_PATH, 'content-scripts/thankYouPageAuth.ts');
const CUSTOM_DNS_LINKS_SCRIPT = path.resolve(__dirname, SRC_PATH, 'content-scripts/custom-dns-links.ts');
const PRELOAD_THEME_SCRIPT = path.resolve(__dirname, SRC_PATH, 'options/preloadTheme.ts');
const EXPORT_PATH = path.resolve(__dirname, SRC_PATH, 'export');

const OUTPUT_PATH = getOutputPathByEnv(BUILD_ENV);

const EN_MESSAGES_PATH = '/en/messages.json';

const packageJson = require('../package.json');

// this options needed to exclude clean static files in the watch mode
const cleanOptions = IS_DEV ? { cleanAfterEveryBuildPatterns: ['!**/*.json', '!assets/**/*'] } : {};

export const getCommonConfig = (browser: string): webpack.Configuration => {
    return {
        mode: IS_DEV ? 'development' : 'production',
        // we don't use eval source maps because of CSP in MV3
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
            thankYouPageAuth: THANKYOU_PAGE_AUTH_SCRIPT,
            'custom-dns-links': CUSTOM_DNS_LINKS_SCRIPT,
            preloadTheme: PRELOAD_THEME_SCRIPT,
            export: EXPORT_PATH,
        },
        output: {
            path: path.resolve(__dirname, BUILD_PATH, OUTPUT_PATH),
            filename: '[name].js',
        },
        resolve: {
            extensions: ['.*', '.js', '.jsx', '.ts', '.tsx'],
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
                        filename: 'assets/[name][ext]',
                    },
                },
            ],
        },
        plugins: [
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
                    || browser === Browser.ChromeMV2
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
            new webpack.NormalModuleReplacementPlugin(/\.\/stateStorage\.abstract/, ((resource: any) => {
                if (browser === Browser.Chrome) {
                    // eslint-disable-next-line no-param-reassign
                    resource.request = resource.request.replace(/\.\/stateStorage\.abstract/, './mv3');
                } else {
                    // eslint-disable-next-line no-param-reassign
                    resource.request = resource.request.replace(/\.\/stateStorage\.abstract/, './mv2');
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
                        from: 'assets/',
                        to: 'assets/',
                    },
                    {
                        context: 'src',
                        from: '_locales/',
                        to: '_locales/',
                        transform: (content: Buffer, path: string) => {
                            const updateLocales = updateLocalesMSGName(
                                content,
                                process.env.BUILD_ENV,
                            );
                            return modifyExtensionName(
                                updateLocales,
                                process.env.BUILD_ENV,
                                ' for Chrome',
                                (browser === Browser.Chrome || browser === Browser.ChromeMV2)
                                    && path.includes(EN_MESSAGES_PATH),
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
                fileName: 'build.txt',
                content: `version=${packageJson.version}`,
            }),
        ],
    };
};
