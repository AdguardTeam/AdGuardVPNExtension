import {
    vi,
    describe,
    beforeEach,
    afterEach,
    it,
    expect,
} from 'vitest';
import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';

import { Telemetry } from '../../../src/background/telemetry/Telemetry';
import {
    TelemetryActionName,
    TelemetryLicenseStatus,
    TelemetryOs,
    TelemetryScreenName,
    TelemetrySubscriptionDuration,
    TelemetryTheme,
} from '../../../src/background/telemetry/telemetryEnums';
import { type TelemetryBaseData } from '../../../src/background/telemetry/telemetryTypes';
import { AppearanceTheme, SubscriptionType } from '../../../src/common/constants';
import { Prefs, SystemName } from '../../../src/common/prefs';
import { log } from '../../../src/common/logger';

const mockStorage = {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
};

const mockTelemetryProvider = {
    sendCustomEvent: vi.fn(),
    sendPageViewEvent: vi.fn(),
};

const mockAppStatus = {
    version: '2.3.13',
};

const mockSettings = {
    isHelpUsImproveEnabled: vi.fn().mockReturnValue(true),
    getAppearanceTheme: vi.fn().mockReturnValue(AppearanceTheme.System),
};

const mockAuth = {
    isAuthenticated: vi.fn().mockResolvedValue(true),
};

const mockCredentials = {
    isPremiumToken: vi.fn().mockResolvedValue(true),
    getSubscriptionType: vi.fn().mockReturnValue(SubscriptionType.Monthly),
};

vi.spyOn(Prefs, 'getPlatformInfo').mockResolvedValue({ os: SystemName.MacOS, arch: 'arm' });

