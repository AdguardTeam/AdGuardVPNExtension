import { telemetryProvider } from '../../../src/background/providers/telemetryProvider';
import { telemetryApi } from '../../../src/background/api/telemetryApi';
import {
    TelemetryActionName,
    TelemetryLicenseStatus,
    TelemetryOs,
    TelemetryScreenName,
    TelemetrySubscriptionDuration,
    TelemetryTheme,
} from '../../../src/background/telemetry/telemetryEnums';
import {
    type TelemetryCustomEventData,
    type TelemetryPageViewEventData,
    type TelemetryBaseData,
    type TelemetryApiEventData,
} from '../../../src/background/telemetry/telemetryTypes';
import { log } from '../../../src/common/logger';

jest.mock('../../../src/common/logger');
jest.mock('../../../src/background/api/telemetryApi');

const sendEventSpy = jest.spyOn(telemetryApi, 'sendEvent');

describe('telemetryProvider', () => {
    afterAll(() => {
        jest.clearAllMocks();
    });

    const sampleBaseData: TelemetryBaseData = {
        syntheticId: 'abcd1234',
        appType: 'VPN_EXTENSION',
        version: '1.0',
        userAgent: {
            device: {
                brand: 'brand',
                model: 'model',
            },
            os: {
                name: TelemetryOs.MacOS,
                version: 'version',
            },
        },
        props: {
            appLocale: 'en-US',
            systemLocale: 'en-US',
            loggedIn: true,
            licenseStatus: TelemetryLicenseStatus.Premium,
            subscriptionDuration: TelemetrySubscriptionDuration.Lifetime,
            theme: TelemetryTheme.System,
        },
    };
    const samplePageViewEventData: TelemetryPageViewEventData = {
        name: TelemetryScreenName.PurchaseScreen,
        refName: TelemetryScreenName.WelcomeScreen,
    };
    const sampleCustomEventData: TelemetryCustomEventData = {
        name: TelemetryActionName.OnboardingPurchaseClick,
        refName: TelemetryScreenName.PurchaseScreen,
    };
    const sampleApiEventData: TelemetryApiEventData = {
        synthetic_id: sampleBaseData.syntheticId,
        app_type: sampleBaseData.appType,
        version: sampleBaseData.version,
        user_agent: sampleBaseData.userAgent,
        props: {
            app_locale: sampleBaseData.props!.appLocale,
            system_locale: sampleBaseData.props!.systemLocale,
            logged_in: sampleBaseData.props?.loggedIn,
            license_status: sampleBaseData.props?.licenseStatus,
            subscription_duration: sampleBaseData.props?.subscriptionDuration,
            theme: sampleBaseData.props?.theme,
        },
    };

    it('makes requests to the server - pageview event', async () => {
        await telemetryProvider.sendPageViewEvent(samplePageViewEventData, sampleBaseData);

        expect(sendEventSpy).toBeCalledWith({
            ...sampleApiEventData,
            pageview: {
                name: samplePageViewEventData.name,
                ref_name: samplePageViewEventData.refName,
            },
            event: undefined,
        });
    });

    it('makes requests to the server - custom event', async () => {
        await telemetryProvider.sendCustomEvent(sampleCustomEventData, sampleBaseData);

        expect(sendEventSpy).toBeCalledWith({
            ...sampleApiEventData,
            event: {
                name: sampleCustomEventData.name,
                ref_name: sampleCustomEventData.refName,
                action: sampleCustomEventData.action,
                label: sampleCustomEventData.label,
            },
            pageview: undefined,
        });
    });

    it('handles network errors', async () => {
        sendEventSpy.mockRejectedValue(new Error('Network error'));

        await telemetryProvider.sendPageViewEvent(samplePageViewEventData, sampleBaseData);

        expect(sendEventSpy).toHaveBeenCalled();
        expect(log.debug).toHaveBeenCalled();
    });

    it('handles errors sent from server', async () => {
        sendEventSpy.mockRejectedValue({ status: 500 });

        await telemetryProvider.sendCustomEvent(sampleCustomEventData, sampleBaseData);

        expect(sendEventSpy).toHaveBeenCalled();
        expect(log.debug).toHaveBeenCalled();
    });
});
