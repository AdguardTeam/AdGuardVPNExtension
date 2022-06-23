// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorFunction = (arg?: any) => {
    throw new Error('Seems like webpack didn\'t inject proper proxy api');
};

/**
 * This module used only to show api interface
 * export './abstractProxyApi' is replaced during webpack compilation
 * with NormalModuleReplacementPlugin to proper browser implementation
 * from './firefox/proxyApi' or ./chrome/proxyApi
 */
export const proxyApi = (() => {
    return {
        proxyGet: errorFunction,
        proxySet: errorFunction,
        proxyClear: errorFunction,
        clearAuthCache: errorFunction,
        onProxyError: {
            addListener: errorFunction,
            removeListener: errorFunction,
        },
    };
})();
