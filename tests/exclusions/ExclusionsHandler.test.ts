import { ExclusionsHandler } from '../../src/background/exclusions/ExclusionsHandler';
import { servicesManager } from '../../src/background/exclusions/ServicesManager';
import { ExclusionsGroup, State } from '../../src/background/exclusions/ExclusionsGroup';

const exclusionsHandler = new ExclusionsHandler(() => {}, {
    excludedServices: [],
    exclusionsGroups: [],
    excludedIps: [],
}, 'true');

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
    afterEach(async (done) => {
        await exclusionsHandler.clearExclusionsData();
        done();
    });

    it('should be empty after construction', () => {
        const exclusionsData = exclusionsHandler.getExclusions();
        expect(exclusionsData.excludedIps).toHaveLength(0);
        expect(exclusionsData.exclusionsGroups).toHaveLength(0);
        expect(exclusionsData.excludedServices).toHaveLength(0);
    });

    it('should return false if hostname is NOT in exclusions', () => {
        expect(exclusionsHandler.isExcluded('http://example.org')).toEqual(false);
        expect(exclusionsHandler.isExcluded('xn--b1aew.xn--p1ai/')).toEqual(false);
    });

    it('should return true if hostname is IN exclusions', async () => {
        await exclusionsHandler.addUrlToExclusions('http://example.org');
        await exclusionsHandler.addUrlToExclusions('мвд.рф');
        const exclusionsData = exclusionsHandler.getExclusions();

        expect(exclusionsData.exclusionsGroups).toHaveLength(2);
        expect(exclusionsHandler.isExcluded('http://example.org')).toEqual(true);
        expect(exclusionsHandler.isExcluded('https://xn--b1aew.xn--p1ai/contacts')).toEqual(true);
    });

    it('should return false if hostname is IN exclusions and is not enabled', () => {
        let exclusionsData = exclusionsHandler.getExclusions();
        expect(exclusionsData.excludedIps).toHaveLength(0);
        expect(exclusionsData.exclusionsGroups).toHaveLength(0);
        expect(exclusionsData.excludedServices).toHaveLength(0);

        exclusionsHandler.addUrlToExclusions('http://example.org');
        exclusionsData = exclusionsHandler.getExclusions();
        expect(exclusionsData.exclusionsGroups).toHaveLength(1);
        // eslint-disable-next-line no-unused-vars
        const exclusion = exclusionsData.exclusionsGroups[0];
        expect(exclusionsHandler.isExcluded('http://example.org')).toEqual(true);

        // TODO finish test (add method toggle ExclusionsGroup state)
        // exclusionsHandler.toggleExclusion(exclusion.id);
        // exclusionsList = exclusionsHandler.getExclusionsList();
        // expect(exclusionsList.length).toEqual(1);
        // expect(exclusionsList[0].enabled).toBeFalsy();
        // expect(exclusionsList[0].hostname).toEqual('example.org');
        // expect(exclusionsHandler.isExcluded('http://example.org')).toEqual(false);
    });

    // TODO finish test (add method toggle ExclusionsGroup state)
    // it('should toggle correctly', () => {
    //     exclusionsHandler.addUrlToExclusions('http://example.org');
    //     const exclusionsList = exclusionsHandler.getExclusions();
    //     expect(exclusionsList.length).toEqual(1);
    //     expect(exclusionsHandler.isExcluded('http://example.org')).toBeTruthy();
    //     exclusionsHandler.toggleExclusion(exclusionsList[0].id);
    //     expect(exclusionsHandler.isExcluded('http://example.org')).toBeFalsy();
    //     exclusionsHandler.toggleExclusion(exclusionsList[0].id);
    //     expect(exclusionsHandler.isExcluded('http://example.org')).toBeTruthy();
    // });

    it('should add more than one correctly', async () => {
        await exclusionsHandler.addUrlToExclusions('http://example.org');
        await exclusionsHandler.addUrlToExclusions('http://example1.org');
        let exclusionsData = exclusionsHandler.getExclusions();
        expect(exclusionsData.exclusionsGroups).toHaveLength(2);
        const removedExclusionGroup = exclusionsData.exclusionsGroups[0];
        await exclusionsHandler.removeExclusionsGroup(removedExclusionGroup.id);
        exclusionsData = exclusionsHandler.getExclusions();
        expect(exclusionsData.exclusionsGroups).toHaveLength(1);
    });

    it('add and remove ips, exclusions groups and services', async () => {
        servicesManager.getService.mockImplementation(() => FACEBOOK_SERVICE_DATA);

        await exclusionsHandler.addService('facebook');
        await exclusionsHandler.addExclusionsGroup('test.com');
        await exclusionsHandler.addIp('192.100.27.34');

        let exclusionsData = exclusionsHandler.getExclusions();
        const groupId = exclusionsData.exclusionsGroups[0].id;

        expect(exclusionsData.excludedServices).toHaveLength(1);
        expect(exclusionsData.exclusionsGroups).toHaveLength(1);
        expect(exclusionsData.excludedIps).toHaveLength(1);

        servicesManager.getService.mockImplementation(() => GITHUB_SERVICE_DATA);

        await exclusionsHandler.addService('github');
        await exclusionsHandler.addExclusionsGroup('example.org');
        await exclusionsHandler.addIp('192.0.2.1');

        exclusionsData = exclusionsHandler.getExclusions();

        expect(exclusionsData.excludedServices).toHaveLength(2);
        expect(exclusionsData.exclusionsGroups).toHaveLength(2);
        expect(exclusionsData.excludedIps).toHaveLength(2);

        await exclusionsHandler.removeService('facebook');
        // remove test.com group
        await exclusionsHandler.removeExclusionsGroup(groupId);
        await exclusionsHandler.removeIp('192.100.27.34');

        exclusionsData = exclusionsHandler.getExclusions();

        expect(exclusionsData.excludedServices).toHaveLength(1);
        expect(exclusionsData.excludedServices[0].serviceId).toEqual('github');
        expect(exclusionsData.excludedServices[0].serviceName).toEqual('GitHub');
        expect(exclusionsData.excludedServices[0].exclusionsGroups).toHaveLength(6);
        expect(exclusionsData.excludedServices[0].exclusionsGroups[0].hostname).toEqual('github.com');
        expect(exclusionsData.excludedServices[0].exclusionsGroups[0].exclusions).toHaveLength(2);
        expect(exclusionsData.excludedServices[0].exclusionsGroups[0].exclusions[0].hostname).toEqual('github.com');
        expect(exclusionsData.excludedServices[0].exclusionsGroups[0]
            .exclusions[0].enabled).toBeTruthy();
        expect(exclusionsData.excludedServices[0].exclusionsGroups[0].exclusions[1].hostname).toEqual('*.github.com');
        expect(exclusionsData.excludedServices[0].exclusionsGroups[0]
            .exclusions[1].enabled).toBeTruthy();
        expect(exclusionsData.excludedServices[0].exclusionsGroups[1].hostname).toEqual('github.io');
        expect(exclusionsData.excludedServices[0].exclusionsGroups[2].hostname).toEqual('githubapp.com');

        expect(exclusionsData.exclusionsGroups).toHaveLength(1);
        expect(exclusionsData.exclusionsGroups[0].hostname).toEqual('example.org');
        expect(exclusionsData.exclusionsGroups[0].exclusions).toHaveLength(2);
        expect(exclusionsData.exclusionsGroups[0].exclusions[0].hostname).toEqual('example.org');
        expect(exclusionsData.exclusionsGroups[0].exclusions[0].enabled).toBeTruthy();
        expect(exclusionsData.exclusionsGroups[0].exclusions[1].hostname).toEqual('*.example.org');
        expect(exclusionsData.exclusionsGroups[0].exclusions[1].enabled).toBeTruthy();

        expect(exclusionsData.excludedIps).toHaveLength(1);
        expect(exclusionsData.excludedIps[0].hostname).toEqual('192.0.2.1');
        expect(exclusionsData.excludedIps[0].enabled).toBeTruthy();

        // add duplicated data
        await exclusionsHandler.addService('github');
        await exclusionsHandler.addExclusionsGroup('example.org');
        await exclusionsHandler.addIp('192.0.2.1');

        exclusionsData = exclusionsHandler.getExclusions();

        expect(exclusionsData.excludedServices).toHaveLength(1);
        expect(exclusionsData.exclusionsGroups).toHaveLength(1);
        expect(exclusionsData.excludedIps).toHaveLength(1);
    });

    it('add and remove subdomain to ExclusionsGroup', async () => {
        await exclusionsHandler.addExclusionsGroup('example.org');
        let exclusionsData = exclusionsHandler.getExclusions();
        const exclusionsGroupId = exclusionsData.exclusionsGroups[0].id;
        await exclusionsHandler.addSubdomainToExclusionsGroup(exclusionsGroupId, 'test');

        exclusionsData = exclusionsHandler.getExclusions();
        expect(exclusionsData.exclusionsGroups[0].exclusions.length).toEqual(3);
        expect(exclusionsData.exclusionsGroups[0].exclusions[0].hostname).toEqual('example.org');
        expect(exclusionsData.exclusionsGroups[0].exclusions[1].hostname).toEqual('*.example.org');
        expect(exclusionsData.exclusionsGroups[0].exclusions[1].enabled).toBeFalsy();
        expect(exclusionsData.exclusionsGroups[0].exclusions[2].hostname).toEqual('test.example.org');
        expect(exclusionsData.exclusionsGroups[0].exclusions[2].enabled).toBeTruthy();

        const subdomainId = exclusionsData.exclusionsGroups[0].exclusions[2].id;
        await exclusionsHandler.removeSubdomainFromExclusionsGroup(exclusionsGroupId, subdomainId);
        exclusionsData = exclusionsHandler.getExclusions();

        expect(exclusionsData.exclusionsGroups[0].exclusions.length).toEqual(2);
        expect(exclusionsData.exclusionsGroups[0].exclusions.some((exclusion) => exclusion.hostname === 'test.example.org')).toBeFalsy();
    });

    it('add and remove subdomain to Service\'s ExclusionsGroup', async () => {
        servicesManager.getService.mockImplementation(() => GITHUB_SERVICE_DATA);
        await exclusionsHandler.addService('github');
        let exclusionsData = exclusionsHandler.getExclusions();
        const exclusionsGroupId = exclusionsData.excludedServices[0].exclusionsGroups[0].id;
        // add subdomain 'test' to github.com exclusions group in GitHub service
        await exclusionsHandler.addSubdomainToServiceExclusionsGroup('github', exclusionsGroupId, 'test');
        exclusionsData = exclusionsHandler.getExclusions();

        expect(exclusionsData.excludedServices[0].serviceId).toEqual('github');
        expect(exclusionsData.excludedServices[0].exclusionsGroups[0].exclusions.length).toEqual(3);
        expect(exclusionsData.excludedServices[0].exclusionsGroups[0].exclusions[2].hostname).toEqual('test.github.com');

        const subdomainId = exclusionsData.excludedServices[0].exclusionsGroups[0].exclusions[2].id;
        // remove subdomain 'test' from github.com exclusions group in GitHub service
        await exclusionsHandler.removeSubdomainFromServiceExclusionsGroup('github', exclusionsGroupId, subdomainId);
        exclusionsData = exclusionsHandler.getExclusions();

        expect(exclusionsData.excludedServices[0].exclusionsGroups[0].exclusions.length).toEqual(2);
        expect(exclusionsData.excludedServices[0].exclusionsGroups[0].exclusions
            .some((exclusion) => exclusion.hostname === 'test.github.com')).toBeFalsy();
    });

    it('toggle ips, exclusions and services state test', async () => {
        await exclusionsHandler.addIp('192.100.50.33');
        let exclusionsData = exclusionsHandler.getExclusions();

        expect(exclusionsData.excludedIps[0].hostname).toEqual('192.100.50.33');
        expect(exclusionsData.excludedIps[0].enabled).toBeTruthy();

        const ipId = exclusionsData.excludedIps[0].id;
        await exclusionsHandler.toggleIpState(ipId);
        exclusionsData = exclusionsHandler.getExclusions();

        expect(exclusionsData.excludedIps[0].enabled).toBeFalsy();

        await exclusionsHandler.toggleIpState(ipId);
        exclusionsData = exclusionsHandler.getExclusions();

        expect(exclusionsData.excludedIps[0].enabled).toBeTruthy();
    });

    it('subdomains states on adding duplicated exclusions group', () => {
        exclusionsHandler.addExclusionsGroup('test.com');
        let exclusionsData = exclusionsHandler.getExclusions();
        const groupId = exclusionsData.exclusionsGroups[0].id;
        // add subdomain
        exclusionsHandler.addSubdomainToExclusionsGroup(groupId, 'example');
        exclusionsData = exclusionsHandler.getExclusions();
        expect(exclusionsData.exclusionsGroups).toHaveLength(1);
        expect(exclusionsData.exclusionsGroups[0].state).toEqual(State.PartlyEnabled);
        expect(exclusionsData.exclusionsGroups[0].exclusions).toHaveLength(3);
        expect(exclusionsData.exclusionsGroups[0].exclusions[1].hostname).toEqual('*.test.com');
        // subdomains pattern state should be disabled after adding subdomain
        expect(exclusionsData.exclusionsGroups[0].exclusions[1].enabled).toBeFalsy();

        // add duplicated exclusions group
        exclusionsHandler.addExclusionsGroup('test.com');
        exclusionsData = exclusionsHandler.getExclusions();

        expect(exclusionsData.exclusionsGroups).toHaveLength(1);
        expect(exclusionsData.exclusionsGroups[0].state).toEqual(State.Enabled);
        expect(exclusionsData.exclusionsGroups[0].exclusions).toHaveLength(3);
        exclusionsData.exclusionsGroups[0].exclusions.forEach((exclusion) => {
            // all subdomain should be enabled after adding duplicated exclusions group
            expect(exclusion.enabled).toBeTruthy();
        });
    });
});
