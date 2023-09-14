const postcssPresetEnv = require('postcss-preset-env');

module.exports = {
    plugins: [
        'postcss-import',
        'postcss-nested', // should go before postcssPresetEnv with nesting-rules enabled
        [postcssPresetEnv, { stage: 3, features: { 'nesting-rules': true } }],
        'postcss-svg',
    ],
};
