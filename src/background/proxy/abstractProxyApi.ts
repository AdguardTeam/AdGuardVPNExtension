import browser, { Proxy } from 'webextension-polyfill';

import { ProxyConfigInterface } from '../schema';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorFunction = (arg?: unknown) => {
    throw new Error('Seems like webpack didn\'t inject proper proxy api');
};

/**
 * ProxyErrorCallback interface is used to define the structure of a function
 * that takes in details of type Proxy.OnErrorErrorType and does not return anything.
 */
export interface ProxyErrorCallback {
    (details: Proxy.OnErrorErrorType): void;
}

export interface ProxyApiInterface {
    proxySet: (proxyConfig: ProxyConfigInterface) => Promise<void>;
    proxyGet: (config?: {}) => Promise<browser.Types.SettingGetCallbackDetailsType>;
    proxyClear: () => void;
    onProxyError: {
        removeListener: (cb: any) => void;
        addListener: (cb: any) => void
    };
    init: () => void;
}

/**
 * This module used only to show api interface
 * export './abstractProxyApi' is replaced during webpack compilation
 * with NormalModuleReplacementPlugin to proper browser implementation
 * from './firefox/proxyApi' or ./chrome/proxyApi
 */
class AbstractProxyApi implements ProxyApiInterface {
    public proxyGet = errorFunction;

    public proxySet = errorFunction;

    public proxyClear = errorFunction;

    public onProxyError = {
        addListener: errorFunction,
        removeListener: errorFunction,
    };

    public init = errorFunction;
}

const proxyApi = new AbstractProxyApi();

export { proxyApi };
