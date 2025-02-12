import { TELEMETRY_API_URL } from '../config';
import { type TelemetryApiEventData } from '../telemetry/telemetryTypes';

import { Api } from './Api';
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

        const headers = {
            'Content-Type': 'application/json',
        };
        const body = JSON.stringify(data);

        await this.makeRequest(path, { headers, body }, method);
    };
}

export const telemetryApi = new TelemetryApi(`${TELEMETRY_API_URL}${API_URL_PREFIX}`);
