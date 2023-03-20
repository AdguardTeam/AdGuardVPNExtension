import { AppStatus } from '../../../src/background/appStatus/AppStatus';
import { LEVELS_OF_CONTROL } from '../../../src/background/proxy/proxyConsts';
import { ExtensionProxyInterface } from '../../../src/background/proxy/proxy';
import { CanControlProxy } from '../../../src/background/proxy/schema';
import { SettingsInterface } from '../../../src/background/settings/settings';

const buildProxy = (response: CanControlProxy): { canControlProxy: () => Promise<CanControlProxy> } => {
    return {
        canControlProxy: async () => {
            return response;
        },
    };
};

const buildSettings = (proxyEnabled: boolean): SettingsInterface => {
    return {
        isProxyEnabled: () => {
            return proxyEnabled;
        },
        // @ts-ignore
        disableProxy: jest.fn(() => {
        }),
    };
};

const actualVersion = '0.5.0';

describe('app status', () => {
    it('returns correct version', () => {
        const canControlProxy = {
            canControlProxy: false,
            cause: LEVELS_OF_CONTROL.NOT_CONTROLLABLE,
        };
        const proxy = buildProxy(canControlProxy);
        const settings = buildSettings(true);
        const appStatus = new AppStatus(proxy as ExtensionProxyInterface, settings, actualVersion);
        expect(appStatus.version).toBe(actualVersion);
    });

    it('checks if extension can control proxy', async () => {
        const canControlResponse = { canControlProxy: true };
        const proxy = buildProxy(canControlResponse);
        const settings = buildSettings(true);
        const appStatus = new AppStatus(proxy as ExtensionProxyInterface, settings, actualVersion);
        expect(await appStatus.canControlProxy()).toEqual(canControlResponse);
    });

    it('if extension can not control proxy, than turn proxy down if it was enabled', async () => {
        const canControlResponse = {
            canControlProxy: false,
            cause: LEVELS_OF_CONTROL.CONTROLLED_BY_OTHER_EXTENSION,
        };
        const proxy = buildProxy(canControlResponse);
        const settings = buildSettings(true);
        const appStatus = new AppStatus(proxy as ExtensionProxyInterface, settings, actualVersion);
        expect(await appStatus.canControlProxy()).toEqual(canControlResponse);
        expect(settings.disableProxy).toHaveBeenCalledTimes(1);
    });

    it('if extension can not control proxy, than do not turn proxy down if it was disabled', async () => {
        const canControlResponse = {
            canControlProxy: false,
            cause: LEVELS_OF_CONTROL.CONTROLLED_BY_OTHER_EXTENSION,
        };
        const proxy = buildProxy(canControlResponse);
        const settings = buildSettings(false);
        const appStatus = new AppStatus(proxy as ExtensionProxyInterface, settings, actualVersion);
        expect(await appStatus.canControlProxy()).toEqual(canControlResponse);
        expect(settings.disableProxy).toHaveBeenCalledTimes(0);
    });
});
