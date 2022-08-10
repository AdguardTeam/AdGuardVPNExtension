export interface AccessCredentials {
    username: string,
    password: string,
}

export interface ConfigData {
    bypassList: string[];
    defaultExclusions: string[];
    nonRoutableCidrNets: string[];
    host: string;
    port: number;
    scheme: string;
    inverted: boolean;
    credentials: AccessCredentials,
}

export interface ProxyApiInterface {
    proxySet(config: ConfigData): Promise<void>;
    proxyGet(config?: ConfigData): Promise<chrome.types.ChromeSettingGetResultDetails>;
    proxyClear(): Promise<void>;
    onProxyError: {
        addListener: (cb: (details: any) => void) => void,
        removeListener: (cb: (details: any) => void) => void,
    };
}
