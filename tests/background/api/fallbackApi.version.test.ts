/**
 * Tests for the numeric version in the DoH hostname (AG-60710).
 *
 * The backup API zone resolves hostnames with a strictly numeric version only
 * (`av<major>-<minor>-<patch>`). Before the fix, a beta build queried
 * the zone with a prerelease version (`av2-12-0-beta-1`), the zone answered
 * SERVFAIL, and the fallback url was never cached.
 */
import {
    vi,
    describe,
    it,
    expect,
    afterEach,
    type MockedFunction,
} from 'vitest';
import axios from 'axios';

import { FallbackApi } from '../../../src/background/api/fallbackApi';
import { stateStorage } from '../../../src/background/stateStorage';

// Simulates a beta build: CI stamps the version into package.json before building.
const { BETA_PJSON_VERSION } = vi.hoisted(() => ({ BETA_PJSON_VERSION: '2.12.0-beta.1' }));

vi.mock('../../../package.json', () => ({
    default: { version: BETA_PJSON_VERSION },
}));

vi.mock('axios');

vi.mock('../../../src/background/authentication/authService', async () => ({
    authService: {
        isAuthenticated: vi.fn().mockResolvedValue(false),
    },
}));

/**
 * Parses the QNAME out of a raw DNS query packet (12-byte header, then length-prefixed labels).
 *
 * @param packet DNS wire-format packet.
 *
 * @returns Dotted QNAME.
 */
const parseQname = (packet: Buffer): string => {
    let offset = 12;
    const labels: string[] = [];
    while (offset < packet.length && packet[offset] !== 0) {
        const len = packet[offset];
        labels.push(packet.subarray(offset + 1, offset + 1 + len).toString());
        offset += len + 1;
    }
    return labels.join('.');
};

describe('FallbackApi DoH hostname for a beta build', () => {
    afterEach(() => {
        vi.clearAllMocks();
        // @ts-expect-error - reset stateStorage to default
        stateStorage.state.fallbackInfo = null;
    });

    it('queries the zone with numeric version components only', async () => {
        (axios.post as MockedFunction<typeof axios.post>).mockRejectedValue({ status: 400 });

        const fallbackApi = new FallbackApi('vpn_api.com', 'auth_api.com', 'forwarder_api.com');
        await fallbackApi.init();

        const postCalls = (axios.post as MockedFunction<typeof axios.post>).mock.calls;
        expect(postCalls.length).toBeGreaterThan(0);

        const qnames = postCalls.map((call) => parseQname(call[1] as Buffer));

        expect(qnames).toContain('v1.at-ext.av2-12-0.anon.bkp-api.adguard-vpn.online');
        expect(qnames).toContain('v1.at-ext.av2-12-0.anon.bkp-auth.adguard-vpn.online');
        qnames.forEach((qname) => {
            expect(qname).toMatch(/^v1\.at-ext\.av\d+(-\d+)+\.(anon|free|pro)\.bkp-(api|auth)\.adguard-vpn\.online$/);
        });
    });
});
