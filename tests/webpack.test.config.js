const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    mode: 'production',
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
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin([
            {
                from: 'node_modules/qunit/qunit/qunit.js',
                to: '.',
            },
            {
                from: 'node_modules/qunit/qunit/qunit.css',
                to: '.',
            },
        ]),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'index.html'),
        }),
    ],
};
