const postcssPresetEnv = require('postcss-preset-env');

module.exports = {
    plugins: [
        ['postcss-import', {}],
        [postcssPresetEnv, { stage: 3, features: { 'nesting-rules': true } }],
        ['postcss-svg', {}],
        ['postcss-nested', {}],
    ],
};
