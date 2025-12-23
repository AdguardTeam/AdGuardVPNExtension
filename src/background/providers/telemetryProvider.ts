import { log } from '../../common/logger';
import { telemetryApi } from '../api/telemetryApi';
import {
    type TelemetryEvent,
    type TelemetryBaseData,
    type TelemetryPageViewEvent,
    type TelemetryPageViewEventData,
    type TelemetryCustomEventData,
    type TelemetryCustomEvent,
    type TelemetryApiEventData,
} from '../telemetry/telemetryTypes';

/**
 * Telemetry provider interface.
 */
export interface TelemetryProviderInterface {
    /**
     * Sends telemetry pageview event.
     *
     * @param event Page view event data.
     * @param baseData Base data for sending telemetry event.
     */
    sendPageViewEvent(event: TelemetryPageViewEventData, baseData: TelemetryBaseData): Promise<void>;

    /**
     * Sends telemetry custom event.
     *
     * @param event Custom event data.
     * @param baseData Base data for sending telemetry event.
     */
    sendCustomEvent(event: TelemetryCustomEventData, baseData: TelemetryBaseData): Promise<void>;
}

/**
 * Sends telemetry event using {@link telemetryApi}.
 *
 * @param event Telemetry event.
 */
const sendEvent = async (event: TelemetryEvent): Promise<void> => {
    try {
        const {
            syntheticId,
            appType,
            version,
            userAgent,
            props,
        } = event;

        /**
         * Re-map event data keys to match the API schema.
         * Note that in `TelemetryEvent` we either have pageview or event, but not both.
         */
        const data: TelemetryApiEventData = {
            synthetic_id: syntheticId,
            app_type: appType,
            version,
            user_agent: {
                device: userAgent.device && {
                    brand: userAgent.device.brand,
                    model: userAgent.device.model,
                },
                os: {
                    name: userAgent.os.name,
                    platform: userAgent.os.platform,
                    version: userAgent.os.version,
                },
            },
            pageview: 'pageview' in event ? {
                name: event.pageview.name,
                ref_name: event.pageview.refName,
            } : undefined,
            event: 'event' in event ? {
                name: event.event.name,
                ref_name: event.event.refName,
                action: event.event.action,
                label: event.event.label,
            } : undefined,
            props: props && {
                app_locale: props.appLocale,
                system_locale: props.systemLocale,
                logged_in: props.loggedIn,
                license_status: props.licenseStatus,
                subscription_duration: props.subscriptionDuration,
                theme: props.theme,
                experiment: 'event' in event ? event.event.experiment : undefined,
            },
        };

        await telemetryApi.sendEvent(data);
    } catch (e) {
        log.debug('[vpn.telemetryProvider]: Failed to send telemetry event', e);
    }
};

/**
 * Sends telemetry pageview event using {@link telemetryApi}.
 *
 * @param event Page view event data.
 * @param baseData Base data for sending telemetry event.
 */
const sendPageViewEvent = async (
    event: TelemetryPageViewEventData,
    baseData: TelemetryBaseData,
): Promise<void> => {
    const telemetryData: TelemetryPageViewEvent = {
        ...baseData,
        pageview: event,
    };

    await sendEvent(telemetryData);
};

/**
 * Sends telemetry custom event using {@link telemetryApi}.
 *
 * @param event Custom event data.
 * @param baseData Base data for sending telemetry event.
 */
const sendCustomEvent = async (
    event: TelemetryCustomEventData,
    baseData: TelemetryBaseData,
): Promise<void> => {
    const telemetryData: TelemetryCustomEvent = {
        ...baseData,
        event,
    };

    await sendEvent(telemetryData);
};

export const telemetryProvider: TelemetryProviderInterface = {
    sendPageViewEvent,
    sendCustomEvent,
};
