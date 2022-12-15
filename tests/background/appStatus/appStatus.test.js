import { AppStatus } from '../../../src/background/appStatus/AppStatus';
import { LEVELS_OF_CONTROL } from '../../../src/background/proxy/proxyConsts';

const buildProxy = (response) => {
    return {
        canControlProxy: () => {
            return response;
        },
    };
};

const buildSettings = (proxyEnabled) => {
    return {
        isProxyEnabled: () => {
            return proxyEnabled;
        },
        disableProxy: jest.fn(() => {
        }),
    };
};

const actualVersion = '0.5.0';

describe('app status', () => {
    it('returns correct version', () => {
        const proxy = buildProxy();
        const settings = buildSettings();
        const appStatus = new AppStatus(proxy, settings, actualVersion);
        expect(appStatus.version).toBe(actualVersion);
    });

    it('checks if extension can control proxy', async () => {
        const canControlResponse = { canControlProxy: true };
        const proxy = buildProxy(canControlResponse);
        const settings = buildSettings();
        const appStatus = new AppStatus(proxy, settings, actualVersion);
        expect(await appStatus.canControlProxy()).toEqual(canControlResponse);
    });

    it('if extension can not control proxy, than turn proxy down if it was enabled', async () => {
        const canControlResponse = {
            canControlProxy: false,
            cause: LEVELS_OF_CONTROL.CONTROLLED_BY_OTHER_EXTENSION,
        };
        const proxy = buildProxy(canControlResponse);
        const settings = buildSettings(true);
        const appStatus = new AppStatus(proxy, settings, actualVersion);
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
        const appStatus = new AppStatus(proxy, settings, actualVersion);
        expect(await appStatus.canControlProxy()).toEqual(canControlResponse);
        expect(settings.disableProxy).toHaveBeenCalledTimes(0);
    });
});
