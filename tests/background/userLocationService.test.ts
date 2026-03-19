import {
    vi,
    describe,
    beforeEach,
    it,
    expect,
} from 'vitest';

import { userLocationService } from '../../src/background/userLocationService/userLocationService';

const { mockVpnProvider, mockBrowser } = vi.hoisted(() => ({
    mockVpnProvider: {
        getCurrentLocation: vi.fn(),
    },
    mockBrowser: {
        i18n: {
            getUILanguage: vi.fn(),
        },
    },
}));

vi.mock('webextension-polyfill', () => ({
    default: mockBrowser,
}));

vi.mock('../../src/background/providers/vpnProvider', () => ({
    vpnProvider: mockVpnProvider,
}));

describe('UserLocationService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // @ts-expect-error - accessing private field for testing
        userLocationService.countryCodeToLocale = {
            RU: 'ru',
        };
        // @ts-expect-error - accessing private field for testing
        userLocationService.countryCode = null;
    });

    describe('isUserInAffectedRegion', () => {
        describe('with country codes', () => {
            it('should return true when country code is in affected region', async () => {
                mockVpnProvider.getCurrentLocation.mockResolvedValueOnce({
                    countryCode: 'RU',
                });

                await userLocationService.init();

                expect(userLocationService.isUserInAffectedRegion()).toBe(true);
            });

            it('should return false when country code is not in affected region', async () => {
                mockVpnProvider.getCurrentLocation.mockResolvedValueOnce({
                    countryCode: 'DE',
                });

                await userLocationService.init();

                expect(userLocationService.isUserInAffectedRegion()).toBe(false);
            });

            it('should return false when countryCodeToLocale is empty', async () => {
                // @ts-expect-error - accessing private field for testing
                userLocationService.countryCodeToLocale = {};

                mockVpnProvider.getCurrentLocation.mockResolvedValueOnce({
                    countryCode: 'RU',
                });

                await userLocationService.init();

                expect(userLocationService.isUserInAffectedRegion()).toBe(false);
            });
        });

        describe('with browser locales (fallback)', () => {
            it('should return true when browser locale matches affected locale', () => {
                mockBrowser.i18n.getUILanguage.mockReturnValueOnce('ru-RU');

                expect(userLocationService.isUserInAffectedRegion()).toBe(true);
            });

            it('should return true when browser locale starts with affected locale', () => {
                mockBrowser.i18n.getUILanguage.mockReturnValueOnce('ru');

                expect(userLocationService.isUserInAffectedRegion()).toBe(true);
            });

            it('should return false when browser locale is not in affected locales', () => {
                mockBrowser.i18n.getUILanguage.mockReturnValueOnce('en-US');

                expect(userLocationService.isUserInAffectedRegion()).toBe(false);
            });

            it('should return false when countryCodeToLocale is empty', () => {
                // @ts-expect-error - accessing private field for testing
                userLocationService.countryCodeToLocale = {};

                mockBrowser.i18n.getUILanguage.mockReturnValueOnce('ru-RU');

                expect(userLocationService.isUserInAffectedRegion()).toBe(false);
            });
        });

        describe('priority', () => {
            it('should prioritize country code over browser locale', async () => {
                mockVpnProvider.getCurrentLocation.mockResolvedValueOnce({
                    countryCode: 'DE',
                });
                mockBrowser.i18n.getUILanguage.mockReturnValue('ru-RU');

                await userLocationService.init();

                expect(userLocationService.isUserInAffectedRegion()).toBe(false);
            });
        });
    });

    describe('init', () => {
        it('should fetch location from backend successfully', async () => {
            mockVpnProvider.getCurrentLocation.mockResolvedValueOnce({
                countryCode: 'RU',
            });

            await userLocationService.init();

            expect(mockVpnProvider.getCurrentLocation).toHaveBeenCalledTimes(1);
        });
    });
});
