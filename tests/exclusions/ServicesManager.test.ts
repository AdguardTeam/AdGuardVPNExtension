import { nanoid } from 'nanoid';

import { servicesManager } from '../../src/background/exclusions/ServicesManager';
import vpnProvider from '../../src/background/providers/vpnProvider';
import { Service } from '../../src/background/exclusions/Service';
import { ExclusionsGroup } from '../../src/background/exclusions/ExclusionsGroup';

jest.mock('../../src/background/providers/vpnProvider');
jest.mock('nanoid');

nanoid.mockImplementation(() => 'zzzzzzzzz');

const SERVICES_DATA = [
    {
        categories: ['SHOP'],
        iconUrl: 'https://icons.adguard.org/icon?domain=aliexpress.com',
        modifiedTime: '2021-09-14T10:23:00+0000',
        serviceId: 'aliexpress',
        serviceName: 'Aliexpress',
    },
    {
        categories: ['SHOP'],
        iconUrl: 'https://icons.adguard.org/icon?domain=amazon.com',
        modifiedTime: '2021-09-14T10:23:00+0000',
        serviceId: 'amazon',
        serviceName: 'Amazon',
    },
    {
        categories: ['VIDEO'],
        iconUrl: 'https://icons.adguard.org/icon?domain=amazonvideo.com',
        modifiedTime: '2021-09-14T10:23:00+0000',
        serviceId: 'amazonvideo',
        serviceName: 'Amazon prime',
    },
    {
        categories: ['WORK'],
        iconUrl: 'https://icons.adguard.org/icon?domain=atlassian.com',
        modifiedTime: '2021-09-14T10:23:00+0000',
        serviceId: 'atlassian',
        serviceName: 'Atlassian',
    },
    {
        categories: ['SEARCH'],
        iconUrl: 'https://icons.adguard.org/icon?domain=baidu.com',
        modifiedTime: '2021-09-14T10:23:00+0000',
        serviceId: 'baidu',
        serviceName: 'Baidu',
    },
];

const SERVICES_DOMAINS = [
    {
        domains: ['aliexpress.com', 'aliexpress.ru'],
        serviceId: 'aliexpress',
    },
    {
        domains: ['a2z.com', 'amazon-corp.com', 'amazon.ca', 'amazon.co.jp', 'amazon.co.uk', 'amazon.com', 'amazon.com.au', 'amazon.com.mx', 'amazon.de', 'amazon.es', 'amazon.eu', 'amazon.fr', 'amazon.in', 'amazon.it', 'amazon.nl', 'amazon.sa', 'amazonbrowserapp.co.uk', 'amazonbrowserapp.es', 'amazoncognito.com', 'amazoncrl.com', 'amazonpay.com', 'amazonpay.in', 'amazontrust.com', 'associates-amazon.com', 'images-amazon.com', 'media-amazon.com', 'ssl-images-amazon.com'],
        serviceId: 'amazon',
    },
    {
        domains: ['aiv-cdn.net', 'aiv-delivery.net', 'amazonvideo.com', 'atv-ext-eu.amazon.com', 'atv-ext-fe.amazon.com', 'atv-ext.amazon.com', 'atv-ps.amazon.com', 'primevideo.com', 'pv-cdn.net'],
        serviceId: 'amazonvideo',
    },
    {
        domains: ['atlassian.com', 'atlassian.net', 'bitbucket.org'],
        serviceId: 'atlassian',
    },
    {
        domains: ['baidu.com', 'baiducontent.com', 'baidupcs.com', 'baidustatic.com', 'bcebos.com', 'bdimg.com', 'bdstatic.com', 'gshifen.com', 'popin.cc', 'shifen.com', 'wshifen.com'],
        serviceId: 'baidu',
    },
];

const ALIEXPRESS_SERVICE_DATA = new Service({
    serviceId: 'aliexpress',
    serviceName: 'Aliexpress',
    categories: ['SHOP'],
    iconUrl: 'https://icons.adguard.org/icon?domain=aliexpress.com',
    modifiedTime: '2021-09-14T10:23:00+0000',
    exclusionsGroups: [
        new ExclusionsGroup('aliexpress.com'),
        new ExclusionsGroup('aliexpress.ru'),
    ],
});

vpnProvider.getExclusionsServices.mockImplementation(() => SERVICES_DATA);
vpnProvider.getExclusionsServicesDomains.mockImplementation(() => SERVICES_DOMAINS);

beforeAll(async (done) => {
    await servicesManager.init();
    done();
});

describe('ServicesManager tests', () => {
    it('initialization', async () => {
        const servicesData = servicesManager.getServicesData();
        expect(servicesData).toHaveLength(5);
        expect(JSON.stringify(servicesData[0]))
            .toStrictEqual(JSON.stringify(ALIEXPRESS_SERVICE_DATA));
        expect(servicesData[1].serviceId).toEqual('amazon');
        expect(servicesData[1].categories).toEqual(['SHOP']);
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
        const aliexpressServiceData = servicesManager.getService('aliexpress');
        expect(JSON.stringify(aliexpressServiceData))
            .toStrictEqual(JSON.stringify(ALIEXPRESS_SERVICE_DATA));

        const wrongService = servicesManager.getService('vkdjnvkdhfb');
        expect(wrongService).toBeUndefined();
    });

    it('isService', async () => {
        let serviceId = servicesManager.isService('aliexpress.com');
        expect(serviceId).toEqual('aliexpress');

        serviceId = servicesManager.isService('bitbucket.org');
        expect(serviceId).toEqual('atlassian');

        serviceId = servicesManager.isService('www.bitbucket.org');
        expect(serviceId).toEqual('atlassian');

        serviceId = servicesManager.isService('http://bitbucket.org');
        expect(serviceId).toEqual('atlassian');

        serviceId = servicesManager.isService('http://www.bitbucket.org/');
        expect(serviceId).toEqual('atlassian');

        let notService = servicesManager.isService('example.org');
        expect(notService).toBeNull();

        notService = servicesManager.isService('bitbucket.com');
        expect(notService).toBeNull();

        notService = servicesManager.isService('bitbucket');
        expect(notService).toBeNull();
    });
});
