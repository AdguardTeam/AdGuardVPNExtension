const postcssPresetEnv = require('postcss-preset-env');
const postcssGlobalData = require('@csstools/postcss-global-data');

module.exports = {
    plugins: [
        // should go before postcss-custom-media to correct inject media rules
        postcssGlobalData({ files: ['./src/common/styles/media.pcss'] }),
        'postcss-import',
        // should go before postcssPresetEnv with nesting-rules enabled
        'postcss-nested',
        [postcssPresetEnv, { stage: 3, features: { 'nesting-rules': true } }],
        'postcss-custom-media',
    ],
};
