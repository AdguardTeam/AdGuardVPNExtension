import {
    vi,
    describe,
    it,
    expect,
    type MockedFunction,
} from 'vitest';
import { nanoid } from 'nanoid';

import { servicesManager } from '../../../../src/background/exclusions/services/ServicesManager';
import { vpnProvider } from '../../../../src/background/providers/vpnProvider';
import { getMockCallCount } from '../../../utils/mockHelpers';

vi.mock('../../../../src/background/providers/vpnProvider');
vi.mock('nanoid');

const mockLocale = vi.hoisted(() => ({ locale: 'en' }));

vi.mock('../../../../src/common/i18n', () => ({
    __esModule: true,
    i18n: {
        getUILanguage: () => mockLocale.locale,
    },
}));

const nanoidMock = nanoid as MockedFunction<() => string>;
nanoidMock.mockImplementation(() => 'random_id');

const SERVICES_DATA = {
    aliexpress: {
        categories: [{ id: 'SHOP', name: 'Shopping' }],
        iconUrl: 'https://test.example.com/icon?domain=aliexpress.com',
        modifiedTime: '2021-09-14T10:23:00+0000',
        domains: ['aliexpress.com', 'aliexpress.ru'],
        serviceId: 'aliexpress',
        serviceName: 'Aliexpress',
    },
    amazon: {
        categories: [{ id: 'SHOP', name: 'Shopping' }],
        iconUrl: 'https://test.example.com/icon?domain=amazon.com',
        modifiedTime: '2021-09-14T10:23:00+0000',
        domains: ['a2z.com', 'amazon-corp.com', 'amazon.ca', 'amazon.co.jp', 'amazon.co.uk', 'amazon.com', 'amazon.com.au', 'amazon.com.mx', 'amazon.de', 'amazon.es', 'amazon.eu', 'amazon.fr', 'amazon.in', 'amazon.it', 'amazon.nl', 'amazon.sa', 'amazonbrowserapp.co.uk', 'amazonbrowserapp.es', 'amazoncognito.com', 'amazoncrl.com', 'amazonpay.com', 'amazonpay.in', 'amazontrust.com', 'associates-amazon.com', 'images-amazon.com', 'media-amazon.com', 'ssl-images-amazon.com'],
        serviceId: 'amazon',
        serviceName: 'Amazon',
    },
    atlassian: {
        categories: [{ id: 'WORK', name: 'Work communication tools' }],
        iconUrl: 'https://test.example.com/icon?domain=atlassian.com',
        modifiedTime: '2021-09-14T10:23:00+0000',
        domains: ['atlassian.com', 'atlassian.net', 'bitbucket.org'],
        serviceId: 'atlassian',
        serviceName: 'Atlassian',
    },
    baidu: {
        categories: [{ id: 'SEARCH', name: 'Search engines' }],
        iconUrl: 'https://test.example.com/icon?domain=baidu.com',
        modifiedTime: '2021-09-14T10:23:00+0000',
        domains: ['baidu.com', 'baiducontent.com', 'baidupcs.com', 'baidustatic.com', 'bcebos.com', 'bdimg.com', 'bdstatic.com', 'gshifen.com', 'popin.cc', 'shifen.com', 'wshifen.com'],
        serviceId: 'baidu',
        serviceName: 'Baidu',
    },
};

const getExclusionsServicesMock = vpnProvider
    .getExclusionsServices as MockedFunction<() => any>;
getExclusionsServicesMock.mockResolvedValue(SERVICES_DATA);

const getServicesFromStorageMock = vi.fn();
servicesManager.getServicesFromStorage = getServicesFromStorageMock;
getServicesFromStorageMock.mockResolvedValue({});

const saveServicesInStorageMock = vi.fn();
servicesManager.saveServicesInStorage = saveServicesInStorageMock;
saveServicesInStorageMock.mockResolvedValue({});

