import { exclusionsManager } from '../../src/background/exclusions/ExclusionsManager';
import { servicesManager } from '../../src/background/exclusions/ServicesManager';
import { ExclusionsGroup } from '../../src/background/exclusions/ExclusionsGroup';

const FACEBOOK_SERVICE_DATA = {
    serviceId: 'facebook',
    serviceName: 'Facebook',
    categories: ['SOCIAL_NETWORKS'],
    iconUrl: 'https://icons.adguard.org/icon?domain=facebook.com',
    modifiedTime: '2021-09-14T10:23:00+0000',
    exclusionsGroups: [
        new ExclusionsGroup('facebook.com'),
        new ExclusionsGroup('facebook.net'),
        new ExclusionsGroup('fb.com'),
        new ExclusionsGroup('fb.gg'),
        new ExclusionsGroup('fbcdn.net'),
    ],
};

const GITHUB_SERVICE_DATA = {
    serviceId: 'github',
    serviceName: 'GitHub',
    categories: ['WORK'],
    iconUrl: 'https://icons.adguard.org/icon?domain=github.com',
    modifiedTime: '2021-09-14T10:23:00+0000',
    exclusionsGroups: [
        new ExclusionsGroup('github.com'),
        new ExclusionsGroup('github.io'),
        new ExclusionsGroup('githubapp.com'),
        new ExclusionsGroup('githubassets.com'),
        new ExclusionsGroup('githubusercontent.com'),
        new ExclusionsGroup('ghcr.io'),

    ],
};

// TODO fine tune tsconfig.json

jest.mock('../../src/background/exclusions/ServicesManager');

describe('ExclusionsManager', () => {
    it('add and remove ips, exclusions and services test', () => {
        servicesManager.getService.mockImplementation(() => FACEBOOK_SERVICE_DATA);

        exclusionsManager.addService('facebook');
        exclusionsManager.addExclusionsGroup('test.com');
        exclusionsManager.addIp('192.100.27.34');

        let exclusionsData = exclusionsManager.getExclusionsData();

        expect(exclusionsData.services).toHaveLength(1);
        expect(exclusionsData.exclusions).toHaveLength(1);
        expect(exclusionsData.ips).toHaveLength(1);

        servicesManager.getService.mockImplementation(() => GITHUB_SERVICE_DATA);

        exclusionsManager.addService('github');
        exclusionsManager.addExclusionsGroup('example.org');
        exclusionsManager.addIp('192.0.2.1');

        exclusionsData = exclusionsManager.getExclusionsData();

        expect(exclusionsData.services).toHaveLength(2);
        expect(exclusionsData.exclusions).toHaveLength(2);
        expect(exclusionsData.ips).toHaveLength(2);

        exclusionsManager.removeService('facebook');
        exclusionsManager.removeExclusionsGroup('test.com');
        exclusionsManager.removeIp('192.100.27.34');

        exclusionsData = exclusionsManager.getExclusionsData();

        expect(exclusionsData.services).toHaveLength(1);
        expect(exclusionsData.services[0].serviceId).toEqual('github');
        expect(exclusionsData.services[0].serviceName).toEqual('GitHub');
        expect(exclusionsData.services[0].exclusionsGroups).toHaveLength(6);
        expect(exclusionsData.services[0].exclusionsGroups[0].hostname).toEqual('github.com');
        expect(exclusionsData.services[0].exclusionsGroups[0].exclusions).toHaveLength(2);
        expect(exclusionsData.services[0].exclusionsGroups[0].exclusions[0].hostname).toEqual('github.com');
        expect(exclusionsData.services[0].exclusionsGroups[0].exclusions[0].enabled).toBeTruthy();
        expect(exclusionsData.services[0].exclusionsGroups[0].exclusions[1].hostname).toEqual('*.github.com');
        expect(exclusionsData.services[0].exclusionsGroups[0].exclusions[1].enabled).toBeTruthy();
        expect(exclusionsData.services[0].exclusionsGroups[1].hostname).toEqual('github.io');
        expect(exclusionsData.services[0].exclusionsGroups[2].hostname).toEqual('githubapp.com');

        expect(exclusionsData.exclusions).toHaveLength(1);
        expect(exclusionsData.exclusions[0].hostname).toEqual('example.org');
        expect(exclusionsData.exclusions[0].exclusions).toHaveLength(2);
        expect(exclusionsData.exclusions[0].exclusions[0].hostname).toEqual('example.org');
        expect(exclusionsData.exclusions[0].exclusions[0].enabled).toBeTruthy();
        expect(exclusionsData.exclusions[0].exclusions[1].hostname).toEqual('*.example.org');
        expect(exclusionsData.exclusions[0].exclusions[1].enabled).toBeTruthy();

        expect(exclusionsData.ips).toHaveLength(1);
        expect(exclusionsData.ips[0].hostname).toEqual('192.0.2.1');
        expect(exclusionsData.ips[0].enabled).toBeTruthy();

        // add duplicated data
        exclusionsManager.addService('github');
        exclusionsManager.addExclusionsGroup('example.org');
        exclusionsManager.addIp('192.0.2.1');

        exclusionsData = exclusionsManager.getExclusionsData();

        expect(exclusionsData.services).toHaveLength(1);
        expect(exclusionsData.exclusions).toHaveLength(1);
        expect(exclusionsData.ips).toHaveLength(1);
    });

    it('toggle ips, exclusions and services state test', () => {
        exclusionsManager.addIp('192.100.27.34');
        let exclusionsData = exclusionsManager.getExclusionsData();

        expect(exclusionsData.ips[0].enabled).toBeTruthy();
        const ipId = exclusionsData.ips[0].id;
        exclusionsManager.toggleIpState(ipId);
        exclusionsData = exclusionsManager.getExclusionsData();

        expect(exclusionsData.ips[0].enabled).toBeFalsy();
    });
});
