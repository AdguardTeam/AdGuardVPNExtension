import { CredentialsService } from '../../../src/background/credentials/credentialsService';
import type { VpnTokenData } from '../../../src/background/credentials/Credentials';
import { SubscriptionType } from '../../../src/lib/constants';

const storageImplementation: { [key: string]: unknown } = {};

const browserApiImplementation = {
    storage: {
        set: (key: string, data: unknown) => {
            storageImplementation[key] = data;
        },
        get: (key: string) => {
            return storageImplementation[key];
        },
    },
};

const premiumVpnTokenData: VpnTokenData = {
    token: '1234509876',
    licenseStatus: 'VALID',
    timeExpiresSec: 123457890,
    licenseKey: 'qwerty-12345-qwerty-12345',
    vpnSubscription: {
        next_bill_date_iso: '20240101',
        duration_v2: SubscriptionType.Yearly,
    },
};

const freeVpnTokenData: VpnTokenData = {
    token: '6789012345',
    licenseStatus: 'VALID',
    timeExpiresSec: 123457890,
    licenseKey: '',
    vpnSubscription: {
        next_bill_date_iso: '20240101',
        duration_v2: SubscriptionType.Yearly,
    },
};

// @ts-ignore
const credentialsService = new CredentialsService(browserApiImplementation);

describe('Credentials Service', () => {
    it('Check user is premium', async () => {
        await credentialsService.setVpnTokenToStorage(premiumVpnTokenData);
        let isPremiumUser = await credentialsService.isPremiumUser();
        expect(isPremiumUser).toBeTruthy();

        await credentialsService.setVpnTokenToStorage(freeVpnTokenData);
        isPremiumUser = await credentialsService.isPremiumUser();
        expect(isPremiumUser).toBeFalsy();
    });
});
