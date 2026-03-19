import {
    vi,
    describe,
    afterAll,
    it,
    expect,
} from 'vitest';

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

const sendEventSpy = vi.spyOn(telemetryApi, 'sendEvent');

describe('telemetryProvider', () => {
    afterAll(() => {
        vi.clearAllMocks();
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
            browser: {
                name: 'Chrome',
                version: '98',
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
        refName: TelemetryScreenName.AuthScreen,
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

    it('does not include experiment keys when no experiments are present', async () => {
        await telemetryProvider.sendPageViewEvent(samplePageViewEventData, sampleBaseData);

        const callArgs = sendEventSpy.mock.calls[sendEventSpy.mock.calls.length - 1][0];
        expect(callArgs.props).not.toHaveProperty('experiment_1');
        expect(callArgs.props).not.toHaveProperty('experiment_2');
        expect(callArgs.props).not.toHaveProperty('experiment_3');
    });

    it('forwards experiment props to the API for pageview events', async () => {
        const baseDataWithExperiments: TelemetryBaseData = {
            ...sampleBaseData,
            props: {
                ...sampleBaseData.props!,
                experiment_1: 'AG-001-feature-a-variant_def',
                experiment_2: 'AG-002-feature-b-variant_b',
            },
        };

        await telemetryProvider.sendPageViewEvent(samplePageViewEventData, baseDataWithExperiments);

        expect(sendEventSpy).toBeCalledWith(
            expect.objectContaining({
                props: expect.objectContaining({
                    experiment_1: 'AG-001-feature-a-variant_def',
                    experiment_2: 'AG-002-feature-b-variant_b',
                }),
            }),
        );

        const callArgs = sendEventSpy.mock.calls[sendEventSpy.mock.calls.length - 1][0];
        expect(callArgs.props).not.toHaveProperty('experiment_3');
    });

    it('forwards experiment props to the API for custom events', async () => {
        const baseDataWithExperiments: TelemetryBaseData = {
            ...sampleBaseData,
            props: {
                ...sampleBaseData.props!,
                experiment_1: 'AG-001-feature-a-variant_def',
            },
        };

        await telemetryProvider.sendCustomEvent(sampleCustomEventData, baseDataWithExperiments);

        expect(sendEventSpy).toBeCalledWith(
            expect.objectContaining({
                props: expect.objectContaining({
                    experiment_1: 'AG-001-feature-a-variant_def',
                }),
            }),
        );

        const callArgs = sendEventSpy.mock.calls[sendEventSpy.mock.calls.length - 1][0];
        expect(callArgs.props).not.toHaveProperty('experiment_2');
        expect(callArgs.props).not.toHaveProperty('experiment_3');
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
