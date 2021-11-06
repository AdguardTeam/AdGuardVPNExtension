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
    afterEach(() => {
        exclusionsManager.clearExclusionsData();
    });

    it('add and remove ips, exclusions groups and services', () => {
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

    it('add and remove subdomain to ExclusionsGroup', () => {
        exclusionsManager.addExclusionsGroup('example.org');
        let exclusionsData = exclusionsManager.getExclusionsData();
        const exclusionsGroupId = exclusionsData.exclusions[0].id;
        exclusionsManager.addSubdomainToExclusionsGroup(exclusionsGroupId, 'test');

        exclusionsData = exclusionsManager.getExclusionsData();
        expect(exclusionsData.exclusions[0].exclusions.length).toEqual(3);
        expect(exclusionsData.exclusions[0].exclusions[0].hostname).toEqual('example.org');
        expect(exclusionsData.exclusions[0].exclusions[1].hostname).toEqual('*.example.org');
        expect(exclusionsData.exclusions[0].exclusions[1].enabled).toBeFalsy();
        expect(exclusionsData.exclusions[0].exclusions[2].hostname).toEqual('test.example.org');
        expect(exclusionsData.exclusions[0].exclusions[2].enabled).toBeTruthy();

        const subdomainId = exclusionsData.exclusions[0].exclusions[2].id;
        exclusionsManager.removeSubdomainFromExclusionsGroup(exclusionsGroupId, subdomainId);
        exclusionsData = exclusionsManager.getExclusionsData();

        expect(exclusionsData.exclusions[0].exclusions.length).toEqual(2);
        expect(exclusionsData.exclusions[0].exclusions.some((exclusion) => exclusion.hostname === 'test.example.org')).toBeFalsy();
    });

    it('add and remove subdomain to Service\'s ExclusionsGroup', () => {
        servicesManager.getService.mockImplementation(() => GITHUB_SERVICE_DATA);
        exclusionsManager.addService('github');
        let exclusionsData = exclusionsManager.getExclusionsData();
        const exclusionsGroupId = exclusionsData.services[0].exclusionsGroups[0].id;
        // add subdomain 'test' to github.com exclusions group in GitHub service
        exclusionsManager.addSubdomainToServiceExclusionsGroup('github', exclusionsGroupId, 'test');
        exclusionsData = exclusionsManager.getExclusionsData();

        expect(exclusionsData.services[0].serviceId).toEqual('github');
        expect(exclusionsData.services[0].exclusionsGroups[0].exclusions.length).toEqual(3);
        expect(exclusionsData.services[0].exclusionsGroups[0].exclusions[2].hostname).toEqual('test.github.com');

        const subdomainId = exclusionsData.services[0].exclusionsGroups[0].exclusions[2].id;
        // remove subdomain 'test' from github.com exclusions group in GitHub service
        exclusionsManager.removeSubdomainFromServiceExclusionsGroup('github', exclusionsGroupId, subdomainId);
        exclusionsData = exclusionsManager.getExclusionsData();

        expect(exclusionsData.services[0].exclusionsGroups[0].exclusions.length).toEqual(2);
        expect(exclusionsData.services[0].exclusionsGroups[0].exclusions
            .some((exclusion) => exclusion.hostname === 'test.github.com')).toBeFalsy();
    });

    it('toggle ips, exclusions and services state test', () => {
        exclusionsManager.addIp('192.100.50.33');
        let exclusionsData = exclusionsManager.getExclusionsData();

        expect(exclusionsData.ips[0].hostname).toEqual('192.100.50.33');
        expect(exclusionsData.ips[0].enabled).toBeTruthy();

        const ipId = exclusionsData.ips[0].id;
        exclusionsManager.toggleIpState(ipId);
        exclusionsData = exclusionsManager.getExclusionsData();

        expect(exclusionsData.ips[0].enabled).toBeFalsy();

        exclusionsManager.toggleIpState(ipId);
        exclusionsData = exclusionsManager.getExclusionsData();

        expect(exclusionsData.ips[0].enabled).toBeTruthy();
    });
});
