import {
    vi,
    describe,
    afterEach,
    it,
    expect,
} from 'vitest';

import { ForwarderUrlQueryKey } from '../../src/background/config';
import { messenger } from '../../src/common/messenger';

describe('Messenger purchase links', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should use the settings forwarder query for the settings promo', async () => {
        const openForwarderUrlWithEmailSpy = vi
            .spyOn(messenger, 'openForwarderUrlWithEmail')
            .mockResolvedValue(undefined);

        await messenger.openPremiumPromoPageFromSettings();

        expect(openForwarderUrlWithEmailSpy).toHaveBeenCalledWith(ForwarderUrlQueryKey.UpgradeLicenseSettings);
    });
});
