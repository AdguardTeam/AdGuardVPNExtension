import { ExtensionProxyInterface, CanControlProxy } from '../proxy/proxy';
import { SettingsInterface } from '../settings/settings';

export class AppStatus {
    appVersion: string;

    proxy: ExtensionProxyInterface;

    settings: SettingsInterface;

    constructor(proxy: ExtensionProxyInterface, settings: SettingsInterface, version: string) {
        this.appVersion = version;
        this.proxy = proxy;
        this.settings = settings;
    }

    async canControlProxy(): Promise<CanControlProxy> {
        const controlStatus = await this.proxy.canControlProxy();
        if (controlStatus.canControlProxy) {
            return controlStatus;
        }

        // Turns off proxy if proxy is enabled while extension can't control it
        const proxyEnabled = this.settings.isProxyEnabled();
        if (proxyEnabled) {
            await this.settings.disableProxy();
        }

        return controlStatus;
    }

    get version(): string {
        return this.appVersion;
    }
}
