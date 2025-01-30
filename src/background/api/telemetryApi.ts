import { type TelemetryEvent } from '../providers/telemetryProvider';

import { Api } from './Api';
import { type RequestProps } from './apiTypes';
import { fallbackApi } from './fallbackApi';

/**
 * API URL prefix
 */
const API_URL_PREFIX = '/api';

/**
 * Application type sent in telemetry events
 */
const APP_TYPE = 'VPN_EXTENSION';

/**
 * Telemetry API
 *
 * Documentation: projects/ADGUARD/repos/adguard-telemetry-service/browse
 */
class TelemetryApi extends Api {
    SEND_EVENT: RequestProps = { path: 'v1/event', method: 'POST' };

    sendEvent = async (event: TelemetryEvent): Promise<void> => {
        const { path, method } = this.SEND_EVENT;

        const {
            syntheticId,
            version,
            userAgent,
            props,
        } = event;

        const headers = {
            'Content-Type': 'application/json',
        };

        /**
         * Re-map event data keys to match the API schema.
         * Note that in `TelemetryEvent` we either have pageview or event, but not both.
         */
        const body = JSON.stringify({
            synthetic_id: syntheticId,
            app_type: APP_TYPE,
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
            pageview: 'pageview' in event && {
                name: event.pageview.name,
                ref_name: event.pageview.refName,
            },
            event: 'event' in event && {
                name: event.event.name,
                ref_name: event.event.refName,
                action: event.event.action,
                label: event.event.label,
            },
            props: props && {
                app_locale: props.appLocale,
                system_locale: props.systemLocale,
                logged_in: props.loggedIn,
                license_status: props.licenseStatus,
                subscription_duration: props.subscriptionDuration,
                theme: props.theme,
            },
        });

        await this.makeRequest(path, { headers, body }, method);
    };
}

export const telemetryApi = new TelemetryApi(async () => {
    const telemetryApiBaseUrl = await fallbackApi.getTelemetryApiUrl();
    return `${telemetryApiBaseUrl}${API_URL_PREFIX}`;
});
