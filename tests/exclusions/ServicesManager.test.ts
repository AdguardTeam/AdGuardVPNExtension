import { nanoid } from 'nanoid';

import { services } from '../../src/background/exclusions/services/Services';
import { vpnProvider } from '../../src/background/providers/vpnProvider';
import { Service } from '../../src/background/exclusions/services/Service';
import { ExclusionsGroup } from '../../src/background/exclusions/exclusions/ExclusionsGroup';

jest.mock('../../src/background/providers/vpnProvider');
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
    exclusionsGroups: [
        new ExclusionsGroup('aliexpress.com'),
        new ExclusionsGroup('aliexpress.ru'),
    ],
});

const getExclusionsServicesMock = vpnProvider
    .getExclusionsServices as jest.MockedFunction<() => any>;
getExclusionsServicesMock.mockImplementation(() => SERVICES_DATA);

const getExclusionsServicesDomainsMock = vpnProvider
    .getExclusionsServicesDomains as jest.MockedFunction<() => any>;
getExclusionsServicesDomainsMock.mockImplementation(() => SERVICES_DOMAINS);

beforeAll(async () => {
    await services.init();
});

describe('ServicesManager tests', () => {
    it('initialization', async () => {
        const servicesData = services.getServicesData();
        expect(servicesData).toHaveLength(5);
        expect(JSON.stringify(servicesData[0]))
            .toStrictEqual(JSON.stringify(ALIEXPRESS_SERVICE_DATA));
        expect(servicesData[1].serviceId).toEqual('amazon');
        expect(servicesData[1].categories[0].id).toEqual('SHOP');
        expect(servicesData[1].categories[0].name).toEqual('Shopping');
        expect(servicesData[1].exclusionsGroups).toHaveLength(27);
        expect(servicesData[1].exclusionsGroups[0].hostname).toEqual('a2z.com');
        expect(servicesData[1].exclusionsGroups[0].exclusions[0].hostname).toEqual('a2z.com');
        expect(servicesData[1].exclusionsGroups[0].exclusions[1].hostname).toEqual('*.a2z.com');
        expect(servicesData[2].serviceId).toEqual('amazonvideo');
        expect(servicesData[2].exclusionsGroups).toHaveLength(9);
        expect(servicesData[3].serviceId).toEqual('atlassian');
        expect(servicesData[3].exclusionsGroups).toHaveLength(3);
        expect(servicesData[4].serviceId).toEqual('baidu');
        expect(servicesData[4].exclusionsGroups).toHaveLength(11);
    });

    it('getService', async () => {
        const aliexpressServiceData = services.getService('aliexpress');
        expect(JSON.stringify(aliexpressServiceData))
            .toStrictEqual(JSON.stringify(ALIEXPRESS_SERVICE_DATA));

        const wrongService = services.getService('vkdjnvkdhfb');
        expect(wrongService).toBeUndefined();
    });

    it('isService', async () => {
        let serviceId = services.getServiceIdByUrl('aliexpress.com');
        expect(serviceId).toEqual('aliexpress');

        serviceId = services.getServiceIdByUrl('bitbucket.org');
        expect(serviceId).toEqual('atlassian');

        serviceId = services.getServiceIdByUrl('www.bitbucket.org');
        expect(serviceId).toEqual('atlassian');

        serviceId = services.getServiceIdByUrl('http://bitbucket.org');
        expect(serviceId).toEqual('atlassian');

        serviceId = services.getServiceIdByUrl('http://www.bitbucket.org/');
        expect(serviceId).toEqual('atlassian');

        let notService = services.getServiceIdByUrl('example.org');
        expect(notService).toBeNull();

        notService = services.getServiceIdByUrl('bitbucket.com');
        expect(notService).toBeNull();

        notService = services.getServiceIdByUrl('bitbucket');
        expect(notService).toBeNull();
    });
});
