import { nanoid } from 'nanoid';

import { servicesManager } from '../../../../src/background/exclusions/services/ServicesManager';
import { vpnProvider } from '../../../../src/background/providers/vpnProvider';
import { Service } from '../../../../src/background/exclusions/services/Service';

jest.mock('../../../../src/background/providers/vpnProvider');
jest.mock('nanoid');

const nanoidMock = nanoid as jest.MockedFunction<() => string>;
nanoidMock.mockImplementation(() => 'zzzzzzzzz');

const SERVICES_DATA = {
    services: {
        aliexpress: {
            categories: ['SHOP'],
            iconUrl: 'https://icons.adguard.org/icon?domain=aliexpress.com',
            modifiedTime: '2021-09-14T10:23:00+0000',
            serviceId: 'aliexpress',
            serviceName: 'Aliexpress',
        },
        amazon: {
            categories: ['SHOP'],
            iconUrl: 'https://icons.adguard.org/icon?domain=amazon.com',
            modifiedTime: '2021-09-14T10:23:00+0000',
            serviceId: 'amazon',
            serviceName: 'Amazon',
        },
        amazonvideo: {
            categories: ['VIDEO'],
            iconUrl: 'https://icons.adguard.org/icon?domain=amazonvideo.com',
            modifiedTime: '2021-09-14T10:23:00+0000',
            serviceId: 'amazonvideo',
            serviceName: 'Amazon prime',
        },
        atlassian: {
            categories: ['WORK'],
            iconUrl: 'https://icons.adguard.org/icon?domain=atlassian.com',
            modifiedTime: '2021-09-14T10:23:00+0000',
            serviceId: 'atlassian',
            serviceName: 'Atlassian',
        },
        baidu: {
            categories: ['SEARCH'],
            iconUrl: 'https://icons.adguard.org/icon?domain=baidu.com',
            modifiedTime: '2021-09-14T10:23:00+0000',
            serviceId: 'baidu',
            serviceName: 'Baidu',
        },
    },
    categories: {
        SHOP: {
            id: 'SHOP',
            name: 'Shopping',
        },
        VIDEO: {
            id: 'VIDEO',
            name: 'Video streaming services',
        },
        WORK: {
            id: 'WORK',
            name: 'Work communication tools',
        },
        SEARCH: {
            id: 'SEARCH',
            name: 'Search engines',
        },
    },
};

const SERVICES_DOMAINS = {
    aliexpress: {
        domains: ['aliexpress.com', 'aliexpress.ru'],
        serviceId: 'aliexpress',
    },
    amazon: {
        domains: ['a2z.com', 'amazon-corp.com', 'amazon.ca', 'amazon.co.jp', 'amazon.co.uk', 'amazon.com', 'amazon.com.au', 'amazon.com.mx', 'amazon.de', 'amazon.es', 'amazon.eu', 'amazon.fr', 'amazon.in', 'amazon.it', 'amazon.nl', 'amazon.sa', 'amazonbrowserapp.co.uk', 'amazonbrowserapp.es', 'amazoncognito.com', 'amazoncrl.com', 'amazonpay.com', 'amazonpay.in', 'amazontrust.com', 'associates-amazon.com', 'images-amazon.com', 'media-amazon.com', 'ssl-images-amazon.com'],
        serviceId: 'amazon',
    },
    amazonvideo: {
        domains: ['aiv-cdn.net', 'aiv-delivery.net', 'amazonvideo.com', 'atv-ext-eu.amazon.com', 'atv-ext-fe.amazon.com', 'atv-ext.amazon.com', 'atv-ps.amazon.com', 'primevideo.com', 'pv-cdn.net'],
        serviceId: 'amazonvideo',
    },
    atlassian: {
        domains: ['atlassian.com', 'atlassian.net', 'bitbucket.org'],
        serviceId: 'atlassian',
    },
    baidu: {
        domains: ['baidu.com', 'baiducontent.com', 'baidupcs.com', 'baidustatic.com', 'bcebos.com', 'bdimg.com', 'bdstatic.com', 'gshifen.com', 'popin.cc', 'shifen.com', 'wshifen.com'],
        serviceId: 'baidu',
    },
};

const ALIEXPRESS_SERVICE_DATA = new Service({
    serviceId: 'aliexpress',
    serviceName: 'Aliexpress',
    categories: [{
        id: 'SHOP',
        name: 'Shopping',
    }],
    iconUrl: 'https://icons.adguard.org/icon?domain=aliexpress.com',
    modifiedTime: '2021-09-14T10:23:00+0000',
    domains: [
        'aliexpress.com',
        'aliexpress.ru',
    ],
});

const getExclusionsServicesMock = vpnProvider
    .getExclusionsServices as jest.MockedFunction<() => any>;
getExclusionsServicesMock.mockImplementation(() => SERVICES_DATA);

const getExclusionsServicesDomainsMock = vpnProvider
    .getExclusionsServicesDomains as jest.MockedFunction<() => any>;
getExclusionsServicesDomainsMock.mockImplementation(() => SERVICES_DOMAINS);

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

        expect(Object.values(servicesData)).toHaveLength(5);
        expect(JSON.stringify(servicesData['aliexpress']))
            .toStrictEqual(JSON.stringify(ALIEXPRESS_SERVICE_DATA));
        expect(servicesData['amazon'].serviceId).toEqual('amazon');
        expect(servicesData['amazon'].categories[0].id).toEqual('SHOP');
        expect(servicesData['amazon'].categories[0].name).toEqual('Shopping');
        expect(servicesData['amazon'].domains).toHaveLength(27);
        expect(servicesData['amazon'].domains[0]).toEqual('a2z.com');
        expect(servicesData['amazonvideo'].serviceId).toEqual('amazonvideo');
        expect(servicesData['amazonvideo'].domains).toHaveLength(9);
        expect(servicesData['atlassian'].serviceId).toEqual('atlassian');
        expect(servicesData['atlassian'].domains).toHaveLength(3);
        expect(servicesData['baidu'].serviceId).toEqual('baidu');
        expect(servicesData['baidu'].domains).toHaveLength(11);
    });

    it('test setServices and getService', async () => {
        const servicesData = await servicesManager.getServicesFromServer();
        servicesManager.setServices(servicesData);

        const aliexpressServiceData = servicesManager.getService('aliexpress');
        expect(JSON.stringify(aliexpressServiceData))
            .toStrictEqual(JSON.stringify(ALIEXPRESS_SERVICE_DATA));

        const wrongService = servicesManager.getService('wrongServiceId');
        expect(wrongService).toBeNull();
    });
});
