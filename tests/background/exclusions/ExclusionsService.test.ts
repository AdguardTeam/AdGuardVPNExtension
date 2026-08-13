import {
    vi,
    describe,
    beforeEach,
    afterEach,
    it,
    expect,
} from 'vitest';

import { ExclusionsService } from '../../../src/background/exclusions/ExclusionsService';
import { ExclusionsMode, ExclusionState, ExclusionsType } from '../../../src/common/exclusionsConstants';
import { notifier } from '../../../src/common/notifier';
import { servicesManager } from '../../../src/background/exclusions/services/ServicesManager';
import { proxy } from '../../../src/background/proxy';

const stubProfileSettings = {
    exclusions: {
        inverted: false,
        regular: [],
        selective: [],
    },
};

vi.mock('../../../src/background/profiles', () => {
    return {
        __esModule: true,
        profilesService: {
            getActiveProfileId: () => 'default',
            resolveProfileId: async (id?: string) => id ?? 'default',
            getProfileSettings: () => structuredClone(stubProfileSettings),
            getProfileInfoList: async () => ({
                profiles: [{ id: 'default', name: '' }],
                activeProfileId: 'default',
            }),
            updateProfileSettings: async (
                _id: string,
                _patch: unknown,
                onApply?: () => Promise<void>,
            ) => {
                if (onApply) {
                    await onApply();
                }
            },
        },
    };
});

vi.mock('../../../src/background/settings', () => {
    return {
        __esModule: true,
        settings: {},
    };
});

vi.mock('../../../src/background/api/fallbackApi', () => {
    return {
        __esModule: true,
        fallbackApi: {
            getApiUrlsExclusions: () => {
                return [];
            },
        },
    };
});

vi.mock('../../../src/background/providers/vpnProvider', () => {
    return {
        __esModule: true,
        vpnProvider: {
            getExclusionsServices: async () => Promise.resolve({}),
            getExclusionsServicesDomains: async () => Promise.resolve({}),
        },
    };
});

const SERVICE_DATA = {
    categories: {
        id: 'SHOP',
        name: 'Shopping',
    },
    iconUrl: 'https://test.example.com/icon?domain=aliexpress.com',
    serviceId: 'aliexpress',
    serviceName: 'Aliexpress',
    modifiedTime: '2021-09-14T10:23:00+0000',
    domains: [
        'aliexpress.com',
        'aliexpress.ru',
    ],
};

const getServicesDtoMock = vi.fn();
servicesManager.getServicesDto = getServicesDtoMock;
getServicesDtoMock.mockResolvedValue([SERVICE_DATA]);

const getServiceMock = vi.fn();
servicesManager.getService = getServiceMock;
getServiceMock.mockResolvedValue(SERVICE_DATA);

const getServicesMock = vi.fn();
servicesManager.getServices = getServicesMock;
getServicesMock.mockResolvedValue({ aliexpress: SERVICE_DATA });

const getIndexedServicesMock = vi.fn();
servicesManager.getIndexedServices = getIndexedServicesMock;
getIndexedServicesMock.mockResolvedValue({
    'aliexpress.com': 'aliexpress',
    'aliexpress.ru': 'aliexpress',
});

