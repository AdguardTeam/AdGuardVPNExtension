module.exports = (api) => {
    api.cache(false);
    return {
        presets: [['@babel/preset-env', {
            targets: {
                chrome: '55',
                ie: '15',
                firefox: '52',
                opera: '42',
            },
        }], '@babel/preset-react'],
        plugins: [
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-transform-runtime',
            '@babel/plugin-syntax-dynamic-import',
        ],
    };
};
