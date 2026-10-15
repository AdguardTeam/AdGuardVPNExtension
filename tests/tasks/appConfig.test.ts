import {
    describe,
    it,
    expect,
    vi,
    afterAll,
} from 'vitest';

import { genAppConfig } from '../../tasks/appConfig';
import { Browser, Env, StageEnv } from '../../tasks/consts';

/**
 * Sets the environment variables required for the app config generation
 * before the config module reads `process.env`.
 *
 * @returns Values of the environment variables before the tests.
 */
const envVarsBeforeTests = vi.hoisted(() => {
    const originalEnvVars: Record<string, string | undefined> = {
        FORWARDER_DOMAIN: process.env.FORWARDER_DOMAIN,
        VPN_API_URL: process.env.VPN_API_URL,
        AUTH_API_URL: process.env.AUTH_API_URL,
    };

    process.env.FORWARDER_DOMAIN = 'forwarder.test.com';
    process.env.VPN_API_URL = 'api.test.com';
    process.env.AUTH_API_URL = 'auth.test.com';

    return originalEnvVars;
});

afterAll(() => {
    Object.entries(envVarsBeforeTests).forEach(([name, value]) => {
        if (value === undefined) {
            delete process.env[name];
        } else {
            process.env[name] = value;
        }
    });
});

describe('genAppConfig purchase links', () => {
    const appConfig = genAppConfig(Browser.Chrome, StageEnv.Prod, Env.Release);

    it('should attribute the purchase link from the popup to the popup', () => {
        expect(appConfig.UPGRADE_LICENSE).toBe('action=buy_license&from=popup&app=vpn_extension');
    });

    it('should attribute the purchase link from the settings to the settings', () => {
        expect(appConfig.UPGRADE_LICENSE_SETTINGS).toBe('action=buy_license&from=settings&app=vpn_extension');
    });
});
