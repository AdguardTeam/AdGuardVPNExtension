import * as v from 'valibot';

import { TELEMETRY_API_URL } from '../config';
import {
    type TelemetryApiEventData,
    type SessionStartRequest,
    type SessionStartResponse,
    type TelemetryBaseData,
} from '../telemetry/telemetryTypes';
import { sessionStartResponseSchema } from '../schema/telemetry/sessionStartResponse';
import { type VariantCache } from '../abTestManager/ABTestManager';

import { Api, type ConfigInterface } from './Api';
import { type RequestProps } from './apiTypes';

/**
 * API URL prefix
 */
const API_URL_PREFIX = '/api';

/**
 * Telemetry API
 *
 * Documentation: projects/ADGUARD/repos/adguard-telemetry-service/browse
 */
class TelemetryApi extends Api {
    private static readonly SEND_EVENT: RequestProps = { path: 'v1/event', method: 'POST' };

    /**
     * Request properties for session_start endpoint.
     */
    private static readonly SEND_SESSION_START: RequestProps = { path: 'v1/session_start', method: 'POST' };

    public sendEvent = async (data: TelemetryApiEventData): Promise<void> => {
        const { path, method } = TelemetryApi.SEND_EVENT;

        const config: ConfigInterface = {
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            shouldTriggerServerErrorEvent: false,
        };

        await this.makeRequest(path, config, method);
    };

    /**
     * Sends a session_start request to the telemetry service.
     *
     * @param baseData Base telemetry data (syntheticId, appType, version, userAgent, props).
     * @param tests Map of experiment slots to experiment IDs for unassigned slots.
     *
     * @returns Session start response with variant assignments.
     */
    public sendSessionStart = async (
        baseData: TelemetryBaseData,
        tests: VariantCache,
    ): Promise<SessionStartResponse> => {
        const { path, method } = TelemetryApi.SEND_SESSION_START;

        const request: SessionStartRequest = {
            synthetic_id: baseData.syntheticId,
            app_type: baseData.appType,
            version: baseData.version,
            user_agent: {
                device: baseData.userAgent.device && {
                    brand: baseData.userAgent.device.brand,
                    model: baseData.userAgent.device.model,
                },
                os: {
                    name: baseData.userAgent.os.name,
                    platform: baseData.userAgent.os.platform,
                    version: baseData.userAgent.os.version,
                },
                browser: baseData.userAgent.browser,
            },
            props: baseData.props && {
                app_locale: baseData.props.appLocale,
                system_locale: baseData.props.systemLocale,
                theme: baseData.props.theme,
                logged_in: baseData.props.loggedIn,
                license_status: baseData.props.licenseStatus,
                subscription_duration: baseData.props.subscriptionDuration,
            },
            tests,
        };

        const config: ConfigInterface = {
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
            shouldTriggerServerErrorEvent: false,
        };

        const response = await this.makeRequest<SessionStartResponse>(path, config, method);

        return v.parse(sessionStartResponseSchema, response);
    };
}

export const telemetryApi = new TelemetryApi(`${TELEMETRY_API_URL}${API_URL_PREFIX}`);
