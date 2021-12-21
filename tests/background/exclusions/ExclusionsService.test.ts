import { ExclusionsService } from '../../../src/background/exclusions/ExclusionsService';

jest.mock('../../../src/background/browserApi');

jest.mock('../../../src/lib/logger.js');

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

describe('ExclusionsService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('empty after init', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();

        const exclusionsData = exclusionsService.getExclusions();
        expect(exclusionsData).toHaveLength(0);
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

        await exclusionsService.addUrlToExclusions('https://мвд.рф/');
        expect(exclusionsService.isVpnEnabledByUrl('https://xn--b1aew.xn--p1ai')).toBeFalsy();
    });

    // it('should return false if hostname is IN exclusions and is not enabled', async () => {
    //     let exclusionsData = exclusionsService.getExclusions();
    //     expect(exclusionsData.excludedIps).toHaveLength(0);
    //     expect(exclusionsData.exclusionsGroups).toHaveLength(0);
    //     expect(exclusionsData.excludedServices).toHaveLength(0);
    //
    //     await exclusionsService.addUrlToExclusions('http://example.org');
    //     exclusionsData = exclusionsService.getExclusions();
    //     expect(exclusionsData.exclusionsGroups).toHaveLength(1);
    //     // eslint-disable-next-line no-unused-vars
    //     const exclusionsGroup = exclusionsData.exclusionsGroups[0];
    //     expect(exclusionsService.isExcluded('http://example.org')).toBeTruthy();
    //     expect(exclusionsData.exclusionsGroups[0].state).toEqual(ExclusionStates.Enabled);
    //
    //     await exclusionsService.toggleExclusionsGroupState(exclusionsGroup.id);
    //     exclusionsData = exclusionsService.getExclusions();
    //     expect(exclusionsData.exclusionsGroups).toHaveLength(1);
    //     expect(exclusionsData.exclusionsGroups[0].state).toEqual(ExclusionStates.Disabled);
    //     expect(exclusionsData.exclusionsGroups[0].hostname).toEqual('example.org');
    //     expect(exclusionsService.isExcluded('http://example.org')).toBeFalsy();
    // });
    //
    // it('should toggle correctly', async () => {
    //     await exclusionsService.addUrlToExclusions('http://example.org');
    //     const exclusionsData = exclusionsService.getExclusions();
    //     expect(exclusionsData.exclusionsGroups).toHaveLength(1);
    //     expect(exclusionsService.isExcluded('http://example.org')).toBeTruthy();
    //     await exclusionsService.toggleExclusionsGroupState(exclusionsData.exclusionsGroups[0].id);
    //     expect(exclusionsService.isExcluded('http://example.org')).toBeFalsy();
    //     await exclusionsService.toggleExclusionsGroupState(exclusionsData.exclusionsGroups[0].id);
    //     expect(exclusionsService.isExcluded('http://example.org')).toBeTruthy();
    // });
    //
    // it('should add more than one correctly', async () => {
    //     await exclusionsService.addUrlToExclusions('http://example.org');
    //     await exclusionsService.addUrlToExclusions('http://example1.org');
    //     let exclusionsData = exclusionsService.getExclusions();
    //     expect(exclusionsData.exclusionsGroups).toHaveLength(2);
    //     const removedExclusionGroup = exclusionsData.exclusionsGroups[0];
    //     await exclusionsService.removeExclusionsGroup(removedExclusionGroup.id);
    //     exclusionsData = exclusionsService.getExclusions();
    //     expect(exclusionsData.exclusionsGroups).toHaveLength(1);
    // });
    //
    // it('subdomains states on toggling exclusions group state and adding duplicated group', async () => {
    //     await exclusionsService.addExclusionsGroup('example.org');
    //     let exclusionsData = exclusionsService.getExclusions();
    //     expect(exclusionsData.exclusionsGroups[0].state).toEqual(ExclusionStates.Enabled);
    //     const groupId = exclusionsData.exclusionsGroups[0].id;
    //     // add subdomain
    //     await exclusionsService.addSubdomainToExclusionsGroup(groupId, 'test');
    //     expect(exclusionsService.isExcluded('http://test.example.org')).toBeTruthy();
    //
    //     exclusionsData = exclusionsService.getExclusions();
    //     expect(exclusionsData.exclusionsGroups).toHaveLength(1);
    //     expect(exclusionsData.exclusionsGroups[0].state).toEqual(ExclusionStates.Enabled);
    //     expect(exclusionsData.exclusionsGroups[0].exclusions).toHaveLength(3);
    //     expect(exclusionsData.exclusionsGroups[0].exclusions[1].hostname).toEqual('*.example.org');
    //     expect(exclusionsData.exclusionsGroups[0].exclusions[2].hostname).toEqual('test.example.org');
    //     // added subdomain should be disabled
    //     expect(exclusionsData.exclusionsGroups[0].exclusions[2].enabled)
    //         .toEqual(ExclusionStates.Enabled);
    //
    //     // toggle group state
    //     await exclusionsService.toggleExclusionsGroupState(groupId);
    //     exclusionsData = exclusionsService.getExclusions();
    //     expect(exclusionsData.exclusionsGroups).toHaveLength(1);
    //     expect(exclusionsData.exclusionsGroups[0].state).toEqual(ExclusionStates.Disabled);
    //     expect(exclusionsService.isExcluded('http://test.example.org')).toBeFalsy();
    //     expect(exclusionsService.isExcluded('www.example.org')).toBeFalsy();
    //
    //     exclusionsData.exclusionsGroups[0].exclusions.forEach((exclusion) => {
    //         // all subdomain should be disabled after disabling exclusions group
    //         expect(exclusion.enabled).toEqual(ExclusionStates.Disabled);
    //     });
    //
    //     // add duplicated exclusions group
    //     await exclusionsService.addExclusionsGroup('example.org');
    //     exclusionsData = exclusionsService.getExclusions();
    //
    //     expect(exclusionsData.exclusionsGroups).toHaveLength(1);
    //     expect(exclusionsData.exclusionsGroups[0].state).toEqual(ExclusionStates.Enabled);
    //     expect(exclusionsService.isExcluded('http://test.example.org')).toBeTruthy();
    //     expect(exclusionsService.isExcluded('www.example.org')).toBeTruthy();
    //     expect(exclusionsData.exclusionsGroups[0].exclusions).toHaveLength(3);
    //     exclusionsData.exclusionsGroups[0].exclusions.forEach((exclusion) => {
    //         // all subdomain should be enabled after adding duplicated exclusions group
    //         expect(exclusion.enabled).toEqual(ExclusionStates.Enabled);
    //     });
    // });
    //
    // it('import exclusions data', async () => {
    //     await exclusionsService.importExclusionsData(testExclusionsData);
    //     let exclusionsData = exclusionsService.getExclusions();
    //     expect(exclusionsData.excludedServices).toHaveLength(1);
    //     expect(exclusionsData.excludedServices[0].serviceId).toEqual('github');
    //     expect(exclusionsData.excludedServices[0].state).toEqual(ExclusionStates.Enabled);
    //     expect(exclusionsData.exclusionsGroups).toHaveLength(1);
    //     expect(exclusionsData.exclusionsGroups[0].hostname).toEqual('example.org');
    //     expect(exclusionsData.exclusionsGroups[0].state).toEqual(ExclusionStates.Enabled);
    //     expect(exclusionsData.excludedIps).toHaveLength(1);
    //     expect(exclusionsData.excludedIps[0].hostname).toEqual('192.168.35.41');
    //     expect(exclusionsData.excludedIps[0].enabled).toEqual(ExclusionStates.Enabled);
    //
    //     // disable all imported exclusions
    //     await exclusionsService.toggleServiceState('github');
    //     await exclusionsService.toggleExclusionsGroupState(exclusionsData.exclusionsGroups[0].id);
    //     await exclusionsService.toggleIpState(exclusionsData.excludedIps[0].id);
    //
    //     exclusionsData = exclusionsService.getExclusions();
    //     expect(exclusionsData.excludedServices[0].state).toEqual(ExclusionStates.Disabled);
    //     expect(exclusionsData.exclusionsGroups[0].state).toEqual(ExclusionStates.Disabled);
    //     expect(exclusionsData.excludedIps[0].enabled).toEqual(ExclusionStates.Disabled);
    //
    //     // import same exclusions one more time
    //     await exclusionsService.importExclusionsData(testExclusionsData);
    //     exclusionsData = exclusionsService.getExclusions();
    //
    //     // exclusions should not be duplicated and should be enabled (as had been exported)
    //     expect(exclusionsData.excludedServices).toHaveLength(1);
    //     expect(exclusionsData.excludedServices[0].serviceId).toEqual('github');
    //     expect(exclusionsData.excludedServices[0].state).toEqual(ExclusionStates.Enabled);
    //     expect(exclusionsData.exclusionsGroups).toHaveLength(1);
    //     expect(exclusionsData.exclusionsGroups[0].hostname).toEqual('example.org');
    //     expect(exclusionsData.exclusionsGroups[0].state).toEqual(ExclusionStates.Enabled);
    //     expect(exclusionsData.excludedIps).toHaveLength(1);
    //     expect(exclusionsData.excludedIps[0].hostname).toEqual('192.168.35.41');
    //     expect(exclusionsData.excludedIps[0].enabled).toEqual(ExclusionStates.Enabled);
    // });
    //
    // it('add manually service domain (case 2)', async () => {
    //     // add to exclusions http://www.github.com, it should become service
    //     await exclusionsService.addUrlToExclusions('www.github.com');
    //     const exclusionsData = exclusionsService.getExclusions();
    //
    //     expect(exclusionsData.excludedServices).toHaveLength(1);
    //     expect(exclusionsData.excludedServices[0].serviceId).toEqual('github');
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups).toHaveLength(6);
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[0].hostname)
    //         .toEqual('github.com');
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[0].state)
    //         .toEqual(ExclusionStates.Enabled);
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[1].hostname)
    //         .toEqual('github.io');
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[1].state)
    //         .toEqual(ExclusionStates.Disabled);
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[2].state)
    //         .toEqual(ExclusionStates.Disabled);
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[3].state)
    //         .toEqual(ExclusionStates.Disabled);
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[4].state)
    //         .toEqual(ExclusionStates.Disabled);
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[5].state)
    //         .toEqual(ExclusionStates.Disabled);
    // });
    //
    // it('service default data', async () => {
    //     getServiceMock.mockImplementation(() => GITHUB_SERVICE_DATA);
    //     getServiceIdByUrlMock.mockImplementation(() => 'github');
    //     // add github service
    //     await exclusionsService.addService('github');
    //     let exclusionsData = exclusionsService.getExclusions();
    //
    //     expect(exclusionsData.excludedServices).toHaveLength(1);
    //     expect(exclusionsData.excludedServices[0].serviceId).toEqual('github');
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups).toHaveLength(6);
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[0].hostname)
    //         .toEqual('github.com');
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[0].state)
    //         .toEqual(ExclusionStates.Enabled);
    //
    //     // remove 'github.com' ExclusionsGroup from Service
    //     await exclusionsService.removeExclusionsGroupFromService(
    //         'github',
    //         exclusionsData.excludedServices[0].exclusionsGroups[0].id,
    //     );
    //     exclusionsData = exclusionsService.getExclusions();
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups).toHaveLength(5);
    //
    //     // remove service
    //     await exclusionsService.removeService('github');
    //     exclusionsData = exclusionsService.getExclusions();
    //     expect(exclusionsData.excludedServices).toHaveLength(0);
    //
    //     // add same service one more time
    //     await exclusionsService.addService('github.com');
    //     exclusionsData = exclusionsService.getExclusions();
    //
    //     expect(exclusionsData.excludedServices[0].serviceId).toEqual('github');
    //     // amount of ExclusionsGroups should should be similar to default service data
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups).toHaveLength(6);
    // });
    //
    // it('service exclusions groups default data', async () => {
    //     getServiceMock.mockImplementation(() => GITHUB_SERVICE_DATA);
    //     getServiceIdByUrlMock.mockImplementation(() => 'github');
    //     // add github service
    //     await exclusionsService.addService('github');
    //     let exclusionsData = exclusionsService.getExclusions();
    //
    //     expect(exclusionsData.excludedServices).toHaveLength(1);
    //     expect(exclusionsData.excludedServices[0].serviceId).toEqual('github');
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[0].hostname)
    //         .toEqual('github.com');
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[0].exclusions[1].hostname)
    //         .toEqual('*.github.com');
    //
    //     // remove '*.github.com' exclusion from 'github.com' ExclusionsGroup from github Service
    //     await exclusionsService.removeSubdomainFromExclusionsGroupInService(
    //         'github',
    //         exclusionsData.excludedServices[0].exclusionsGroups[0].id,
    //         exclusionsData.excludedServices[0].exclusionsGroups[0].exclusions[1].id,
    //     );
    //
    //     exclusionsData = exclusionsService.getExclusions();
    //     expect(exclusionsData.excludedServices[0].serviceId).toEqual('github');
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[0].hostname)
    //         .toEqual('github.com');
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[0].exclusions[0].hostname)
    //         .toEqual('github.com');
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[0].exclusions)
    //         .toHaveLength(1);
    //
    //     // remove service
    //     await exclusionsService.removeService('github');
    //     exclusionsData = exclusionsService.getExclusions();
    //     expect(exclusionsData.excludedServices).toHaveLength(0);
    //
    //     // add same service one more time
    //     await exclusionsService.addService('github.com');
    //     exclusionsData = exclusionsService.getExclusions();
    //
    //     // ExclusionsGroups should have same amount of exclusions as default service data
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[0].exclusions)
    //         .toHaveLength(2);
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[0].exclusions[0].hostname)
    //         .toEqual('github.com');
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[0].exclusions[1].hostname)
    //         .toEqual('*.github.com');
    // });
    //
    // it('disable exclusion by url', async () => {
    //     getServiceMock.mockImplementation(() => FACEBOOK_SERVICE_DATA);
    //     // add service
    //     await exclusionsService.addService('facebook');
    //     getServiceIdByUrlMock.mockImplementation(() => null);
    //     // add exclusions group
    //     await exclusionsService.addUrlToExclusions('http://www.test.com');
    //
    //     let exclusionsData = exclusionsService.getExclusions();
    //     expect(exclusionsData.excludedServices).toHaveLength(1);
    //     expect(exclusionsData.excludedServices[0].state).toEqual(ExclusionStates.Enabled);
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[0].hostname).toEqual('facebook.com');
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[0].state)
    //         .toEqual(ExclusionStates.Enabled);
    //     expect(exclusionsData.exclusionsGroups).toHaveLength(1);
    //     expect(exclusionsData.exclusionsGroups[0].state).toEqual(ExclusionStates.Enabled);
    //     expect(exclusionsData.exclusionsGroups[0].exclusions[0].hostname).toEqual('test.com');
    //     expect(exclusionsData.exclusionsGroups[0].exclusions[0].enabled)
    //         .toEqual(ExclusionStates.Enabled);
    //
    //     expect(exclusionsData.exclusionsGroups[0].hostname).toEqual('test.com');
    //
    //     // disable service and exclusions group
    //     await exclusionsService.disableExclusionByUrl('test.com');
    //     await exclusionsService.disableExclusionByUrl('facebook.com');
    //     exclusionsData = exclusionsService.getExclusions();
    //     // service should be partly enabled
    //     expect(exclusionsData.excludedServices[0].state).toEqual(ExclusionStates.PartlyEnabled);
    //     // exclusions group in service should be disabled
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[0].state)
    //         .toEqual(ExclusionStates.Disabled);
    //     // exclusions group should be disabled
    //     expect(exclusionsData.exclusionsGroups[0].state).toEqual(ExclusionStates.Disabled);
    //     expect(exclusionsData.exclusionsGroups[0].exclusions[0].enabled)
    //         .toEqual(ExclusionStates.Disabled);
    // });
    //
    // it('reset service data', async () => {
    //     getServiceMock.mockImplementation(() => FACEBOOK_SERVICE_DATA);
    //     // add facebook service
    //     await exclusionsService.addService('facebook');
    //     let exclusionsData = exclusionsService.getExclusions();
    //
    //     expect(exclusionsData.excludedServices).toHaveLength(1);
    //     expect(exclusionsData.excludedServices[0].state).toEqual(ExclusionStates.Enabled);
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups).toHaveLength(5);
    //
    //     // disable facebook.com exclusions group in facebook service
    //     await exclusionsService.toggleExclusionsGroupStateInService(
    //         exclusionsData.excludedServices[0].serviceId,
    //         exclusionsData.excludedServices[0].exclusionsGroups[0].id,
    //     );
    //
    //     // add 'test' subdomain to fb.com exclusions group in facebook service
    //     await exclusionsService.addSubdomainToExclusionsGroupInService(
    //         exclusionsData.excludedServices[0].serviceId,
    //         exclusionsData.excludedServices[0].exclusionsGroups[2].id,
    //         'test',
    //     );
    //
    //     // disable test.fb.com subdomain in fb.com exclusions group in facebook service
    //     await exclusionsService.toggleSubdomainStateInExclusionsGroupInService(
    //         exclusionsData.excludedServices[0].serviceId,
    //         exclusionsData.excludedServices[0].exclusionsGroups[2].id,
    //         exclusionsData.excludedServices[0].exclusionsGroups[2].exclusions[2].id,
    //     );
    //
    //     // delete facebook.net exclusions group from facebook service
    //     await exclusionsService.removeExclusionsGroupFromService(
    //         exclusionsData.excludedServices[0].serviceId,
    //         exclusionsData.excludedServices[0].exclusionsGroups[1].id,
    //     );
    //
    //     exclusionsData = exclusionsService.getExclusions();
    //     expect(exclusionsData.excludedServices[0].state).toEqual(ExclusionStates.PartlyEnabled);
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups).toHaveLength(4);
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[0].state)
    //         .toEqual(ExclusionStates.Disabled);
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[1].hostname)
    //         .toEqual('fb.com');
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[1].state)
    //         .toEqual(ExclusionStates.PartlyEnabled);
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[1].exclusions[2].hostname)
    //         .toEqual('test.fb.com');
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[1].exclusions[2].enabled)
    //         .toEqual(ExclusionStates.Disabled);
    //
    //     // reset service data
    //     await exclusionsService.resetServiceData(exclusionsData.excludedServices[0].serviceId);
    //     exclusionsData = exclusionsService.getExclusions();
    //     expect(exclusionsData.excludedServices[0].state).toEqual(ExclusionStates.PartlyEnabled);
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups).toHaveLength(5);
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[0].hostname)
    //         .toEqual('facebook.com');
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[0].state)
    //         .toEqual(ExclusionStates.Enabled);
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[1].hostname)
    //         .toEqual('facebook.net');
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[1].state)
    //         .toEqual(ExclusionStates.Enabled);
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[2].hostname)
    //         .toEqual('fb.com');
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[2].state)
    //         .toEqual(ExclusionStates.PartlyEnabled);
    //     // manually added subdomain should not be deleted and should have the same state (disabled)
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[2].exclusions[2].hostname)
    //         .toEqual('test.fb.com');
    //     expect(exclusionsData.excludedServices[0].exclusionsGroups[2].exclusions[2].enabled)
    //         .toEqual(ExclusionStates.Disabled);
    // });
});
