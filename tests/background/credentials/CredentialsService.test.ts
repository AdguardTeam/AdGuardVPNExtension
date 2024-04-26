import { CredentialsService } from '../../../src/background/credentials/credentialsService';
import type { VpnTokenData } from '../../../src/background/schema';
import { SubscriptionType } from '../../../src/common/constants';

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
    timeExpiresIso: new Date(Date.now()).toISOString(),
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
    timeExpiresIso: new Date(Date.now()).toISOString(),
    licenseKey: '',
    vpnSubscription: {
        next_bill_date_iso: '20240101',
        duration_v2: SubscriptionType.Yearly,
    },
};

// @ts-ignore - partly implementation
const credentialsService = new CredentialsService(browserApiImplementation);

jest.spyOn(credentialsService.browserApi.storage, 'set');
jest.spyOn(credentialsService.browserApi.storage, 'get');

describe('Credentials Service', () => {
    it('Test vpnTokenData caching', async () => {
        let vpnTokenData = await credentialsService.getVpnTokenFromStorage();
        expect(vpnTokenData).toBeNull();
        expect(credentialsService.browserApi.storage.get).toBeCalledTimes(1);

        vpnTokenData = await credentialsService.getVpnTokenFromStorage();
        expect(vpnTokenData).toBeNull();
        // storage.get was called one more time because there was no cached value
        expect(credentialsService.browserApi.storage.get).toBeCalledTimes(2);

        await credentialsService.setVpnTokenToStorage(premiumVpnTokenData);
        expect(credentialsService.browserApi.storage.set).toBeCalledTimes(1);

        vpnTokenData = await credentialsService.getVpnTokenFromStorage();
        expect(vpnTokenData).toBeDefined();
        expect(vpnTokenData).toBe(premiumVpnTokenData);
        // storage.get wasn't called one more time because the cached value was returned
        expect(credentialsService.browserApi.storage.get).toBeCalledTimes(2);
    });

    it('Check user is premium', async () => {
        await credentialsService.setVpnTokenToStorage(premiumVpnTokenData);
        let isPremiumUser = await credentialsService.isPremiumUser();
        expect(isPremiumUser).toBeTruthy();

        await credentialsService.setVpnTokenToStorage(freeVpnTokenData);
        isPremiumUser = await credentialsService.isPremiumUser();
        expect(isPremiumUser).toBeFalsy();
    });
});
