import { ExclusionsService } from '../../../src/background/exclusions/ExclusionsService';
import { ExclusionsMode, ExclusionState, ExclusionsType } from '../../../src/common/exclusionsConstants';
import { servicesManager } from '../../../src/background/exclusions/services/ServicesManager';
import { sessionState } from '../../../src/background/sessionStorage';

jest.mock('../../../src/background/browserApi', () => {
    const storage: { [key: string]: any } = {
        set: jest.fn(async (key: string, data: any): Promise<void> => {
            storage[key] = data;
        }),
        get: jest.fn(async (key: string): Promise<string> => {
            return storage[key];
        }),
        remove: jest.fn(async (key: string): Promise<boolean> => {
            return delete storage[key];
        }),
    };
    const runtime = {
        // TODO: test mv3 after official switch to mv3
        isManifestVersion2: () => true,
    };

    return {
        __esModule: true,
        browserApi: {
            storage,
            runtime,
        },
    };
});

jest.mock('../../../src/lib/logger.ts');

jest.mock('../../../src/background/settings', () => {
    return {
        __esModule: true,
        settings: {
            getExclusions: () => {
                return [];
            },
            setExclusions: () => {},
        },
    };
});

jest.mock('../../../src/background/api/fallbackApi', () => {
    return {
        __esModule: true,
        fallbackApi: {
            getApiUrlsExclusions: () => {
                return [];
            },
        },
    };
});

jest.mock('../../../src/background/providers/vpnProvider', () => {
    return {
        __esModule: true,
        vpnProvider: {
            getExclusionsServices: async () => Promise.resolve({
                services: {},
                categories: {},
            }),
            getExclusionsServicesDomains: async () => Promise.resolve({}),
        },
    };
});

const SERVICE_DATA = {
    categories: {
        id: 'SHOP',
        name: 'Shopping',
    },
    iconUrl: 'https://icons.adguard.org/icon?domain=aliexpress.com',
    serviceId: 'aliexpress',
    serviceName: 'Aliexpress',
    modifiedTime: '2021-09-14T10:23:00+0000',
    domains: [
        'aliexpress.com',
        'aliexpress.ru',
    ],
};

const getServicesDtoMock = jest.fn();
servicesManager.getServicesDto = getServicesDtoMock;
getServicesDtoMock.mockReturnValue([SERVICE_DATA]);

const getServiceMock = jest.fn();
servicesManager.getService = getServiceMock;
getServiceMock.mockReturnValue(SERVICE_DATA);

const getServicesMock = jest.fn();
servicesManager.getServices = getServicesMock;
getServicesMock.mockReturnValue({ aliexpress: SERVICE_DATA });

const getIndexedServicesMock = jest.fn();
servicesManager.getIndexedServices = getIndexedServicesMock;
getIndexedServicesMock.mockReturnValue({
    'aliexpress.com': 'aliexpress',
    'aliexpress.ru': 'aliexpress',
});

const session: { [key: string]: any } = {
    set: jest.fn(async (key: string, data: any): Promise<void> => {
        session[key] = data;
    }),
    get: jest.fn(async (key: string): Promise<string> => {
        return session[key];
    }),
};

global.chrome = {
    storage: {
        // @ts-ignore - partly implementation
        session,
    },
};

