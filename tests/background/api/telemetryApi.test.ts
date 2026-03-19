import {
    vi,
    describe,
    beforeAll,
    afterAll,
    afterEach,
    it,
    expect,
} from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { telemetryApi } from '../../../src/background/api/telemetryApi';
import { type TelemetryBaseData } from '../../../src/background/telemetry/telemetryTypes';
import {
    TelemetryLicenseStatus,
    TelemetrySubscriptionDuration,
    TelemetryTheme,
} from '../../../src/background/telemetry/telemetryEnums';

const fetchMocker = createFetchMock(vi);

const sampleBaseData: TelemetryBaseData = {
    syntheticId: 'abcd1234',
    appType: 'VPN_EXTENSION',
    version: '5.2.300.4',
    userAgent: {
        os: {
            name: 'Mac' as never,
            version: '15.1',
        },
        browser: {
            name: 'Chrome',
            version: '98',
        },
    },
    props: {
        appLocale: 'en-US',
        systemLocale: 'en-US',
        loggedIn: true,
        licenseStatus: TelemetryLicenseStatus.Premium,
        subscriptionDuration: TelemetrySubscriptionDuration.Monthly,
        theme: TelemetryTheme.System,
    },
};

const sampleTests = {
    experiment_1: 'AG-001-feature-a',
};

describe('TelemetryApi.sendSessionStart', () => {
    beforeAll(() => {
        fetchMocker.enableMocks();
    });

    afterAll(() => {
        fetchMocker.disableMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
        fetchMocker.resetMocks();
    });

    it('should POST to v1/session_start with correct body', async () => {
        const mockResponse = {
            versions: {
                experiment_1: {
                    experiment_name: 'AG-001-feature-a',
                    version_name: 'AG-001-feature-a-variant_def',
                },
            },
        };

        fetchMocker.mockResponseOnce({
            body: JSON.stringify(mockResponse),
            status: 200,
        });

        const result = await telemetryApi.sendSessionStart(sampleBaseData, sampleTests);

        expect(fetchMocker).toHaveBeenCalledTimes(1);

        const [url, options] = fetchMocker.mock.calls[0] as [string, RequestInit];
        expect(url).toContain('v1/session_start');
        expect(options.method).toBe('POST');

        const requestBody = JSON.parse(options.body as string);
        expect(requestBody).toEqual({
            synthetic_id: 'abcd1234',
            app_type: 'VPN_EXTENSION',
            version: '5.2.300.4',
            user_agent: {
                browser: {
                    name: 'Chrome',
                    version: '98',
                },
                os: {
                    name: 'Mac',
                    version: '15.1',
                },
            },
            props: {
                app_locale: 'en-US',
                system_locale: 'en-US',
                logged_in: true,
                license_status: 'PREMIUM',
                subscription_duration: 'MONTHLY',
                theme: 'SYSTEM',
            },
            tests: {
                experiment_1: 'AG-001-feature-a',
            },
        });
        expect(result).toEqual(mockResponse);
    });

    it('should return empty versions when server returns versions: {}', async () => {
        fetchMocker.mockResponseOnce({
            body: JSON.stringify({ versions: {} }),
            status: 200,
        });

        const result = await telemetryApi.sendSessionStart(sampleBaseData, sampleTests);

        expect(result).toEqual({ versions: {} });
    });

    it('should throw on server error', async () => {
        fetchMocker.mockResponseOnce({
            body: JSON.stringify({ error: 'Internal Server Error' }),
            status: 500,
        });

        await expect(telemetryApi.sendSessionStart(sampleBaseData, sampleTests)).rejects.toThrow();
    });
});