describe('Telemetry', () => {
    let telemetry: Telemetry;
    let prevUsedScreenName = TelemetryScreenName.AuthScreen;

    beforeEach(() => {
        telemetry = new Telemetry({
            storage: mockStorage,
            telemetryProvider: mockTelemetryProvider,
            // @ts-ignore - partially mocked app status
            appStatus: mockAppStatus,
            // @ts-ignore - partially mocked settings
            settings: mockSettings,
            // @ts-ignore - partially mocked auth
            auth: mockAuth,
            // @ts-ignore - partially mocked credentials
            credentials: mockCredentials,
        });
        if (prevUsedScreenName === TelemetryScreenName.AuthScreen) {
            prevUsedScreenName = TelemetryScreenName.PurchaseScreen;
        } else {
            prevUsedScreenName = TelemetryScreenName.AuthScreen;
        }
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    const getUILanguageMock = vi.spyOn(browser.i18n, 'getUILanguage')
        .mockReturnValue('en-US');
    const getPlatformVersionMock = vi.spyOn(Prefs, 'getPlatformVersion')
        .mockResolvedValue('15.1.1');
    const deviceMock = vi.spyOn(Prefs, 'device', 'get')
        .mockReturnValue({ model: 'MacBook', vendor: 'Apple', type: 'arm' });

    const syntheticIdRegex = /^[a-f1-9]{8}$/;
    const sampleEventBaseData = {
        syntheticId: expect.stringMatching(syntheticIdRegex),
        appType: 'VPN_EXTENSION',
        version: '2.3.13',
        // user agent is tested in `Telemetry.initState`
        userAgent: expect.any(Object),
        props: {
            appLocale: 'en-US',
            systemLocale: 'en-US',
            loggedIn: true,
            licenseStatus: TelemetryLicenseStatus.Premium,
            subscriptionDuration: TelemetrySubscriptionDuration.Monthly,
            theme: TelemetryTheme.System,
        },
    };

    /**
     * Function that sends a page view event without debouncing.
     *
     * @param screenName Name of screen.
     */
    const sendPageViewEventNotDebounced = async (
        screenName: TelemetryScreenName,
        pageId = nanoid(),
    ): Promise<void> => {
        // @ts-expect-error - private method
        await telemetry.sendPageViewEvent(screenName, pageId);
    };

    /**
     * Function that sends a custom event without debouncing.
     *
     * @param actionName Name of action.
     * @param screenName Name of screen.
     */
    const sendCustomEventNotDebounced = async (
        actionName: TelemetryActionName,
        screenName: TelemetryScreenName,
    ): Promise<void> => {
        // @ts-expect-error - private method
        await telemetry.sendCustomEvent(actionName, screenName);
    };

    /**
     * Function that sends a page view event and checks if base data is correct.
     * We checking data by sending because methods like `Telemetry.getProps`
     * or `Telemetry.getUserAgent` is private.
     *
     * @param data Partial base data to check.
     */
    const expectBaseDataPartially = async (data: Partial<TelemetryBaseData>): Promise<void> => {
        await sendPageViewEventNotDebounced(prevUsedScreenName);
        expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledWith(
            expect.any(Object), // Event data
            expect.objectContaining(data),
        );
    };

    describe('Telemetry.initState', () => {
        it('should generate and save new synthetic id if storage is empty', async () => {
            mockStorage.get.mockResolvedValueOnce(undefined);
            mockStorage.set.mockResolvedValueOnce(undefined);

            await telemetry.initState();

            // Check if synthetic id is set in memory
            await expectBaseDataPartially({
                syntheticId: expect.stringMatching(syntheticIdRegex),
            });

            // Check if synthetic id is saved
            expect(mockStorage.get).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledWith(
                expect.any(String), // Storage key
                expect.stringMatching(syntheticIdRegex), // Synthetic id
            );
        });

        it('should generate and save new synthetic id if storage value is corrupted', async () => {
            mockStorage.get.mockResolvedValueOnce('INVALID_ID');
            mockStorage.set.mockResolvedValueOnce(undefined);

            await telemetry.initState();

            // Check if synthetic id is set in memory
            await expectBaseDataPartially({
                syntheticId: expect.stringMatching(syntheticIdRegex),
            });

            // Check if synthetic id is saved
            expect(mockStorage.get).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledWith(
                expect.any(String), // Storage key
                expect.stringMatching(syntheticIdRegex), // Synthetic id
            );
        });

        it('should read synthetic id from storage if value is valid', async () => {
            mockStorage.get.mockResolvedValueOnce('abcd1234');
            mockStorage.set.mockResolvedValueOnce(undefined);

            await telemetry.initState();

            // Check if synthetic id is set in memory
            await expectBaseDataPartially({
                syntheticId: expect.stringMatching(syntheticIdRegex),
            });

            // Check if synthetic id is not rewritten
            expect(mockStorage.get).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).not.toHaveBeenCalled();
        });

        it('should correctly get user agent', async () => {
            await telemetry.initState();

            // Check if user agent is set in memory
            await expectBaseDataPartially({
                userAgent: {
                    device: {
                        brand: 'Apple',
                        model: 'MacBook',
                    },
                    os: {
                        name: TelemetryOs.MacOS,
                        platform: 'arm',
                        version: '15.1.1',
                    },
                },
            });
        });

        it('should set os.version to "unknown" if version is not detected', async () => {
            getPlatformVersionMock.mockResolvedValueOnce(undefined);

            await telemetry.initState();

            // Check if user agent is set in memory
            await expectBaseDataPartially({
                userAgent: {
                    device: {
                        brand: 'Apple',
                        model: 'MacBook',
                    },
                    os: {
                        name: TelemetryOs.MacOS,
                        platform: 'arm',
                        version: 'unknown',
                    },
                },
            });
        });

        it('should not include device info if vendor is not detected', async () => {
            deviceMock.mockReturnValueOnce({ vendor: undefined, model: 'MacBook', type: 'arm' });

            await telemetry.initState();

            // Check if user agent is set in memory
            await expectBaseDataPartially({
                userAgent: {
                    os: {
                        name: TelemetryOs.MacOS,
                        platform: 'arm',
                        version: '15.1.1',
                    },
                },
            });
        });
    });

    describe('Telemetry.getProps', () => {
        it('should return correct props', async () => {
            await telemetry.initState();

            // should be same as sample base data
            await expectBaseDataPartially({
                props: sampleEventBaseData.props,
            });
        });

        it('should return correct props if language and theme is changed', async () => {
            getUILanguageMock.mockReturnValueOnce('ru-RU');
            mockSettings.getAppearanceTheme.mockReturnValueOnce(AppearanceTheme.Dark);

            await telemetry.initState();

            await expectBaseDataPartially({
                props: expect.objectContaining({
                    appLocale: 'ru-RU',
                    systemLocale: 'ru-RU',
                    theme: TelemetryTheme.Dark,
                }),
            });
        });

        it('should not include data about subscription if user is not authenticated', async () => {
            mockAuth.isAuthenticated.mockResolvedValueOnce(false);

            await telemetry.initState();

            await expectBaseDataPartially({
                props: expect.objectContaining({
                    loggedIn: false,
                    licenseStatus: undefined,
                    subscriptionDuration: undefined,
                }),
            });
        });

        it('should not include data about subscription duration if user is not premium', async () => {
            mockCredentials.isPremiumToken.mockResolvedValueOnce(false);

            await telemetry.initState();

            await expectBaseDataPartially({
                props: expect.objectContaining({
                    licenseStatus: TelemetryLicenseStatus.Free,
                    subscriptionDuration: undefined,
                }),
            });
        });

        it('should correctly map subscription duration if user is premium - yearly', async () => {
            mockCredentials.getSubscriptionType.mockReturnValueOnce(SubscriptionType.Yearly);
            await telemetry.initState();

            await expectBaseDataPartially({
                props: expect.objectContaining({
                    subscriptionDuration: TelemetrySubscriptionDuration.Annual,
                }),
            });
        });

        it('should correctly map subscription duration if user is premium - two yearly', async () => {
            mockCredentials.getSubscriptionType.mockReturnValueOnce(SubscriptionType.TwoYears);
            await telemetry.initState();

            await expectBaseDataPartially({
                props: expect.objectContaining({
                    subscriptionDuration: TelemetrySubscriptionDuration.Other,
                }),
            });
        });

        it('should correctly map subscription duration if user is premium - lifetime', async () => {
            mockCredentials.getSubscriptionType.mockReturnValueOnce(undefined);
            await telemetry.initState();

            await expectBaseDataPartially({
                props: expect.objectContaining({
                    subscriptionDuration: TelemetrySubscriptionDuration.Lifetime,
                }),
            });
        });
    });

    describe('Telemetry.canSendEvents', () => {
        it('should return true if user opted in and initialized', async () => {
            await telemetry.initState();

            await sendPageViewEventNotDebounced(TelemetryScreenName.AuthScreen);
            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledTimes(1);
        });

        it('should return false if user opted out', async () => {
            mockSettings.isHelpUsImproveEnabled.mockReturnValueOnce(false);
            await telemetry.initState();

            await sendPageViewEventNotDebounced(TelemetryScreenName.AuthScreen);
            expect(mockTelemetryProvider.sendPageViewEvent).not.toHaveBeenCalled();
            expect(log.debug).toHaveBeenCalled();
        });

        it('should return false if telemetry is not initialized', async () => {
            await sendPageViewEventNotDebounced(TelemetryScreenName.AuthScreen);
            expect(mockTelemetryProvider.sendPageViewEvent).not.toHaveBeenCalled();
            expect(log.debug).toHaveBeenCalled();
        });
    });

    describe('Telemetry.sendPageViewEvent', () => {
        it('should send event', async () => {
            await telemetry.initState();
            telemetry.addOpenedPage();
            await sendPageViewEventNotDebounced(TelemetryScreenName.PurchaseScreen, 'pageId1');

            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledTimes(1);
            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledWith(
                {
                    name: TelemetryScreenName.PurchaseScreen,
                    refName: undefined,
                },
                sampleEventBaseData,
            );
        });

        it('should save previous screen name', async () => {
            await telemetry.initState();
            telemetry.addOpenedPage();
            await sendPageViewEventNotDebounced(TelemetryScreenName.AuthScreen, 'pageId1');
            await sendPageViewEventNotDebounced(TelemetryScreenName.PurchaseScreen, 'pageId1');

            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledTimes(2);
            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenNthCalledWith(
                2,
                {
                    name: TelemetryScreenName.PurchaseScreen,
                    refName: TelemetryScreenName.AuthScreen,
                },
                sampleEventBaseData,
            );
        });

        it('should send refName when switched between pages', async () => {
            await telemetry.initState();

            const pageId1 = telemetry.addOpenedPage();
            await sendPageViewEventNotDebounced(TelemetryScreenName.AuthScreen, pageId1);

            const pageId2 = telemetry.addOpenedPage();
            await sendPageViewEventNotDebounced(TelemetryScreenName.PurchaseScreen, pageId2);

            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledTimes(2);
            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenNthCalledWith(
                2,
                {
                    name: TelemetryScreenName.PurchaseScreen,
                    refName: TelemetryScreenName.AuthScreen,
                },
                sampleEventBaseData,
            );
        });

        it('should reset screen names if no opened page left', async () => {
            await telemetry.initState();

            const pageId1 = telemetry.addOpenedPage();
            await sendPageViewEventNotDebounced(TelemetryScreenName.AuthScreen, pageId1);
            telemetry.removeOpenedPage(pageId1);

            const pageId2 = telemetry.addOpenedPage();
            await sendPageViewEventNotDebounced(TelemetryScreenName.PurchaseScreen, pageId2);

            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledTimes(2);
            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenNthCalledWith(
                2,
                {
                    name: TelemetryScreenName.PurchaseScreen,
                    refName: undefined,
                },
                sampleEventBaseData,
            );
        });

        it('should rotate screens when page of current screen is closed', async () => {
            await telemetry.initState();

            const pageId1 = telemetry.addOpenedPage();
            await sendPageViewEventNotDebounced(TelemetryScreenName.AuthScreen, pageId1);

            const pageId2 = telemetry.addOpenedPage();
            await sendPageViewEventNotDebounced(TelemetryScreenName.PurchaseScreen, pageId2);
            telemetry.removeOpenedPage(pageId2);

            const pageId3 = telemetry.addOpenedPage();
            await sendPageViewEventNotDebounced(TelemetryScreenName.AccountScreen, pageId3);

            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledTimes(3);
            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenNthCalledWith(
                3,
                {
                    name: TelemetryScreenName.AccountScreen,
                    refName: undefined,
                },
                sampleEventBaseData,
            );
        });

        it('should not send event if same screen send twice in a row', async () => {
            await telemetry.initState();

            telemetry.addOpenedPage();
            await sendPageViewEventNotDebounced(TelemetryScreenName.AuthScreen, 'pageId1');
            await sendPageViewEventNotDebounced(TelemetryScreenName.AuthScreen, 'pageId1');

            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledTimes(1);
            expect(log.debug).toHaveBeenCalled();
        });

        it('should send event if same screen send twice in a row from different pages', async () => {
            await telemetry.initState();

            telemetry.addOpenedPage();
            await sendPageViewEventNotDebounced(TelemetryScreenName.AuthScreen, 'pageId1');
            await sendPageViewEventNotDebounced(TelemetryScreenName.AuthScreen, 'pageId2');

            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledTimes(2);
        });

        it('should debounce if events are sent too fast', async () => {
            await telemetry.initState();

            telemetry.addOpenedPage();
            await telemetry.sendPageViewEventDebounced(TelemetryScreenName.AuthScreen, 'pageId1');
            await telemetry.sendPageViewEventDebounced(TelemetryScreenName.PurchaseScreen, 'pageId1');

            await new Promise((resolve) => {
                setTimeout(() => {
                    expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledTimes(1);
                    resolve(true);
                }, Telemetry.SEND_EVENT_TIMEOUT + 1);
            });
        });
    });

    describe('Telemetry.sendCustomEvent', () => {
        it('should send event', async () => {
            await telemetry.initState();

            await sendCustomEventNotDebounced(
                TelemetryActionName.OnboardingPurchaseClick,
                TelemetryScreenName.PurchaseScreen,
            );

            expect(mockTelemetryProvider.sendCustomEvent).toHaveBeenCalledTimes(1);
            expect(mockTelemetryProvider.sendCustomEvent).toHaveBeenCalledWith(
                {
                    name: TelemetryActionName.OnboardingPurchaseClick,
                    refName: TelemetryScreenName.PurchaseScreen,
                },
                sampleEventBaseData,
            );
        });

        it('should debounce if events are sent too fast', async () => {
            await telemetry.initState();

            await telemetry.sendCustomEventDebounced(
                TelemetryActionName.OnboardingPurchaseClick,
                TelemetryScreenName.PurchaseScreen,
            );
            await telemetry.sendCustomEventDebounced(
                TelemetryActionName.OnboardingPurchaseClick,
                TelemetryScreenName.PurchaseScreen,
            );

            await new Promise((resolve) => {
                setTimeout(() => {
                    expect(mockTelemetryProvider.sendCustomEvent).toHaveBeenCalledTimes(1);
                    resolve(true);
                }, Telemetry.SEND_EVENT_TIMEOUT + 1);
            });
        });
    });
});
