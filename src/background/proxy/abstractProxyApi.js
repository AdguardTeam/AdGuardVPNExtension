const errorFunction = () => {
    throw new Error('Seems like webpack didn\'t inject proper proxy api');
};

/**
 * This module used only to show api interface
 * export './abstractProxyApi' is replaced during webpack compilation
 * with NormalModuleReplacementPlugin to proper browser implementation
 * from './firefox/proxyApi' or ./chrome/proxyApi
 */
const abstractProxyApi = (() => {
    return {
        proxyGet: errorFunction,
        proxySet: errorFunction,
        onProxyError: {
            addListener: errorFunction,
            removeListener: errorFunction,
        },
    };
})();

export default abstractProxyApi;
