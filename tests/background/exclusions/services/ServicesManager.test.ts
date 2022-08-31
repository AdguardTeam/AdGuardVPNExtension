import { nanoid } from 'nanoid';

import { servicesManager } from '../../../../src/background/exclusions/services/ServicesManager';
import { vpnProvider } from '../../../../src/background/providers/vpnProvider';

jest.mock('../../../../src/background/providers/vpnProvider');
jest.mock('../../../../src/lib/logger');
jest.mock('nanoid');

const nanoidMock = nanoid as jest.MockedFunction<() => string>;
nanoidMock.mockImplementation(() => 'zzzzzzzzz');

const SERVICES_DATA = {
    aliexpress: {
        categories: [{ id: 'SHOP', name: 'Shopping' }],
        iconUrl: 'https://icons.adguard.org/icon?domain=aliexpress.com',
        modifiedTime: '2021-09-14T10:23:00+0000',
        domains: ['aliexpress.com', 'aliexpress.ru'],
        serviceId: 'aliexpress',
        serviceName: 'Aliexpress',
    },
    amazon: {
        categories: [{ id: 'SHOP', name: 'Shopping' }],
        iconUrl: 'https://icons.adguard.org/icon?domain=amazon.com',
        modifiedTime: '2021-09-14T10:23:00+0000',
        domains: ['a2z.com', 'amazon-corp.com', 'amazon.ca', 'amazon.co.jp', 'amazon.co.uk', 'amazon.com', 'amazon.com.au', 'amazon.com.mx', 'amazon.de', 'amazon.es', 'amazon.eu', 'amazon.fr', 'amazon.in', 'amazon.it', 'amazon.nl', 'amazon.sa', 'amazonbrowserapp.co.uk', 'amazonbrowserapp.es', 'amazoncognito.com', 'amazoncrl.com', 'amazonpay.com', 'amazonpay.in', 'amazontrust.com', 'associates-amazon.com', 'images-amazon.com', 'media-amazon.com', 'ssl-images-amazon.com'],
        serviceId: 'amazon',
        serviceName: 'Amazon',
    },
    atlassian: {
        categories: [{ id: 'WORK', name: 'Work communication tools' }],
        iconUrl: 'https://icons.adguard.org/icon?domain=atlassian.com',
        modifiedTime: '2021-09-14T10:23:00+0000',
        domains: ['atlassian.com', 'atlassian.net', 'bitbucket.org'],
        serviceId: 'atlassian',
        serviceName: 'Atlassian',
    },
    baidu: {
        categories: [{ id: 'SEARCH', name: 'Search engines' }],
        iconUrl: 'https://icons.adguard.org/icon?domain=baidu.com',
        modifiedTime: '2021-09-14T10:23:00+0000',
        domains: ['baidu.com', 'baiducontent.com', 'baidupcs.com', 'baidustatic.com', 'bcebos.com', 'bdimg.com', 'bdstatic.com', 'gshifen.com', 'popin.cc', 'shifen.com', 'wshifen.com'],
        serviceId: 'baidu',
        serviceName: 'Baidu',
    },
};

const getExclusionsServicesMock = vpnProvider
    .getExclusionsServices as jest.MockedFunction<() => any>;
getExclusionsServicesMock.mockImplementation(() => SERVICES_DATA);

const getServicesFromStorageMock = jest.fn();
servicesManager.getServicesFromStorage = getServicesFromStorageMock;
getServicesFromStorageMock.mockReturnValue({});

const saveServicesInStorageMock = jest.fn();
servicesManager.saveServicesInStorage = saveServicesInStorageMock;
saveServicesInStorageMock.mockReturnValue({});

describe('ServicesManager tests', () => {
    it('test initialization', async () => {
        await servicesManager.init();
        const servicesData = await servicesManager.getServices();

        expect(Object.values(servicesData)).toHaveLength(4);
        expect(JSON.stringify(servicesData.aliexpress))
            .toStrictEqual(JSON.stringify(SERVICES_DATA.aliexpress));
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
        const servicesData = await servicesManager.getServicesFromServer();
        servicesManager.setServices(servicesData);

        const aliexpressServiceData = servicesManager.getService('aliexpress');
        expect(JSON.stringify(aliexpressServiceData))
            .toStrictEqual(JSON.stringify(SERVICES_DATA.aliexpress));

        const wrongService = servicesManager.getService('wrongServiceId');
        expect(wrongService).toBeNull();
    });
});
