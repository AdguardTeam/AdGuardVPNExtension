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

        await exclusionsService.addUrlToExclusions('default', '*.example.org');
        const exclusions = await exclusionsService.getExclusions();
        expect(exclusions.children[0].children).toHaveLength(2);
        expect(exclusions.children[0].children.map((ex) => ex.hostname)).toEqual([
            'example.org',
            '*.example.org',
        ]);
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
        await exclusionsService.addUrlToExclusions('default', '192.168.11.1');
        const exclusions = await exclusionsService.getExclusions();

        expect(exclusions.children).toHaveLength(1);
        expect(exclusions.children[0].type).toEqual(ExclusionsType.Exclusion);
        expect(exclusions.children[0].hostname).toEqual('192.168.11.1');
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
});