describe('ExclusionsService', () => {
    beforeEach(async () => {
        await proxy.init();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('empty after init', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();

        const exclusionsData = await exclusionsService.getExclusions();
        expect(exclusionsData.children).toHaveLength(0);
        expect(await exclusionsService.getMode('default')).toBeTruthy();
    });

    it('returns true if domains are not excluded ', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();

        await expect(exclusionsService.isVpnEnabledByUrl('http://example.org')).resolves.toBeTruthy();
        await expect(exclusionsService.isVpnEnabledByUrl('https://example.com')).resolves.toBeTruthy();
        await expect(exclusionsService.isVpnEnabledByUrl('example.org')).resolves.toBeTruthy();
    });

    it('returns false if domains are excluded', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();

        await exclusionsService.addUrlToExclusions('default', 'example.org');

        await expect(exclusionsService.isVpnEnabledByUrl('http://example.org')).resolves.toBeFalsy();
        await expect(exclusionsService.isVpnEnabledByUrl('https://example.org')).resolves.toBeFalsy();
        await expect(exclusionsService.isVpnEnabledByUrl('https://example.org/test')).resolves.toBeFalsy();
        await expect(exclusionsService.isVpnEnabledByUrl('https://mail.example.org/test')).resolves.toBeFalsy();
        await expect(exclusionsService.isVpnEnabledByUrl('https://example.com')).resolves.toBeTruthy();
    });

    it('should toggle exclusion group', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();

        await exclusionsService.addUrlToExclusions('default', 'https://example.org');

        // check init state
        await expect(exclusionsService.isVpnEnabledByUrl('https://example.org')).resolves.toBeFalsy();
        await expect(exclusionsService.isVpnEnabledByUrl('https://test.example.org')).resolves.toBeFalsy();

        // toggle
        await exclusionsService.toggleExclusionState('default', 'example.org');

        // check toggled state
        await expect(exclusionsService.isVpnEnabledByUrl('https://example.org')).resolves.toBeTruthy();
        await expect(exclusionsService.isVpnEnabledByUrl('https://test.example.org')).resolves.toBeTruthy();

        // toggle
        await exclusionsService.toggleExclusionState('default', 'example.org');

        // check toggled state
        await expect(exclusionsService.isVpnEnabledByUrl('https://example.org')).resolves.toBeFalsy();
        await expect(exclusionsService.isVpnEnabledByUrl('https://test.example.org')).resolves.toBeFalsy();
    });

    it('should add three exclusions if more than two level hostname added', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();

        await exclusionsService.addUrlToExclusions('default', 'test.example.org');

        const exclusions = await exclusionsService.getExclusions();
        expect(exclusions.children[0].children).toHaveLength(3);
        expect(exclusions.children[0].children.map((ex) => ex.hostname)).toEqual([
            'example.org',
            '*.example.org',
            'test.example.org',
        ]);
    });

    it('should add two exclusions if hostname with wildcard added', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();
        const notifySpy = vi.spyOn(notifier, 'notifyListeners');

        await exclusionsService.addUrlToExclusions('default', '*.example.org');
        const exclusions = await exclusionsService.getExclusions();
        expect(exclusions.children[0].children).toHaveLength(2);
        expect(exclusions.children[0].children.map((ex) => ex.hostname)).toEqual([
            'example.org',
            '*.example.org',
        ]);
        expect(notifySpy).toHaveBeenCalledWith(notifier.types.EXCLUSIONS_DATA_UPDATED, 'default');
    });

    describe('should add toplevel domains', () => {
        it('works for one part tld', async () => {
            const exclusionsService = new ExclusionsService();
            await exclusionsService.init();

            await exclusionsService.addUrlToExclusions('default', 'com');

            const exclusions = await exclusionsService.getExclusions();
            expect(exclusions.children[0].children).toHaveLength(2);
            expect(exclusions.children[0].children.map((ex) => ex.hostname)).toEqual([
                'com',
                '*.com',
            ]);
        });

        it('works for two parts tld', async () => {
            const exclusionsService = new ExclusionsService();
            await exclusionsService.init();

            await exclusionsService.addUrlToExclusions('default', 'blogspot.ru');
            const exclusions = await exclusionsService.getExclusions();

            expect(exclusions.children[0].children).toHaveLength(2);
            expect(exclusions.children[0].children.map((ex) => ex.hostname)).toEqual([
                'blogspot.ru',
                '*.blogspot.ru',
            ]);
        });
    });

    describe('normalizes leading-dot exclusion input', () => {
        it('normalizes leading-dot TLD before adding exclusions', async () => {
            const exclusionsService = new ExclusionsService();
            await exclusionsService.init();

            const addedCount = await exclusionsService.addUrlToExclusions('default', '.com');

            expect(addedCount).toBe(2);
            const exclusions = await exclusionsService.getExclusions();
            expect(exclusions.children[0].children.map((ex) => ex.hostname)).toEqual([
                'com',
                '*.com',
            ]);
            expect(await exclusionsService.getRegularExclusions('default')).toBe('com\n*.com');
            await expect(exclusionsService.isVpnEnabledByUrl('https://example.com')).resolves.toBe(false);
        });

        it('normalizes leading-dot domain before adding exclusions', async () => {
            const exclusionsService = new ExclusionsService();
            await exclusionsService.init();

            const addedCount = await exclusionsService.addUrlToExclusions('default', '.example.org');

            expect(addedCount).toBe(2);
            const exclusions = await exclusionsService.getExclusions();
            expect(exclusions.children[0].children.map((ex) => ex.hostname)).toEqual([
                'example.org',
                '*.example.org',
            ]);
        });

        it('rejects wildcard-leading-dot and leading-dot IP exclusions', async () => {
            const exclusionsService = new ExclusionsService();
            await exclusionsService.init();

            await expect(exclusionsService.addUrlToExclusions('default', '*..com')).resolves.toBe(0);
            await expect(exclusionsService.addUrlToExclusions('default', '.127.0.0.1')).resolves.toBe(0);

            const exclusions = await exclusionsService.getExclusions();
            expect(exclusions.children).toHaveLength(0);
        });
    });

    describe('batch add normalization and regression', () => {
        it('normalizes batch exclusions and drops invalid leading-dot entries', async () => {
            const exclusionsService = new ExclusionsService();
            await exclusionsService.init();

            const addedCount = await exclusionsService.addGeneralExclusions('default', [
                '.com',
                '.example.org',
                '*..net',
            ]);

            expect(addedCount).toBe(4);
            const exportedExclusions = await exclusionsService.getRegularExclusions('default');
            expect(exportedExclusions.split('\n')).toEqual([
                'com',
                'example.org',
            ]);
            const exclusions = await exclusionsService.getExclusions();
            expect(exclusions.children[0].children.map((child) => child.hostname)).toEqual(['com', '*.com']);
            expect(exclusions.children[1].children.map((child) => child.hostname)).toEqual([
                'example.org',
                '*.example.org',
            ]);
        });

        it('keeps already-valid TLD and wildcard behavior unchanged', async () => {
            const exclusionsService = new ExclusionsService();
            await exclusionsService.init();

            await exclusionsService.addUrlToExclusions('default', 'com');
            await exclusionsService.addUrlToExclusions('default', '*.example.org');

            const exclusions = await exclusionsService.getExclusions();
            expect(exclusions.children.map((child) => child.hostname)).toEqual(['com', 'example.org']);
            expect(exclusions.children[0].children.map((child) => child.hostname)).toEqual(['com', '*.com']);
            expect(exclusions.children[1].children.map((child) => child.hostname)).toEqual([
                'example.org',
                '*.example.org',
            ]);
        });
    });

    it('punycode test', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();
        await exclusionsService.setMode('default', ExclusionsMode.Regular);
        expect(await exclusionsService.getMode('default')).toBeTruthy();

        await exclusionsService.addUrlToExclusions('default', 'https://сайт.рф/');
        await expect(exclusionsService.isVpnEnabledByUrl('https://xn--80aswg.xn--p1ai/')).resolves.toBeFalsy();
        await expect(exclusionsService.isVpnEnabledByUrl('xn--80aswg.xn--p1ai')).resolves.toBeFalsy();
        await expect(exclusionsService.isVpnEnabledByUrl('сайт.рф')).resolves.toBeFalsy();

        await exclusionsService.addUrlToExclusions('default', 'http://xn--e1afmkfd.xn--p1ai/');
        await expect(exclusionsService.isVpnEnabledByUrl('пример.рф')).resolves.toBeFalsy();
        await expect(exclusionsService.isVpnEnabledByUrl('http://xn--e1afmkfd.xn--p1ai/')).resolves.toBeFalsy();
        await expect(exclusionsService.isVpnEnabledByUrl('xn--e1afmkfd.xn--p1ai')).resolves.toBeFalsy();
    });

    it('manually add service by domain', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();
        const notifySpy = vi.spyOn(notifier, 'notifyListeners');
        await exclusionsService.addUrlToExclusions('default', 'aliexpress.ru');
        const exclusions = await exclusionsService.getExclusions();

        // the only added domain group should be enabled and rest are disabled
        expect(exclusions.children).toHaveLength(1);
        expect(exclusions.children[0].type).toEqual(ExclusionsType.Service);
        expect(exclusions.children[0].id).toEqual('aliexpress');
        expect(exclusions.children[0].state).toEqual(ExclusionState.PartlyEnabled);
        expect(exclusions.children[0].children).toHaveLength(2);
        expect(exclusions.children[0].children[0].id).toEqual('aliexpress.com');
        expect(exclusions.children[0].children[0].state).toEqual(ExclusionState.Disabled);
        expect(exclusions.children[0].children[1].id).toEqual('aliexpress.ru');
        expect(exclusions.children[0].children[1].state).toEqual(ExclusionState.Enabled);
        expect(notifySpy).toHaveBeenCalledWith(notifier.types.EXCLUSIONS_DATA_UPDATED, 'default');
    });

    it('reset service data test', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();
        await exclusionsService.addUrlToExclusions('default', 'aliexpress.ru');
        await exclusionsService.addUrlToExclusions('default', 'test.aliexpress.ru');
        let exclusions = await exclusionsService.getExclusions();

        expect(exclusions.children[0].children[1].children[2].hostname).toEqual('test.aliexpress.ru');
        expect(exclusions.children[0].children[1].children[2].state)
            .toEqual(ExclusionState.Enabled);
        const subdomainExclusionId = exclusions.children[0].children[1].children[2].id;
        // disable test.aliexpress.ru
        await exclusionsService.toggleExclusionState('default', subdomainExclusionId);
        exclusions = await exclusionsService.getExclusions();
        expect(exclusions.children[0].children[1].children[2].state)
            .toEqual(ExclusionState.Disabled);

        // reset service data
        await exclusionsService.resetServiceData('default', 'aliexpress');
        exclusions = await exclusionsService.getExclusions();

        expect(exclusions.children).toHaveLength(1);
        expect(exclusions.children[0].type).toEqual(ExclusionsType.Service);
        expect(exclusions.children[0].id).toEqual('aliexpress');
        expect(exclusions.children[0].state).toEqual(ExclusionState.Enabled);
        expect(exclusions.children[0].children).toHaveLength(2);
        expect(exclusions.children[0].children[0].id).toEqual('aliexpress.com');
        expect(exclusions.children[0].children[0].state).toEqual(ExclusionState.Enabled);
        expect(exclusions.children[0].children[1].id).toEqual('aliexpress.ru');
        expect(exclusions.children[0].children[1].state).toEqual(ExclusionState.Enabled);
        expect(exclusions.children[0].children[1].children).toHaveLength(3);
        expect(exclusions.children[0].children[1].children[2].hostname).toEqual('test.aliexpress.ru');
        // reset service doesn't change manually added subdomain exclusion state
        expect(exclusions.children[0].children[1].children[2].state)
            .toEqual(ExclusionState.Disabled);
    });

    it('disableVpnByUrl and enableVpnByUrl test', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();

        await exclusionsService.disableVpnByUrl('example.org');
        let exclusions = await exclusionsService.getExclusions();

        expect(exclusions.children).toHaveLength(1);
        expect(exclusions.children[0].hostname).toEqual('example.org');
        expect(exclusions.children[0].state).toEqual(ExclusionState.Enabled);

        await exclusionsService.enableVpnByUrl('example.org');
        exclusions = await exclusionsService.getExclusions();

        expect(exclusions.children).toHaveLength(1);
        expect(exclusions.children[0].hostname).toEqual('example.org');
        expect(exclusions.children[0].state).toEqual(ExclusionState.PartlyEnabled);
        expect(exclusions.children[0].children[0].hostname).toEqual('example.org');
        expect(exclusions.children[0].children[0].state).toEqual(ExclusionState.Disabled);
    });

    it('disableVpnByUrl and enableVpnByUrl test for subdomains', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();

        await exclusionsService.addUrlToExclusions('default', 'example.org');

        await exclusionsService.enableVpnByUrl('test.example.org');
        let exclusions = await exclusionsService.getExclusions();
        expect(exclusions.children[0].hostname).toEqual('example.org');
        expect(exclusions.children[0].state).toEqual(ExclusionState.PartlyEnabled);
        expect(exclusions.children[0].children).toHaveLength(2);
        expect(exclusions.children[0].children[0].hostname).toEqual('example.org');
        expect(exclusions.children[0].children[0].state).toEqual(ExclusionState.Enabled);
        expect(exclusions.children[0].children[1].hostname).toEqual('*.example.org');
        expect(exclusions.children[0].children[1].state).toEqual(ExclusionState.Disabled);

        await exclusionsService.disableVpnByUrl('test.example.org');
        exclusions = await exclusionsService.getExclusions();
        expect(exclusions.children[0].hostname).toEqual('example.org');
        expect(exclusions.children[0].state).toEqual(ExclusionState.PartlyEnabled);
        expect(exclusions.children[0].children).toHaveLength(3);
        expect(exclusions.children[0].children[0].hostname).toEqual('example.org');
        expect(exclusions.children[0].children[0].state).toEqual(ExclusionState.Enabled);
        expect(exclusions.children[0].children[1].hostname).toEqual('*.example.org');
        expect(exclusions.children[0].children[1].state).toEqual(ExclusionState.Disabled);
        expect(exclusions.children[0].children[2].hostname).toEqual('test.example.org');
        expect(exclusions.children[0].children[2].state).toEqual(ExclusionState.Enabled);

        await exclusionsService.enableVpnByUrl('test.example.org');
        exclusions = await exclusionsService.getExclusions();
        expect(exclusions.children[0].children).toHaveLength(3);
        expect(exclusions.children[0].children[0].hostname).toEqual('example.org');
        expect(exclusions.children[0].children[0].state).toEqual(ExclusionState.Enabled);
        expect(exclusions.children[0].children[1].hostname).toEqual('*.example.org');
        expect(exclusions.children[0].children[1].state).toEqual(ExclusionState.Disabled);
        expect(exclusions.children[0].children[2].hostname).toEqual('test.example.org');
        expect(exclusions.children[0].children[2].state).toEqual(ExclusionState.Disabled);
    });

    it('should remove group if main domain has been removed', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();
        await exclusionsService.addUrlToExclusions('default', 'aliexpress.com');
        await exclusionsService.addUrlToExclusions('default', 'test.com');
        let exclusions = await exclusionsService.getExclusions();

        expect(exclusions.children).toHaveLength(2);
        expect(exclusions.children[0].children[0].children[0].hostname).toEqual('aliexpress.com');
        let mainDomainExclusionId = exclusions.children[0].children[0].children[0].id;

        await exclusionsService.removeExclusion('default', mainDomainExclusionId);
        exclusions = await exclusionsService.getExclusions();

        expect(exclusions.children).toHaveLength(2);
        expect(exclusions.children[0].id).toEqual('aliexpress');
        expect(exclusions.children[0].children).toHaveLength(1);
        expect(exclusions.children[0].children[0].id).toEqual('aliexpress.ru');
        mainDomainExclusionId = exclusions.children[0].children[0].children[0].id;
        expect(exclusions.children[1].id).toEqual('test.com');

        await exclusionsService.removeExclusion('default', mainDomainExclusionId);
        exclusions = await exclusionsService.getExclusions();
        expect(exclusions.children).toHaveLength(1);
        expect(exclusions.children[0].id).toEqual('test.com');

        mainDomainExclusionId = exclusions.children[0].children[0].id;
        await exclusionsService.removeExclusion('default', mainDomainExclusionId);
        exclusions = await exclusionsService.getExclusions();

        expect(exclusions.children).toHaveLength(0);
    });

    it('should stay group if only main domain presented', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();
        await exclusionsService.addUrlToExclusions('default', 'example.org');
        let exclusions = await exclusionsService.getExclusions();

        expect(exclusions.children).toHaveLength(1);
        expect(exclusions.children[0].hostname).toEqual('example.org');
        expect(exclusions.children[0].type).toEqual(ExclusionsType.Group);
        expect(exclusions.children[0].children[1].hostname).toEqual('*.example.org');

        const allSubdomainsExclusionId = exclusions.children[0].children[1].id;
        await exclusionsService.removeExclusion('default', allSubdomainsExclusionId);
        exclusions = await exclusionsService.getExclusions();

        expect(exclusions.children).toHaveLength(1);
        expect(exclusions.children[0].hostname).toEqual('example.org');
        expect(exclusions.children[0].type).toEqual(ExclusionsType.Group);
        expect(exclusions.children[0].children).toHaveLength(1);
        expect(exclusions.children[0].children[0].hostname).toEqual('example.org');
    });

    it('ip address should be a separate exclusion', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();
        const notifySpy = vi.spyOn(notifier, 'notifyListeners');
        await exclusionsService.addUrlToExclusions('default', '192.168.11.1');
        const exclusions = await exclusionsService.getExclusions();

        expect(exclusions.children).toHaveLength(1);
        expect(exclusions.children[0].type).toEqual(ExclusionsType.Exclusion);
        expect(exclusions.children[0].hostname).toEqual('192.168.11.1');
        expect(notifySpy).toHaveBeenCalledWith(notifier.types.EXCLUSIONS_DATA_UPDATED, 'default');
    });

    it('able to restore removed exclusions', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();
        await exclusionsService.addUrlToExclusions('default', 'example.org');
        await exclusionsService.addUrlToExclusions('default', 'example.com');

        const exclusions = await exclusionsService.getExclusions();
        expect(exclusions.children).toHaveLength(2);

        await exclusionsService.removeExclusion('default', exclusions.children[0].id);
        const updatedExclusions = await exclusionsService.getExclusions();
        expect(updatedExclusions.children).toHaveLength(1);

        await exclusionsService.restoreExclusions('default');
        const restoredExclusions = await exclusionsService.getExclusions();
        expect(restoredExclusions).toEqual(exclusions);
    });

    it('able to restore previous state of exclusions after new exclusion added', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();
        await exclusionsService.addUrlToExclusions('default', 'example.org');
        const exclusions = await exclusionsService.getExclusions();

        await exclusionsService.addUrlToExclusions('default', 'example.com');
        const updatedExclusions = await exclusionsService.getExclusions();
        expect(updatedExclusions.children).toHaveLength(2);

        await exclusionsService.restoreExclusions('default');
        const restoredExclusions = await exclusionsService.getExclusions();
        expect(restoredExclusions).toEqual(exclusions);
    });

    it('keep state of existing exclusions in service after new exclusion added to service', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();
        await exclusionsService.addUrlToExclusions('default', '*.ott.yandex.ru');
        await exclusionsService.addUrlToExclusions('default', 'yastatic.net');
        const exclusions = await exclusionsService.getExclusions();

        expect(exclusions.children).toHaveLength(2);
        expect(exclusions.children[0].id).toEqual('yandex.ru');
        expect(exclusions.children[0].state).toEqual(ExclusionState.PartlyEnabled);
        expect(exclusions.children[0].children[0].hostname).toEqual('yandex.ru');
        expect(exclusions.children[0].children[0].state).toEqual(ExclusionState.Disabled);
        expect(exclusions.children[0].children[2].hostname).toEqual('*.ott.yandex.ru');
        expect(exclusions.children[0].children[2].state).toEqual(ExclusionState.Enabled);

        expect(exclusions.children[1].id).toEqual('yastatic.net');
        expect(exclusions.children[1].state).toEqual(ExclusionState.Enabled);
    });

    describe('reactivation count', () => {
        it('reactivates an existing disabled exclusion and returns 1', async () => {
            const exclusionsService = new ExclusionsService();
            await exclusionsService.init();

            // Adding a subdomain auto-creates "example.org" and "*.example.org"
            // as Disabled companion exclusions.
            await exclusionsService.addUrlToExclusions('default', 'foo.example.org');

            let exclusions = await exclusionsService.getExclusions();
            expect(exclusions.children[0].children[0].hostname).toBe('example.org');
            expect(exclusions.children[0].children[0].state).toBe(ExclusionState.Disabled);

            // Re-adding the existing Disabled exclusion triggers the reactivation branch.
            const addedCount = await exclusionsService.addUrlToExclusions('default', 'example.org');

            expect(addedCount).toBe(1);

            exclusions = await exclusionsService.getExclusions();
            expect(exclusions.children[0].children[0].hostname).toBe('example.org');
            expect(exclusions.children[0].children[0].state).toBe(ExclusionState.Enabled);
        });

        it('reactivates an existing disabled wildcard exclusion and returns 1', async () => {
            const exclusionsService = new ExclusionsService();
            await exclusionsService.init();

            // Adding a subdomain auto-creates "*.example.org" as a Disabled companion.
            await exclusionsService.addUrlToExclusions('default', 'foo.example.org');

            let exclusions = await exclusionsService.getExclusions();
            expect(exclusions.children[0].children[1].hostname).toBe('*.example.org');
            expect(exclusions.children[0].children[1].state).toBe(ExclusionState.Disabled);

            // Re-adding the existing Disabled wildcard exclusion triggers reactivation.
            const addedCount = await exclusionsService.addUrlToExclusions('default', '*.example.org');

            expect(addedCount).toBe(1);

            exclusions = await exclusionsService.getExclusions();
            expect(exclusions.children[0].children[1].hostname).toBe('*.example.org');
            expect(exclusions.children[0].children[1].state).toBe(ExclusionState.Enabled);
        });

        it('returns 0 and does not emit when existing exclusion is already enabled', async () => {
            const exclusionsService = new ExclusionsService();
            await exclusionsService.init();
            const notifySpy = vi.spyOn(notifier, 'notifyListeners');

            // Add a brand-new domain — creates it as Enabled.
            await exclusionsService.addUrlToExclusions('default', 'foo.example.org');
            notifySpy.mockClear();

            // Re-add the same domain — it's already Enabled, so no-op.
            const addedCount = await exclusionsService.addUrlToExclusions('default', 'foo.example.org');

            expect(addedCount).toBe(0);
            expect(notifySpy).not.toHaveBeenCalled();
        });

        it('reactivates a disabled service-domain sibling together with its wildcard companion', async () => {
            const exclusionsService = new ExclusionsService();
            await exclusionsService.init();

            // Adding 'aliexpress.ru' (service with domains aliexpress.com +
            // aliexpress.ru) creates all four entries: the matching domain and
            // its wildcard Enabled, the sibling domain and its wildcard Disabled.
            await exclusionsService.addUrlToExclusions('default', 'aliexpress.ru');

            let exclusions = await exclusionsService.getExclusions();
            const serviceNode = exclusions.children[0];
            expect(serviceNode.type).toBe(ExclusionsType.Service);
            // Sibling group 'aliexpress.com' is Disabled (both children Disabled).
            const siblingGroup = serviceNode.children[0];
            expect(siblingGroup.id).toBe('aliexpress.com');
            expect(siblingGroup.state).toBe(ExclusionState.Disabled);
            expect(siblingGroup.children[0].hostname).toBe('aliexpress.com');
            expect(siblingGroup.children[0].state).toBe(ExclusionState.Disabled);
            expect(siblingGroup.children[1].hostname).toBe('*.aliexpress.com');
            expect(siblingGroup.children[1].state).toBe(ExclusionState.Disabled);

            // Re-adding the disabled sibling reactivates both the domain and its
            // wildcard companion, mirroring the service first-add behaviour that
            // enables the domain and its wildcard together.
            const addedCount = await exclusionsService.addUrlToExclusions('default', 'aliexpress.com');

            expect(addedCount).toBe(2);

            exclusions = await exclusionsService.getExclusions();
            const reactivatedGroup = exclusions.children[0].children[0];
            expect(reactivatedGroup.id).toBe('aliexpress.com');
            expect(reactivatedGroup.state).toBe(ExclusionState.Enabled);
            expect(reactivatedGroup.children[0].hostname).toBe('aliexpress.com');
            expect(reactivatedGroup.children[0].state).toBe(ExclusionState.Enabled);
            expect(reactivatedGroup.children[1].hostname).toBe('*.aliexpress.com');
            expect(reactivatedGroup.children[1].state).toBe(ExclusionState.Enabled);

            // The originally-added 'aliexpress.ru' group stays Enabled.
            const originalGroup = exclusions.children[0].children[1];
            expect(originalGroup.id).toBe('aliexpress.ru');
            expect(originalGroup.state).toBe(ExclusionState.Enabled);
        });
    });

    describe('notifier emission', () => {
        let exclusionsService: ExclusionsService;

        beforeEach(async () => {
            exclusionsService = new ExclusionsService();
            await exclusionsService.init();
        });

        it('emits EXCLUSIONS_DATA_UPDATED after reactivating an existing disabled exclusion', async () => {
            const notifySpy = vi.spyOn(notifier, 'notifyListeners');

            // Seed a Disabled companion exclusion.
            await exclusionsService.addUrlToExclusions('default', 'foo.example.org');
            notifySpy.mockClear();

            // Re-add the existing Disabled exclusion (reactivation path).
            await exclusionsService.addUrlToExclusions('default', 'example.org');

            expect(notifySpy).toHaveBeenCalledWith(notifier.types.EXCLUSIONS_DATA_UPDATED, 'default');
        });

        it('emits EXCLUSIONS_DATA_UPDATED after adding a brand-new domain', async () => {
            const notifySpy = vi.spyOn(notifier, 'notifyListeners');

            const addedCount = await exclusionsService.addUrlToExclusions('default', 'brandnew.com');

            expect(addedCount).toBe(2);
            expect(notifySpy).toHaveBeenCalledWith(notifier.types.EXCLUSIONS_DATA_UPDATED, 'default');
        });

        it('creates subdomain companions with correct states and emits notifier', async () => {
            const notifySpy = vi.spyOn(notifier, 'notifyListeners');

            const addedCount = await exclusionsService.addUrlToExclusions('default', 'foo.example.org');

            expect(addedCount).toBe(3);
            const exclusions = await exclusionsService.getExclusions();
            expect(exclusions.children[0].children.map((c) => c.hostname)).toEqual([
                'example.org',
                '*.example.org',
                'foo.example.org',
            ]);
            expect(exclusions.children[0].children[0].state).toBe(ExclusionState.Disabled);
            expect(exclusions.children[0].children[1].state).toBe(ExclusionState.Disabled);
            expect(exclusions.children[0].children[2].state).toBe(ExclusionState.Enabled);
            expect(notifySpy).toHaveBeenCalledWith(notifier.types.EXCLUSIONS_DATA_UPDATED, 'default');
        });

        it('emits EXCLUSIONS_DATA_UPDATED on the existing-eTLD branch', async () => {
            // Exercises a subdomain whose eTLD already exists. Because
            // `example.org` was already added, `currentModeHandler.hasETld(eTld)`
            // is true, so `foo.example.org` is added via the existing-eTLD
            // branch (`addExclusions([{ value: hostname }])` then `return 1`)
            // rather than the subdomain-companion branch.
            // Add the eTLD group first (creates example.org + *.example.org).
            await exclusionsService.addUrlToExclusions('default', 'example.org');
            const notifySpy = vi.spyOn(notifier, 'notifyListeners');

            const addedCount = await exclusionsService.addUrlToExclusions('default', 'foo.example.org');

            expect(addedCount).toBe(1);
            expect(notifySpy).toHaveBeenCalledWith(notifier.types.EXCLUSIONS_DATA_UPDATED, 'default');
        });
    });

    describe('invalid hostname regression', () => {
        let exclusionsService: ExclusionsService;

        beforeEach(async () => {
            exclusionsService = new ExclusionsService();
            await exclusionsService.init();
        });

        it('returns 0 and does not emit for an invalid hostname', async () => {
            const notifySpy = vi.spyOn(notifier, 'notifyListeners');

            const addedCount = await exclusionsService.addUrlToExclusions('default', '');

            expect(addedCount).toBe(0);
            expect(notifySpy).not.toHaveBeenCalled();
        });
    });

    describe('regression safety', () => {
        let exclusionsService: ExclusionsService;

        beforeEach(async () => {
            exclusionsService = new ExclusionsService();
            await exclusionsService.init();
        });

        it('add-new top-level domain creates host and wildcard as Enabled, returns 2, and emits notifier', async () => {
            const notifySpy = vi.spyOn(notifier, 'notifyListeners');

            const addedCount = await exclusionsService.addUrlToExclusions('default', 'brandnewdomain.com');

            expect(addedCount).toBe(2);
            const exclusions = await exclusionsService.getExclusions();
            expect(exclusions.children).toHaveLength(1);
            expect(exclusions.children[0].hostname).toBe('brandnewdomain.com');
            expect(exclusions.children[0].type).toBe(ExclusionsType.Group);
            expect(exclusions.children[0].children.map((c) => c.hostname)).toEqual([
                'brandnewdomain.com',
                '*.brandnewdomain.com',
            ]);
            expect(exclusions.children[0].children[0].state).toBe(ExclusionState.Enabled);
            expect(exclusions.children[0].children[1].state).toBe(ExclusionState.Enabled);
            expect(notifySpy).toHaveBeenCalledWith(notifier.types.EXCLUSIONS_DATA_UPDATED, 'default');
        });

        it('service-group add returns count of newly-added exclusions, matching domain Enabled, siblings Disabled, and emits notifier', async () => {
            const notifySpy = vi.spyOn(notifier, 'notifyListeners');

            // 'aliexpress.ru' belongs to the aliexpress service mock (2 domains),
            // so this exercises the service-group branch.
            const addedCount = await exclusionsService.addUrlToExclusions('default', 'aliexpress.ru');

            // 2 service domains -> addServices creates host + wildcard per domain = 4 entries.
            expect(addedCount).toBe(4);
            const exclusions = await exclusionsService.getExclusions();
            expect(exclusions.children).toHaveLength(1);
            expect(exclusions.children[0].type).toBe(ExclusionsType.Service);
            expect(exclusions.children[0].id).toBe('aliexpress');
            // matching domain group (aliexpress.ru) Enabled, sibling domain group (aliexpress.com) Disabled.
            expect(exclusions.children[0].children[0].id).toBe('aliexpress.com');
            expect(exclusions.children[0].children[0].state).toBe(ExclusionState.Disabled);
            expect(exclusions.children[0].children[1].id).toBe('aliexpress.ru');
            expect(exclusions.children[0].children[1].state).toBe(ExclusionState.Enabled);
            expect(notifySpy).toHaveBeenCalledWith(notifier.types.EXCLUSIONS_DATA_UPDATED, 'default');
        });

        it('service-group add counts only entries that changed', async () => {
            await exclusionsService.addUrlToExclusions('default', 'foo.aliexpress.com');

            const addedCount = await exclusionsService.addUrlToExclusions('default', 'aliexpress.ru');

            expect(addedCount).toBe(2);
            const exclusions = await exclusionsService.getExclusions();
            expect(exclusions.children[0].children[0].id).toBe('aliexpress.com');
            expect(exclusions.children[0].children[0].children[0].state).toBe(ExclusionState.Disabled);
            expect(exclusions.children[0].children[0].children[1].state).toBe(ExclusionState.Disabled);
            expect(exclusions.children[0].children[1].id).toBe('aliexpress.ru');
            expect(exclusions.children[0].children[1].state).toBe(ExclusionState.Enabled);
        });

        it('import via addGeneralExclusions does not downgrade existing Enabled companions', async () => {
            // Seed example.com (Enabled) + *.example.com (Enabled) via a brand-new top-level add.
            await exclusionsService.addUrlToExclusions('default', 'example.com');

            // Re-import example.com (mirrors the real UI import path -> addGeneralExclusions).
            // supplementExclusion('example.com') produces:
            //   { value: 'example.com', enabled: true, overwriteState: true }  -> force-enable (no-op; already Enabled)
            //   { value: '*.example.com', enabled: false }  -> default overwriteState; must NOT downgrade.
            const addedCount = await exclusionsService.addGeneralExclusions('default', ['example.com']);

            // No state changed: example.com already Enabled; *.example.com preserved as Enabled.
            expect(addedCount).toBe(0);

            const exclusions = await exclusionsService.getExclusions();
            expect(exclusions.children[0].children[0].hostname).toBe('example.com');
            expect(exclusions.children[0].children[0].state).toBe(ExclusionState.Enabled);
            expect(exclusions.children[0].children[1].hostname).toBe('*.example.com');
            expect(exclusions.children[0].children[1].state).toBe(ExclusionState.Enabled);
        });

        it('toggleExclusionState flips a group on -> off -> on unchanged', async () => {
            // Brand-new add: example.org + *.example.org both Enabled -> group Enabled.
            await exclusionsService.addUrlToExclusions('default', 'example.org');
            const initial = await exclusionsService.getExclusions();
            const groupId = initial.children[0].id;
            expect(initial.children[0].state).toBe(ExclusionState.Enabled);

            // Toggle -> Disabled (all children Disabled).
            await exclusionsService.toggleExclusionState('default', groupId);
            let toggled = await exclusionsService.getExclusions();
            expect(toggled.children[0].state).toBe(ExclusionState.Disabled);

            // Toggle back -> Enabled (all children Enabled).
            await exclusionsService.toggleExclusionState('default', groupId);
            toggled = await exclusionsService.getExclusions();
            expect(toggled.children[0].state).toBe(ExclusionState.Enabled);
        });

        it('disableVpnByUrl emits EXCLUSIONS_DATA_UPDATED exactly once when reactivating', async () => {
            // Adding a subdomain auto-creates example.org as Disabled.
            await exclusionsService.addUrlToExclusions('default', 'foo.example.org');

            const notifySpy = vi.spyOn(notifier, 'notifyListeners');
            // In Regular mode, disableVpnByUrl delegates to addUrlToExclusions,
            // which reactivates the Disabled example.org entry and emits once.
            await exclusionsService.disableVpnByUrl('example.org');

            const dataUpdatedCalls = notifySpy.mock.calls.filter(
                ([type]) => type === notifier.types.EXCLUSIONS_DATA_UPDATED,
            );
            expect(dataUpdatedCalls).toHaveLength(1);
        });

        it('disableVpnByUrl emits EXCLUSIONS_DATA_UPDATED exactly once in Selective mode', async () => {
            await exclusionsService.setMode('default', ExclusionsMode.Selective);
            await exclusionsService.addUrlToExclusions('default', 'example.org');
            const notifySpy = vi.spyOn(notifier, 'notifyListeners');

            await exclusionsService.disableVpnByUrl('example.org');

            const dataUpdatedCalls = notifySpy.mock.calls.filter(
                ([type]) => type === notifier.types.EXCLUSIONS_DATA_UPDATED,
            );
            expect(dataUpdatedCalls).toHaveLength(1);
        });

        it('enableVpnByUrl emits EXCLUSIONS_DATA_UPDATED exactly once', async () => {
            await exclusionsService.addUrlToExclusions('default', 'example.org');

            const notifySpy = vi.spyOn(notifier, 'notifyListeners');
            // In Regular mode, enableVpnByUrl calls disableExclusionByUrl + emits once.
            await exclusionsService.enableVpnByUrl('example.org');

            const dataUpdatedCalls = notifySpy.mock.calls.filter(
                ([type]) => type === notifier.types.EXCLUSIONS_DATA_UPDATED,
            );
            expect(dataUpdatedCalls).toHaveLength(1);
        });
    });
});
