import { type IBrowser, type IDevice, type IOS } from 'ua-parser-js';

import {
    Preferences,
    Prefs,
    BrowserName,
    SystemName,
} from '../../src/common/prefs';
import { runtime } from '../../src/background/browserApi/runtime';

// Partially mock browserApi.runtime
const getPlatformInfoSpy = jest.spyOn(runtime, 'getPlatformInfo');
jest.mock('../../src/background/browserApi/runtime', () => ({
    getUrl: (path: string) => `test/${path}`,
    runtime: {
        getPlatformInfo: jest.fn(),
    },
}));

// Partially mock ua-parser-js
const uaGetOS = jest.fn();
const uaGetDevice = jest.fn();
const uaGetBrowser = jest.fn();
jest.mock('ua-parser-js', () => jest.fn().mockImplementation(() => ({
    getOS: uaGetOS,
    getDevice: uaGetDevice,
    getBrowser: uaGetBrowser,
})));

// Mock navigator.userAgentData
(global.window.navigator as any).userAgentData = {
    getHighEntropyValues: jest.fn(),
};

describe('prefs', () => {
    let userAgentGetter: jest.SpyInstance<string, []>;
    let getHighEntropyValuesSpy: jest.SpyInstance<Promise<{ platformVersion: string }>>;
    beforeEach(() => {
        userAgentGetter = jest.spyOn(window.navigator, 'userAgent', 'get');
        getHighEntropyValuesSpy = jest.spyOn((window.navigator as any).userAgentData, 'getHighEntropyValues');
    });

    afterEach(() => {
        Preferences.clearCache();
    });

    afterAll(() => {
        jest.clearAllMocks();
    });

    it('can get ICONS properly and lazily', () => {
        const firstGet = Prefs.ICONS;
        expect(firstGet).toBeDefined();
        expect(firstGet.DISABLED[19]).toBe('test/assets/images/icons/disabled-19.png');

        const secondGet = Prefs.ICONS;
        expect(secondGet).toBe(firstGet);
    });

    it('can get browser properly and lazily', () => {
        uaGetBrowser.mockReturnValueOnce({
            name: 'Firefox',
        } as IBrowser);
        userAgentGetter.mockReturnValue('firefox');

        const firstGet = Prefs.browser;
        expect(firstGet).toBe(BrowserName.Firefox);

        const secondGet = Prefs.browser;
        expect(secondGet).toBe(BrowserName.Firefox);

        // 2 calls because: 1 - to create ua-parser-js, 2 - to get browser name
        expect(userAgentGetter).toBeCalledTimes(2);

        const isFirefox = Prefs.isFirefox();
        expect(isFirefox).toBe(true);

        // 2 calls because: 1 - to create ua-parser-js, 2 - to get browser name
        expect(userAgentGetter).toBeCalledTimes(2);

        userAgentGetter.mockClear();
    });

    it('can get platform info properly and lazily', async () => {
        getPlatformInfoSpy.mockReturnValueOnce(Promise.resolve({ os: 'mac', arch: 'arm' }));

        const firstInfo = await Prefs.getPlatformInfo();
        expect(firstInfo.os).toBe(SystemName.MacOS);
        expect(firstInfo.arch).toBe('arm');

        const secondInfo = await Prefs.getPlatformInfo();
        expect(firstInfo).toBe(secondInfo);

        const os = await Prefs.getOS();
        expect(os).toBe(SystemName.MacOS);

        const isMacOS = await Prefs.isMacOS();
        expect(isMacOS).toBe(true);

        const isWindows = await Prefs.isWindows();
        expect(isWindows).toBe(false);

        const isAndroid = await Prefs.isAndroid();
        expect(isAndroid).toBe(false);
    });

    it('returns undefined if unable to detect platform version', async () => {
        uaGetOS.mockReturnValueOnce({} as IOS);

        const version = await Prefs.getPlatformVersion();
        expect(version).toBeUndefined();
    });

    it('can get platform version properly', async () => {
        getPlatformInfoSpy.mockReturnValueOnce(Promise.resolve({ os: 'mac', arch: 'arm' }));
        uaGetOS.mockReturnValueOnce({ version: '11.0.1' } as IOS);

        const version = await Prefs.getPlatformVersion();
        expect(version).toBe('11.0.1');
    });

    it('can get actual platform version properly - MacOS', async () => {
        getPlatformInfoSpy.mockReturnValueOnce(Promise.resolve({ os: 'mac', arch: 'arm' }));
        uaGetOS.mockReturnValueOnce({ version: '11.0.1' } as IOS);
        getHighEntropyValuesSpy.mockReturnValueOnce(Promise.resolve({
            platformVersion: '15.1.1',
        }));

        const version = await Prefs.getPlatformVersion();
        expect(version).toBe('15.1.1');
    });

    it('can get actual platform version properly - Windows older than 10', async () => {
        getPlatformInfoSpy.mockReturnValueOnce(Promise.resolve({ os: 'win', arch: 'arm' }));
        uaGetOS.mockReturnValueOnce({ version: '7' } as IOS);

        const version = await Prefs.getPlatformVersion();
        expect(version).toBe('7');
    });

    it('can get actual platform version properly - Windows 10', async () => {
        getPlatformInfoSpy.mockReturnValueOnce(Promise.resolve({ os: 'win', arch: 'arm' }));
        uaGetOS.mockReturnValueOnce({ version: '10' } as IOS);
        getHighEntropyValuesSpy.mockReturnValueOnce(Promise.resolve({
            platformVersion: '10.1.1',
        }));

        const version = await Prefs.getPlatformVersion();
        expect(version).toBe('10');
    });

    it('can get actual platform version properly - Windows 11', async () => {
        getPlatformInfoSpy.mockReturnValueOnce(Promise.resolve({ os: 'win', arch: 'arm' }));
        uaGetOS.mockReturnValueOnce({ version: '10' } as IOS);
        getHighEntropyValuesSpy.mockReturnValueOnce(Promise.resolve({
            platformVersion: '15.0.0',
        }));

        const version = await Prefs.getPlatformVersion();
        expect(version).toBe('11');
    });

    it('can get device info properly and lazily', () => {
        uaGetDevice.mockReturnValueOnce({
            model: 'Test model',
            type: 'mobile',
            vendor: 'Test vendor',
        } as IDevice);

        const firstDevice = Prefs.device;
        expect(firstDevice.model).toBe('Test model');
        expect(firstDevice.type).toBe('mobile');
        expect(firstDevice.vendor).toBe('Test vendor');

        const secondDevice = Prefs.device;
        expect(secondDevice).toBe(firstDevice);
    });
});
