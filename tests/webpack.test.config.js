const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const IS_DEV = process.env.NODE_ENV === 'development';
const cleanOptions = IS_DEV ? { cleanAfterEveryBuildPatterns: ['!qunit/**/*'] } : {};

module.exports = {
    mode: 'production',
    devtool: 'cheap-module-source-map',
    entry: path.resolve(__dirname, './index.test.js'),
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'bundle.test.js',
    },
    optimization: {
        minimize: false,
    },
    resolve: {
        extensions: ['*', '.js', '.jsx'],
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: { babelrc: true },
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(cleanOptions),
        new CopyWebpackPlugin([
            {
                from: 'node_modules/qunit/qunit/qunit.js',
                to: './qunit',
            },
            {
                from: 'node_modules/qunit/qunit/qunit.css',
                to: './qunit',
            },
        ]),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'index.html'),
        }),
    ],
};