describe('ExclusionsService', () => {
    beforeEach(async () => {
        await sessionState.init();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('empty after init', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();

        const exclusionsData = exclusionsService.getExclusions();
        expect(exclusionsData.children).toHaveLength(0);
        expect(exclusionsService.getMode()).toBeTruthy();
    });

    it('returns true if domains are not excluded ', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();

        expect(exclusionsService.isVpnEnabledByUrl('http://example.org')).toBeTruthy();
        expect(exclusionsService.isVpnEnabledByUrl('https://example.com')).toBeTruthy();
        expect(exclusionsService.isVpnEnabledByUrl('example.org')).toBeTruthy();
    });

    it('returns false if domains are excluded', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();

        await exclusionsService.addUrlToExclusions('example.org');

        expect(exclusionsService.isVpnEnabledByUrl('http://example.org')).toBeFalsy();
        expect(exclusionsService.isVpnEnabledByUrl('https://example.org')).toBeFalsy();
        expect(exclusionsService.isVpnEnabledByUrl('https://example.org/test')).toBeFalsy();
        expect(exclusionsService.isVpnEnabledByUrl('https://mail.example.org/test')).toBeFalsy();
        expect(exclusionsService.isVpnEnabledByUrl('https://example.com')).toBeTruthy();
    });

    it('should toggle exclusion group', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();

        await exclusionsService.addUrlToExclusions('https://example.org');

        // check init state
        expect(exclusionsService.isVpnEnabledByUrl('https://example.org')).toBeFalsy();
        expect(exclusionsService.isVpnEnabledByUrl('https://test.example.org')).toBeFalsy();

        // toggle
        await exclusionsService.toggleExclusionState('example.org');

        // check toggled state
        expect(exclusionsService.isVpnEnabledByUrl('https://example.org')).toBeTruthy();
        expect(exclusionsService.isVpnEnabledByUrl('https://test.example.org')).toBeTruthy();

        // toggle
        await exclusionsService.toggleExclusionState('example.org');

        // check toggled state
        expect(exclusionsService.isVpnEnabledByUrl('https://example.org')).toBeFalsy();
        expect(exclusionsService.isVpnEnabledByUrl('https://test.example.org')).toBeFalsy();
    });

    it('should add three exclusions if more than two level hostname added', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();

        await exclusionsService.addUrlToExclusions('test.example.org');

        const exclusions = exclusionsService.getExclusions();
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

        await exclusionsService.addUrlToExclusions('*.example.org');
        const exclusions = exclusionsService.getExclusions();
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

            await exclusionsService.addUrlToExclusions('com');

            const exclusions = exclusionsService.getExclusions();
            expect(exclusions.children[0].children).toHaveLength(2);
            expect(exclusions.children[0].children.map((ex) => ex.hostname)).toEqual([
                'com',
                '*.com',
            ]);
        });

        it('works for two parts tld', async () => {
            const exclusionsService = new ExclusionsService();
            await exclusionsService.init();

            await exclusionsService.addUrlToExclusions('blogspot.ru');
            const exclusions = exclusionsService.getExclusions();

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
        await exclusionsService.setMode(ExclusionsMode.Regular);
        expect(exclusionsService.getMode()).toBeTruthy();

        await exclusionsService.addUrlToExclusions('https://сайт.рф/');
        expect(exclusionsService.isVpnEnabledByUrl('https://xn--80aswg.xn--p1ai/')).toBeFalsy();
        expect(exclusionsService.isVpnEnabledByUrl('xn--80aswg.xn--p1ai')).toBeFalsy();
        expect(exclusionsService.isVpnEnabledByUrl('сайт.рф')).toBeFalsy();

        await exclusionsService.addUrlToExclusions('http://xn--e1afmkfd.xn--p1ai/');
        expect(exclusionsService.isVpnEnabledByUrl('пример.рф')).toBeFalsy();
        expect(exclusionsService.isVpnEnabledByUrl('http://xn--e1afmkfd.xn--p1ai/')).toBeFalsy();
        expect(exclusionsService.isVpnEnabledByUrl('xn--e1afmkfd.xn--p1ai')).toBeFalsy();
    });

    it('manually add service by domain', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();
        await exclusionsService.addUrlToExclusions('aliexpress.ru');
        const exclusions = exclusionsService.getExclusions();

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
        await exclusionsService.addUrlToExclusions('aliexpress.ru');
        await exclusionsService.addUrlToExclusions('test.aliexpress.ru');
        let exclusions = exclusionsService.getExclusions();

        expect(exclusions.children[0].children[1].children[2].hostname).toEqual('test.aliexpress.ru');
        expect(exclusions.children[0].children[1].children[2].state)
            .toEqual(ExclusionState.Enabled);
        const subdomainExclusionId = exclusions.children[0].children[1].children[2].id;
        // disable test.aliexpress.ru
        await exclusionsService.toggleExclusionState(subdomainExclusionId);
        exclusions = exclusionsService.getExclusions();
        expect(exclusions.children[0].children[1].children[2].state)
            .toEqual(ExclusionState.Disabled);

        // reset service data
        await exclusionsService.resetServiceData('aliexpress');
        exclusions = exclusionsService.getExclusions();

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
        let exclusions = exclusionsService.getExclusions();

        expect(exclusions.children).toHaveLength(1);
        expect(exclusions.children[0].hostname).toEqual('example.org');
        expect(exclusions.children[0].state).toEqual(ExclusionState.Enabled);

        await exclusionsService.enableVpnByUrl('example.org');
        exclusions = exclusionsService.getExclusions();

        expect(exclusions.children).toHaveLength(1);
        expect(exclusions.children[0].hostname).toEqual('example.org');
        expect(exclusions.children[0].state).toEqual(ExclusionState.PartlyEnabled);
        expect(exclusions.children[0].children[0].hostname).toEqual('example.org');
        expect(exclusions.children[0].children[0].state).toEqual(ExclusionState.Disabled);
    });

    it('should remove group if main domain has been removed', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();
        await exclusionsService.addUrlToExclusions('aliexpress.com');
        await exclusionsService.addUrlToExclusions('test.com');
        let exclusions = exclusionsService.getExclusions();

        expect(exclusions.children).toHaveLength(2);
        expect(exclusions.children[0].children[0].children[0].hostname).toEqual('aliexpress.com');
        let mainDomainExclusionId = exclusions.children[0].children[0].children[0].id;

        await exclusionsService.removeExclusion(mainDomainExclusionId);
        exclusions = exclusionsService.getExclusions();

        expect(exclusions.children).toHaveLength(2);
        expect(exclusions.children[0].id).toEqual('aliexpress');
        expect(exclusions.children[0].children).toHaveLength(1);
        expect(exclusions.children[0].children[0].id).toEqual('aliexpress.ru');
        mainDomainExclusionId = exclusions.children[0].children[0].children[0].id;
        expect(exclusions.children[1].id).toEqual('test.com');

        await exclusionsService.removeExclusion(mainDomainExclusionId);
        exclusions = exclusionsService.getExclusions();
        expect(exclusions.children).toHaveLength(1);
        expect(exclusions.children[0].id).toEqual('test.com');

        mainDomainExclusionId = exclusions.children[0].children[0].id;
        await exclusionsService.removeExclusion(mainDomainExclusionId);
        exclusions = exclusionsService.getExclusions();

        expect(exclusions.children).toHaveLength(0);
    });

    it('should stay group if only main domain presented', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();
        await exclusionsService.addUrlToExclusions('example.org');
        let exclusions = exclusionsService.getExclusions();

        expect(exclusions.children).toHaveLength(1);
        expect(exclusions.children[0].hostname).toEqual('example.org');
        expect(exclusions.children[0].type).toEqual(ExclusionsType.Group);
        expect(exclusions.children[0].children[1].hostname).toEqual('*.example.org');

        const allSubdomainsExclusionId = exclusions.children[0].children[1].id;
        await exclusionsService.removeExclusion(allSubdomainsExclusionId);
        exclusions = exclusionsService.getExclusions();

        expect(exclusions.children).toHaveLength(1);
        expect(exclusions.children[0].hostname).toEqual('example.org');
        expect(exclusions.children[0].type).toEqual(ExclusionsType.Group);
        expect(exclusions.children[0].children).toHaveLength(1);
        expect(exclusions.children[0].children[0].hostname).toEqual('example.org');
    });

    it('ip address should be a separate exclusion', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();
        await exclusionsService.addUrlToExclusions('192.168.11.1');
        const exclusions = exclusionsService.getExclusions();

        expect(exclusions.children).toHaveLength(1);
        expect(exclusions.children[0].type).toEqual(ExclusionsType.Exclusion);
        expect(exclusions.children[0].hostname).toEqual('192.168.11.1');
    });

    it('able to restore removed exclusions', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();
        await exclusionsService.addUrlToExclusions('example.org');
        await exclusionsService.addUrlToExclusions('example.com');

        const exclusions = exclusionsService.getExclusions();
        expect(exclusions.children).toHaveLength(2);

        await exclusionsService.removeExclusion(exclusions.children[0].id);
        const updatedExclusions = exclusionsService.getExclusions();
        expect(updatedExclusions.children).toHaveLength(1);

        await exclusionsService.restoreExclusions();
        const restoredExclusions = exclusionsService.getExclusions();
        expect(restoredExclusions).toEqual(exclusions);
    });

    it('able to restore previous state of exclusions after new exclusion added', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();
        await exclusionsService.addUrlToExclusions('example.org');
        const exclusions = exclusionsService.getExclusions();

        await exclusionsService.addUrlToExclusions('example.com');
        const updatedExclusions = exclusionsService.getExclusions();
        expect(updatedExclusions.children).toHaveLength(2);

        await exclusionsService.restoreExclusions();
        const restoredExclusions = exclusionsService.getExclusions();
        expect(restoredExclusions).toEqual(exclusions);
    });

    it('keep state of existing exclusions in service after new exclusion added to service', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();
        await exclusionsService.addUrlToExclusions('*.ott.yandex.ru');
        await exclusionsService.addUrlToExclusions('yastatic.net');
        const exclusions = exclusionsService.getExclusions();

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