describe('ServicesManager tests', () => {
    it('test initialization', async () => {
        await servicesManager.init();
        await servicesManager.setServices(SERVICES_DATA);
        const servicesData = await servicesManager.getServices();

        expect(Object.values(servicesData)).toHaveLength(4);
        expect(servicesData.aliexpress).toEqual(SERVICES_DATA.aliexpress);
        expect(servicesData.amazon.serviceId).toEqual('amazon');
        expect(servicesData.amazon.categories[0].id).toEqual('SHOP');
        expect(servicesData.amazon.categories[0].name).toEqual('Shopping');
        expect(servicesData.amazon.domains).toHaveLength(27);
        expect(servicesData.amazon.domains[0]).toEqual('a2z.com');
        expect(servicesData.atlassian.serviceId).toEqual('atlassian');
        expect(servicesData.atlassian.domains).toHaveLength(3);
        expect(servicesData.baidu.serviceId).toEqual('baidu');
        expect(servicesData.baidu.domains).toHaveLength(11);
    });

    it('test setServices and getService', async () => {
        await servicesManager.init();
        const servicesData = await servicesManager.getServicesFromServer();
        await servicesManager.setServices(servicesData);

        const aliexpressServiceData = await servicesManager.getService('aliexpress');
        expect(aliexpressServiceData).toEqual(SERVICES_DATA.aliexpress);

        const wrongService = await servicesManager.getService('wrongServiceId');
        expect(wrongService).toBeNull();
    });

    it('updateServices respects update timeout unless forced', async () => {
        await servicesManager.init();
        await expect(servicesManager.updateServices(true)).resolves.toBe(true);

        const callsBefore = getMockCallCount(getExclusionsServicesMock);

        // Recent update must skip the server fetch.
        await expect(servicesManager.updateServices()).resolves.toBe(false);
        expect(getMockCallCount(getExclusionsServicesMock)).toBe(callsBefore);

        // Forced update must fetch from server even within the timeout.
        await expect(servicesManager.updateServices(true)).resolves.toBe(true);
        expect(getMockCallCount(getExclusionsServicesMock)).toBe(callsBefore + 1);
    });

    it('updateServices returns false when the server request fails', async () => {
        await servicesManager.init();

        getExclusionsServicesMock.mockRejectedValueOnce(new Error('network error'));

        await expect(servicesManager.updateServices(true)).resolves.toBe(false);
    });

    it('records the locale of a successful fetch', async () => {
        await servicesManager.init();

        await expect(servicesManager.updateServices(true, 'de')).resolves.toBe(true);

        await expect(servicesManager.getLastUpdateLocale()).resolves.toBe('de');
    });

    it('normalizes the locale before persisting it', async () => {
        await servicesManager.init();

        await expect(servicesManager.updateServices(true, 'EN-us')).resolves.toBe(true);

        await expect(servicesManager.getLastUpdateLocale()).resolves.toBe('en_us');
    });

    it('skips persistence when a forced fetch returns the same services', async () => {
        await servicesManager.setServices(SERVICES_DATA);
        saveServicesInStorageMock.mockClear();

        await expect(servicesManager.updateServices(true, 'fr')).resolves.toBe(true);

        expect(saveServicesInStorageMock).not.toHaveBeenCalled();
        await expect(servicesManager.getLastUpdateLocale()).resolves.toBe('fr');
    });

    it('refreshes stale persistent services during initialization', async () => {
        await servicesManager.updateServices(true, 'de');
        getServicesFromStorageMock.mockResolvedValueOnce(SERVICES_DATA);
        saveServicesInStorageMock.mockClear();

        await servicesManager.init();

        expect(getExclusionsServicesMock).toHaveBeenCalled();
        expect(saveServicesInStorageMock).not.toHaveBeenCalled();
        await expect(servicesManager.getLastUpdateLocale()).resolves.toBe('en');
    });

    it('keeps the previous locale when the fetch fails', async () => {
        await servicesManager.init();
        await servicesManager.updateServices(true, 'de');

        getExclusionsServicesMock.mockRejectedValueOnce(new Error('network error'));
        await expect(servicesManager.updateServices(true, 'fr')).resolves.toBe(false);

        await expect(servicesManager.getLastUpdateLocale()).resolves.toBe('de');
    });

    it('serializes concurrent updates so only one fetch runs at a time', async () => {
        await servicesManager.init();
        const callsBefore = getMockCallCount(getExclusionsServicesMock);

        let resolveFetch: (value: unknown) => void = () => {};
        getExclusionsServicesMock.mockImplementationOnce(
            () => new Promise((resolve) => {
                resolveFetch = resolve;
            }),
        );

        const first = servicesManager.updateServices(true);
        const second = servicesManager.updateServices(true);

        // The second call must wait for the first fetch instead of starting its own.
        await vi.waitFor(() => {
            expect(getMockCallCount(getExclusionsServicesMock)).toBe(callsBefore + 1);
        });

        resolveFetch(SERVICES_DATA);
        await first;
        await second;

        expect(getMockCallCount(getExclusionsServicesMock)).toBe(callsBefore + 2);
    });
});
