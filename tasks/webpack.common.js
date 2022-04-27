const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CreateFileWebpack = require('create-file-webpack');

const { genAppConfig } = require('./appConfig');
const {
    SRC_PATH,
    IS_DEV,
    BUILD_ENV,
    BUILD_PATH,
} = require('./consts');
const { getOutputPathByEnv, updateLocalesMSGName } = require('./helpers');

const BACKGROUND_PATH = path.resolve(__dirname, SRC_PATH, 'background');
const OPTIONS_PATH = path.resolve(__dirname, SRC_PATH, 'options');
const POPUP_PATH = path.resolve(__dirname, SRC_PATH, 'popup');
const AUTH_SCRIPT = path.resolve(__dirname, SRC_PATH, 'content-scripts/auth.js');

const OUTPUT_PATH = getOutputPathByEnv(BUILD_ENV);

const packageJson = require('../package.json');

// this options needed to exclude clean static files in the watch mode
const cleanOptions = IS_DEV ? { cleanAfterEveryBuildPatterns: ['!**/*.json', '!assets/**/*'] } : {};

const config = {
    mode: IS_DEV ? 'development' : 'production',
    devtool: IS_DEV ? 'eval-source-map' : false,
    optimization: {
        minimize: false,
    },
    entry: {
        background: BACKGROUND_PATH,
        options: OPTIONS_PATH,
        popup: POPUP_PATH,
        auth: AUTH_SCRIPT,
    },
    output: {
        path: path.resolve(__dirname, BUILD_PATH, OUTPUT_PATH),
        filename: '[name].js',
    },
    resolve: {
        extensions: ['*', '.js', '.jsx', '.ts', '.tsx'],
    },

    module: {
        rules: [
            {
                test: /\.(ts|js)x?$/,
                exclude: /node_modules/,
                use: ['cache-loader', { loader: 'babel-loader', options: { babelrc: true } }],
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
                                compileType: 'module',
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
                use: [
                    { loader: 'file-loader', options: { outputPath: 'assets' } },
                ],
            },
        ],
    },
    plugins: [
        // Define environment for choosing appropriate api urls
        new webpack.DefinePlugin({
            __APP_CONFIG__: JSON.stringify(genAppConfig(
                process.env.BROWSER,
                process.env.STAGE_ENV,
                process.env.BUILD_ENV,
            )),
        }),
        new webpack.NormalModuleReplacementPlugin(/\.\/abstractProxyApi/, ((resource) => {
            if (process.env.BROWSER === 'firefox') {
                // eslint-disable-next-line no-param-reassign
                resource.request = resource.request.replace(/\.\/abstractProxyApi/, './firefox/proxyApi');
            } else if (process.env.BROWSER === 'chrome' || process.env.BROWSER === 'edge' || process.env.BROWSER === 'opera') {
                // eslint-disable-next-line no-param-reassign
                resource.request = resource.request.replace(/\.\/abstractProxyApi/, './chrome/proxyApi');
            } else {
                throw new Error(`There is no proxy api for browser: ${process.env.BROWSER}`);
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
                    transform: (content) => {
                        return updateLocalesMSGName(
                            content,
                            process.env.BUILD_ENV,
                        );
                    },
                },
            ],
        }),
        new HtmlWebpackPlugin({
            template: path.join(BACKGROUND_PATH, 'index.html'),
            filename: 'background.html',
            chunks: ['background'],
            cache: false,
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
        new CreateFileWebpack({
            path: path.resolve(__dirname, BUILD_PATH, OUTPUT_PATH),
            fileName: 'build.txt',
            content: `version=${packageJson.version}`,
        }),
    ],
};

module.exports = config;
