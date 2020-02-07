export default class AppStatus {
    constructor(proxy, settings, packageJson) {
        this.appVersion = packageJson.version;
        this.proxy = proxy;
        this.settings = settings;
    }

    async canControlProxy() {
        const controlStatus = await this.proxy.canControlProxy();
        if (controlStatus.canControlProxy) {
            return controlStatus;
        }

        // Turns off proxy if proxy is enabled while extension can't control it
        const proxyEnabled = await this.settings.isProxyEnabled();
        if (proxyEnabled) {
            await this.settings.disableProxy();
        }

        return controlStatus;
    }

    get version() {
        return this.appVersion;
    }
}
