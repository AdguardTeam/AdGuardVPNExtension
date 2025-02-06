import browser from 'webextension-polyfill';

import { Telemetry } from '../../../src/background/telemetry/Telemetry';
import {
    TelemetryActionName,
    TelemetryLicenseStatus,
    TelemetryOs,
    TelemetryScreenName,
    TelemetrySubscriptionDuration,
    TelemetryTheme,
} from '../../../src/background/telemetry/telemetryEnums';
import { type TelemetryUserAgent } from '../../../src/background/telemetry/telemetryTypes';
import { AppearanceTheme, SubscriptionType } from '../../../src/common/constants';
import { Prefs, SystemName } from '../../../src/common/prefs';
import { log } from '../../../src/common/logger';

jest.mock('../../../src/background/browserApi', () => {
    return jest.requireActual('../../__mocks__/browserApiMock');
});

jest.mock('../../../src/common/logger');

const mockStorage = {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
};

const mockTelemetryProvider = {
    sendCustomEvent: jest.fn(),
    sendPageViewEvent: jest.fn(),
};

const mockAppStatus = {
    version: '2.3.13',
};

const mockSettings = {
    isHelpUsImproveEnabled: jest.fn().mockReturnValue(true),
    getAppearanceTheme: jest.fn().mockReturnValue(AppearanceTheme.System),
};

const mockAuth = {
    isAuthenticated: jest.fn().mockResolvedValue(true),
};

const mockCredentials = {
    isPremiumToken: jest.fn().mockResolvedValue(true),
    getSubscriptionType: jest.fn().mockReturnValue(SubscriptionType.Monthly),
};

jest.spyOn(Prefs, 'getPlatformInfo').mockResolvedValue({ os: SystemName.MacOS, arch: 'arm' });

