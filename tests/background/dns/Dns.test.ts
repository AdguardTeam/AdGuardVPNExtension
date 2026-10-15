import {
    vi,
    describe,
    beforeEach,
    it,
    expect,
} from 'vitest';

import { DEFAULT_PROFILE_SETTINGS } from '../../../src/background/schema';
import { dns } from '../../../src/background/dns';
import { profilesService } from '../../../src/background/profiles';
import { ADGUARD_DNS_ID, DEFAULT_DNS_SERVER } from '../../../src/common/dnsConstants';
import { notifier } from '../../../src/common/notifier';

vi.mock('../../../src/background/profiles', () => ({
    profilesService: {
        getProfileSettings: vi.fn(),
        updateProfileSettings: vi.fn().mockImplementation(
            async (_id: string, _patch: unknown, onApply?: () => Promise<void>) => {
                if (onApply) {
                    await onApply();
                }
            },
        ),
    },
    profileStateService: {},
}));

describe('Dns applyProfile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(profilesService.getProfileSettings).mockReturnValue({
            ...DEFAULT_PROFILE_SETTINGS,
            selectedDnsServer: DEFAULT_DNS_SERVER.id,
            customDnsServers: [],
        });
    });

    it('should notify the tunnel when the profile changes the DNS server', async () => {
        // Put the session state on another server first.
        await dns.setDnsServer('default', ADGUARD_DNS_ID);

        const notifierSpy = vi.spyOn(notifier, 'notifyListeners');
        notifierSpy.mockClear();

        await dns.applyProfile('profile-1');

        expect(notifierSpy).toHaveBeenCalledWith(
            notifier.types.DNS_SERVER_SET,
            expect.any(String),
        );
    });
});
