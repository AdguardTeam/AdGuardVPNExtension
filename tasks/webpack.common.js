const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { SRC_PATH } = require('./consts');
const { getOutputPathByEnv } = require('./helpers');

const BACKGROUND_PATH = path.resolve(__dirname, SRC_PATH, 'background');
const OPTIONS_PATH = path.resolve(__dirname, SRC_PATH, 'options');
const POPUP_PATH = path.resolve(__dirname, SRC_PATH, 'popup');
const AUTH_SCRIPT = path.resolve(__dirname, SRC_PATH, 'content-scripts/auth.js');

const IS_DEV = process.env.NODE_ENV === 'development';

const BUILD_PATH = '../build';
const OUTPUT_PATH = getOutputPathByEnv(process.env.NODE_ENV);

// this options needed to exclude clean static files in the watch mode
const cleanOptions = IS_DEV ? { cleanAfterEveryBuildPatterns: ['!**/*.json', '!assets/**/*'] } : {};

const config = {
    mode: IS_DEV ? 'development' : 'production',
    devtool: IS_DEV ? 'cheap-module-eval-source-map' : false,
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
        extensions: ['*', '.js', '.jsx'],
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: [{ loader: 'babel-loader', options: { babelrc: true } }, 'webpack-conditional-loader'],
            },
            {
                test: /\.(css|pcss)$/,
                exclude: /node_modules/,
                use: [
                    'style-loader',
                    { loader: 'css-loader', options: { importLoaders: 1 } },
                    'postcss-loader',
                ],
            },
            {
                test: /\.proto$/,
                exclude: /node_modules/,
                use: {
                    loader: path.resolve(__dirname, './loaders/protobuf-loader.js'), // TODO fork or copy this package and fix console.log and options issues
                },
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                use: [
                    'file-loader',
                ],
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(cleanOptions),
        new CopyWebpackPlugin([
            {
                context: 'src',
                from: 'assets/',
                to: 'assets/',
            },
            {
                context: 'src',
                from: '_locales/',
                to: '_locales/',
            },
        ]),
        new HtmlWebpackPlugin({
            template: path.join(BACKGROUND_PATH, 'index.html'),
            filename: 'background.html',
            chunks: ['background'],
        }),
        new HtmlWebpackPlugin({
            template: path.join(OPTIONS_PATH, 'index.html'),
            filename: 'options.html',
            chunks: ['options'],
        }),
        new HtmlWebpackPlugin({
            template: path.join(POPUP_PATH, 'index.html'),
            filename: 'popup.html',
            chunks: ['popup'],
        }),
    ],
};

module.exports = config;
