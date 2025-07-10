import { TELEMETRY_API_URL } from '../config';
import { type TelemetryApiEventData } from '../telemetry/telemetryTypes';

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
}

export const telemetryApi = new TelemetryApi(`${TELEMETRY_API_URL}${API_URL_PREFIX}`);