describe('Telemetry', () => {
    let telemetry: Telemetry;
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
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const getUILanguageMock = jest.spyOn(browser.i18n, 'getUILanguage')
        .mockReturnValue('en-US');
    const getPlatformVersionMock = jest.spyOn(Prefs, 'getPlatformVersion')
        .mockResolvedValue('15.1.1');
    const deviceMock = jest.spyOn(Prefs, 'device', 'get')
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

    describe('Telemetry.initState', () => {
        it('should generate and save new synthetic id if storage is empty', async () => {
            mockStorage.get.mockResolvedValueOnce(undefined);
            mockStorage.set.mockResolvedValueOnce(undefined);

            await telemetry.initState();

            // Check if synthetic id is set in memory
            await telemetry.sendPageViewEvent(TelemetryScreenName.WelcomeScreen);
            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledWith(
                expect.any(Object), // Event data
                expect.objectContaining({
                    syntheticId: expect.stringMatching(syntheticIdRegex),
                }),
            );

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
            await telemetry.sendPageViewEvent(TelemetryScreenName.WelcomeScreen);
            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledWith(
                expect.any(Object), // Event data
                expect.objectContaining({
                    syntheticId: expect.stringMatching(syntheticIdRegex),
                }),
            );

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
            await telemetry.sendPageViewEvent(TelemetryScreenName.WelcomeScreen);
            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledWith(
                expect.any(Object), // Event data
                expect.objectContaining({
                    syntheticId: expect.stringMatching(syntheticIdRegex),
                }),
            );

            // Check if synthetic id is not rewritten
            expect(mockStorage.get).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).not.toHaveBeenCalled();
        });

        it('should correctly get user agent', async () => {
            await telemetry.initState();

            const expectedUserAgent: TelemetryUserAgent = {
                device: {
                    brand: 'Apple',
                    model: 'MacBook',
                },
                os: {
                    name: TelemetryOs.MacOS,
                    platform: 'arm',
                    version: '15.1.1',
                },
            };

            // Check if user agent is set in memory
            await telemetry.sendPageViewEvent(TelemetryScreenName.WelcomeScreen);
            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledWith(
                expect.any(Object), // Event data
                expect.objectContaining({
                    userAgent: expectedUserAgent,
                }),
            );
        });

        it('should set os.version to "unknown" if version is not detected', async () => {
            getPlatformVersionMock.mockResolvedValueOnce(undefined);

            await telemetry.initState();

            const expectedUserAgent: TelemetryUserAgent = {
                device: {
                    brand: 'Apple',
                    model: 'MacBook',
                },
                os: {
                    name: TelemetryOs.MacOS,
                    platform: 'arm',
                    version: 'unknown',
                },
            };

            // Check if user agent is set in memory
            await telemetry.sendPageViewEvent(TelemetryScreenName.WelcomeScreen);
            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledWith(
                expect.any(Object), // Event data
                expect.objectContaining({
                    userAgent: expectedUserAgent,
                }),
            );
        });

        it('should not include device info if vendor is not detected', async () => {
            deviceMock.mockReturnValueOnce({ vendor: undefined, model: 'MacBook', type: 'arm' });

            await telemetry.initState();

            const expectedUserAgent: TelemetryUserAgent = {
                os: {
                    name: TelemetryOs.MacOS,
                    platform: 'arm',
                    version: '15.1.1',
                },
            };

            // Check if user agent is set in memory
            await telemetry.sendPageViewEvent(TelemetryScreenName.WelcomeScreen);
            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledWith(
                expect.any(Object), // Event data
                expect.objectContaining({
                    userAgent: expectedUserAgent,
                }),
            );
        });
    });

    describe('Telemetry.getProps', () => {
        it('should return correct props', async () => {
            await telemetry.initState();

            const expectedProps = sampleEventBaseData.props;

            await telemetry.sendPageViewEvent(TelemetryScreenName.WelcomeScreen);
            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledWith(
                expect.any(Object), // Event data
                expect.objectContaining({
                    props: expectedProps,
                }),
            );
        });

        it('should return correct props if language and theme is changed', async () => {
            getUILanguageMock.mockReturnValueOnce('ru-RU');
            mockSettings.getAppearanceTheme.mockReturnValueOnce(AppearanceTheme.Dark);

            await telemetry.initState();

            const expectedProps = {
                ...sampleEventBaseData.props,
                appLocale: 'ru-RU',
                systemLocale: 'ru-RU',
                theme: TelemetryTheme.Dark,
            };

            await telemetry.sendPageViewEvent(TelemetryScreenName.WelcomeScreen);
            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledWith(
                expect.any(Object), // Event data
                expect.objectContaining({
                    props: expectedProps,
                }),
            );
        });

        it('should not include data about subscription if user is not authenticated', async () => {
            mockAuth.isAuthenticated.mockResolvedValueOnce(false);

            await telemetry.initState();

            const expectedProps = {
                ...sampleEventBaseData.props,
                loggedIn: false,
                licenseStatus: undefined,
                subscriptionDuration: undefined,
            };

            await telemetry.sendPageViewEvent(TelemetryScreenName.WelcomeScreen);
            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledWith(
                expect.any(Object), // Event data
                expect.objectContaining({
                    props: expectedProps,
                }),
            );
        });

        it('should not include data about subscription duration if user is not premium', async () => {
            mockCredentials.isPremiumToken.mockResolvedValueOnce(false);

            await telemetry.initState();

            const expectedProps = {
                ...sampleEventBaseData.props,
                licenseStatus: TelemetryLicenseStatus.Free,
                subscriptionDuration: undefined,
            };

            await telemetry.sendPageViewEvent(TelemetryScreenName.WelcomeScreen);
            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledWith(
                expect.any(Object), // Event data
                expect.objectContaining({
                    props: expectedProps,
                }),
            );
        });

        it('should correctly map subscription duration if user is premium', async () => {
            await telemetry.initState();

            mockCredentials.getSubscriptionType.mockReturnValueOnce(SubscriptionType.Yearly);
            await telemetry.sendPageViewEvent(TelemetryScreenName.WelcomeScreen);
            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledWith(
                expect.any(Object), // Event data
                expect.objectContaining({
                    props: {
                        ...sampleEventBaseData.props,
                        subscriptionDuration: TelemetrySubscriptionDuration.Annual,
                    },
                }),
            );

            mockCredentials.getSubscriptionType.mockReturnValueOnce(SubscriptionType.TwoYears);
            await telemetry.sendPageViewEvent(TelemetryScreenName.WelcomeScreen);
            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledWith(
                expect.any(Object), // Event data
                expect.objectContaining({
                    props: {
                        ...sampleEventBaseData.props,
                        subscriptionDuration: TelemetrySubscriptionDuration.Other,
                    },
                }),
            );

            mockCredentials.getSubscriptionType.mockReturnValueOnce(undefined);
            await telemetry.sendPageViewEvent(TelemetryScreenName.WelcomeScreen);
            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledWith(
                expect.any(Object), // Event data
                expect.objectContaining({
                    props: {
                        ...sampleEventBaseData.props,
                        subscriptionDuration: TelemetrySubscriptionDuration.Lifetime,
                    },
                }),
            );
        });
    });

    describe('Telemetry.canSendEvents', () => {
        it('should return true if user opted in and initialized', async () => {
            await telemetry.initState();

            await telemetry.sendPageViewEvent(TelemetryScreenName.WelcomeScreen);
            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledTimes(1);
        });

        it('should return false if user opted out', async () => {
            mockSettings.isHelpUsImproveEnabled.mockReturnValueOnce(false);
            await telemetry.initState();

            await telemetry.sendPageViewEvent(TelemetryScreenName.WelcomeScreen);
            expect(mockTelemetryProvider.sendPageViewEvent).not.toHaveBeenCalled();
            expect(log.debug).toHaveBeenCalled();
        });

        it('should return false if telemetry is not initialized', async () => {
            await telemetry.sendPageViewEvent(TelemetryScreenName.WelcomeScreen);
            expect(mockTelemetryProvider.sendPageViewEvent).not.toHaveBeenCalled();
            expect(log.debug).toHaveBeenCalled();
        });
    });

    describe('Telemetry.sendPageViewEvent', () => {
        it('should send event', async () => {
            await telemetry.initState();
            await telemetry.sendPageViewEvent(TelemetryScreenName.PurchaseScreen);

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
            await telemetry.sendPageViewEvent(TelemetryScreenName.WelcomeScreen);
            await telemetry.sendPageViewEvent(TelemetryScreenName.PurchaseScreen);

            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenCalledTimes(2);
            expect(mockTelemetryProvider.sendPageViewEvent).toHaveBeenNthCalledWith(
                2,
                {
                    name: TelemetryScreenName.PurchaseScreen,
                    refName: TelemetryScreenName.WelcomeScreen,
                },
                sampleEventBaseData,
            );
        });

        // FIXME: Add test cases after reset is implemented
    });

    describe('Telemetry.sendCustomEvent', () => {
        it('should send event', async () => {
            await telemetry.initState();
            await telemetry.sendCustomEvent(
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
    });
});
