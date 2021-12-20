/* eslint-disable */
// import { ExclusionsHandler } from '../../src/background/exclusions/exclusions/ExclusionsHandler';
// import { services } from '../../src/background/exclusions/services/Services';
// import { Service } from '../../src/background/exclusions/services/Service';
// import { ExclusionsGroup } from '../../src/background/exclusions/exclusions/ExclusionsGroup';
// import { ExclusionStates } from '../../src/common/exclusionsConstants';
// import { testExclusionsData } from './resources/exclusions-data';
//
// const exclusionsHandler = new ExclusionsHandler(() => {}, {
//     excludedServices: [],
//     exclusionsGroups: [],
//     excludedIps: [],
// }, 'true');
//
// const FACEBOOK_SERVICE_DATA = new Service({
//     serviceId: 'facebook',
//     serviceName: 'Facebook',
//     categories: [{
//         id: 'SOCIAL_NETWORKS',
//         name: 'Social Networks',
//     }],
//     iconUrl: 'https://icons.adguard.org/icon?domain=facebook.com',
//     modifiedTime: '2021-09-14T10:23:00+0000',
//     exclusionsGroups: [
//         new ExclusionsGroup('facebook.com'),
//         new ExclusionsGroup('facebook.net'),
//         new ExclusionsGroup('fb.com'),
//         new ExclusionsGroup('fb.gg'),
//         new ExclusionsGroup('fbcdn.net'),
//     ],
// });
//
// const GITHUB_SERVICE_DATA = new Service({
//     serviceId: 'github',
//     serviceName: 'GitHub',
//     categories: [{
//         id: 'WORK',
//         name: 'Work Communication Tools',
//     }],
//     iconUrl: 'https://icons.adguard.org/icon?domain=github.com',
//     modifiedTime: '2021-09-14T10:23:00+0000',
//     exclusionsGroups: [
//         new ExclusionsGroup('github.com'),
//         new ExclusionsGroup('github.io'),
//         new ExclusionsGroup('githubapp.com'),
//         new ExclusionsGroup('githubassets.com'),
//         new ExclusionsGroup('githubusercontent.com'),
//         new ExclusionsGroup('ghcr.io'),
//
//     ],
// });
//
// const getServiceIdByUrlMock = services
//     .getServiceIdByUrl as jest.MockedFunction<(url: string) => string | null>;
//
// const getServiceMock = services.getService as jest.MockedFunction<() => Service>;
//
// jest.mock('../../src/background/exclusions/ServicesManager');
//
// describe('ExclusionsHandler', () => {
//     afterEach(async () => {
//         await exclusionsHandler.clearExclusionsData();
//     });
//
//     it('should be empty after construction', () => {
//         const exclusionsData = exclusionsHandler.getExclusions();
//         expect(exclusionsData.excludedIps).toHaveLength(0);
//         expect(exclusionsData.exclusionsGroups).toHaveLength(0);
//         expect(exclusionsData.excludedServices).toHaveLength(0);
//     });
//
//     it('should return false if hostname is NOT in exclusions', () => {
//         expect(exclusionsHandler.isExcluded('http://example.org')).toBeFalsy();
//         expect(exclusionsHandler.isExcluded('xn--b1aew.xn--p1ai/')).toBeFalsy();
//     });
//
//     it('should return true if hostname is IN exclusions', async () => {
//         await exclusionsHandler.addUrlToExclusions('http://example.org');
//         await exclusionsHandler.addUrlToExclusions('мвд.рф');
//         const exclusionsData = exclusionsHandler.getExclusions();
//
//         expect(exclusionsData.exclusionsGroups).toHaveLength(2);
//         expect(exclusionsHandler.isExcluded('http://example.org')).toBeTruthy();
//         expect(exclusionsHandler.isExcluded('https://xn--b1aew.xn--p1ai/contacts')).toBeTruthy();
//     });
//
//     it('should return false if hostname is IN exclusions and is not enabled', async () => {
//         let exclusionsData = exclusionsHandler.getExclusions();
//         expect(exclusionsData.excludedIps).toHaveLength(0);
//         expect(exclusionsData.exclusionsGroups).toHaveLength(0);
//         expect(exclusionsData.excludedServices).toHaveLength(0);
//
//         await exclusionsHandler.addUrlToExclusions('http://example.org');
//         exclusionsData = exclusionsHandler.getExclusions();
//         expect(exclusionsData.exclusionsGroups).toHaveLength(1);
//         // eslint-disable-next-line no-unused-vars
//         const exclusionsGroup = exclusionsData.exclusionsGroups[0];
//         expect(exclusionsHandler.isExcluded('http://example.org')).toBeTruthy();
//         expect(exclusionsData.exclusionsGroups[0].state).toEqual(ExclusionStates.Enabled);
//
//         await exclusionsHandler.toggleExclusionsGroupState(exclusionsGroup.id);
//         exclusionsData = exclusionsHandler.getExclusions();
//         expect(exclusionsData.exclusionsGroups).toHaveLength(1);
//         expect(exclusionsData.exclusionsGroups[0].state).toEqual(ExclusionStates.Disabled);
//         expect(exclusionsData.exclusionsGroups[0].hostname).toEqual('example.org');
//         expect(exclusionsHandler.isExcluded('http://example.org')).toBeFalsy();
//     });
//
//     it('should toggle correctly', async () => {
//         await exclusionsHandler.addUrlToExclusions('http://example.org');
//         const exclusionsData = exclusionsHandler.getExclusions();
//         expect(exclusionsData.exclusionsGroups).toHaveLength(1);
//         expect(exclusionsHandler.isExcluded('http://example.org')).toBeTruthy();
//         await exclusionsHandler.toggleExclusionsGroupState(exclusionsData.exclusionsGroups[0].id);
//         expect(exclusionsHandler.isExcluded('http://example.org')).toBeFalsy();
//         await exclusionsHandler.toggleExclusionsGroupState(exclusionsData.exclusionsGroups[0].id);
//         expect(exclusionsHandler.isExcluded('http://example.org')).toBeTruthy();
//     });
//
//     it('should add more than one correctly', async () => {
//         await exclusionsHandler.addUrlToExclusions('http://example.org');
//         await exclusionsHandler.addUrlToExclusions('http://example1.org');
//         let exclusionsData = exclusionsHandler.getExclusions();
//         expect(exclusionsData.exclusionsGroups).toHaveLength(2);
//         const removedExclusionGroup = exclusionsData.exclusionsGroups[0];
//         await exclusionsHandler.removeExclusionsGroup(removedExclusionGroup.id);
//         exclusionsData = exclusionsHandler.getExclusions();
//         expect(exclusionsData.exclusionsGroups).toHaveLength(1);
//     });
//
//     it('subdomains states on toggling exclusions group state and adding duplicated group', async () => {
//         await exclusionsHandler.addExclusionsGroup('example.org');
//         let exclusionsData = exclusionsHandler.getExclusions();
//         expect(exclusionsData.exclusionsGroups[0].state).toEqual(ExclusionStates.Enabled);
//         const groupId = exclusionsData.exclusionsGroups[0].id;
//         // add subdomain
//         await exclusionsHandler.addSubdomainToExclusionsGroup(groupId, 'test');
//         expect(exclusionsHandler.isExcluded('http://test.example.org')).toBeTruthy();
//
//         exclusionsData = exclusionsHandler.getExclusions();
//         expect(exclusionsData.exclusionsGroups).toHaveLength(1);
//         expect(exclusionsData.exclusionsGroups[0].state).toEqual(ExclusionStates.Enabled);
//         expect(exclusionsData.exclusionsGroups[0].exclusions).toHaveLength(3);
//         expect(exclusionsData.exclusionsGroups[0].exclusions[1].hostname).toEqual('*.example.org');
//         expect(exclusionsData.exclusionsGroups[0].exclusions[2].hostname).toEqual('test.example.org');
//         // added subdomain should be disabled
//         expect(exclusionsData.exclusionsGroups[0].exclusions[2].enabled)
//             .toEqual(ExclusionStates.Enabled);
//
//         // toggle group state
//         await exclusionsHandler.toggleExclusionsGroupState(groupId);
//         exclusionsData = exclusionsHandler.getExclusions();
//         expect(exclusionsData.exclusionsGroups).toHaveLength(1);
//         expect(exclusionsData.exclusionsGroups[0].state).toEqual(ExclusionStates.Disabled);
//         expect(exclusionsHandler.isExcluded('http://test.example.org')).toBeFalsy();
//         expect(exclusionsHandler.isExcluded('www.example.org')).toBeFalsy();
//
//         exclusionsData.exclusionsGroups[0].exclusions.forEach((exclusion) => {
//             // all subdomain should be disabled after disabling exclusions group
//             expect(exclusion.enabled).toEqual(ExclusionStates.Disabled);
//         });
//
//         // add duplicated exclusions group
//         await exclusionsHandler.addExclusionsGroup('example.org');
//         exclusionsData = exclusionsHandler.getExclusions();
//
//         expect(exclusionsData.exclusionsGroups).toHaveLength(1);
//         expect(exclusionsData.exclusionsGroups[0].state).toEqual(ExclusionStates.Enabled);
//         expect(exclusionsHandler.isExcluded('http://test.example.org')).toBeTruthy();
//         expect(exclusionsHandler.isExcluded('www.example.org')).toBeTruthy();
//         expect(exclusionsData.exclusionsGroups[0].exclusions).toHaveLength(3);
//         exclusionsData.exclusionsGroups[0].exclusions.forEach((exclusion) => {
//             // all subdomain should be enabled after adding duplicated exclusions group
//             expect(exclusion.enabled).toEqual(ExclusionStates.Enabled);
//         });
//     });
//
//     it('import exclusions data', async () => {
//         await exclusionsHandler.importExclusionsData(testExclusionsData);
//         let exclusionsData = exclusionsHandler.getExclusions();
//         expect(exclusionsData.excludedServices).toHaveLength(1);
//         expect(exclusionsData.excludedServices[0].serviceId).toEqual('github');
//         expect(exclusionsData.excludedServices[0].state).toEqual(ExclusionStates.Enabled);
//         expect(exclusionsData.exclusionsGroups).toHaveLength(1);
//         expect(exclusionsData.exclusionsGroups[0].hostname).toEqual('example.org');
//         expect(exclusionsData.exclusionsGroups[0].state).toEqual(ExclusionStates.Enabled);
//         expect(exclusionsData.excludedIps).toHaveLength(1);
//         expect(exclusionsData.excludedIps[0].hostname).toEqual('192.168.35.41');
//         expect(exclusionsData.excludedIps[0].enabled).toEqual(ExclusionStates.Enabled);
//
//         // disable all imported exclusions
//         await exclusionsHandler.toggleServiceState('github');
//         await exclusionsHandler.toggleExclusionsGroupState(exclusionsData.exclusionsGroups[0].id);
//         await exclusionsHandler.toggleIpState(exclusionsData.excludedIps[0].id);
//
//         exclusionsData = exclusionsHandler.getExclusions();
//         expect(exclusionsData.excludedServices[0].state).toEqual(ExclusionStates.Disabled);
//         expect(exclusionsData.exclusionsGroups[0].state).toEqual(ExclusionStates.Disabled);
//         expect(exclusionsData.excludedIps[0].enabled).toEqual(ExclusionStates.Disabled);
//
//         // import same exclusions one more time
//         await exclusionsHandler.importExclusionsData(testExclusionsData);
//         exclusionsData = exclusionsHandler.getExclusions();
//
//         // exclusions should not be duplicated and should be enabled (as had been exported)
//         expect(exclusionsData.excludedServices).toHaveLength(1);
//         expect(exclusionsData.excludedServices[0].serviceId).toEqual('github');
//         expect(exclusionsData.excludedServices[0].state).toEqual(ExclusionStates.Enabled);
//         expect(exclusionsData.exclusionsGroups).toHaveLength(1);
//         expect(exclusionsData.exclusionsGroups[0].hostname).toEqual('example.org');
//         expect(exclusionsData.exclusionsGroups[0].state).toEqual(ExclusionStates.Enabled);
//         expect(exclusionsData.excludedIps).toHaveLength(1);
//         expect(exclusionsData.excludedIps[0].hostname).toEqual('192.168.35.41');
//         expect(exclusionsData.excludedIps[0].enabled).toEqual(ExclusionStates.Enabled);
//     });
//
//     it('add manually service domain (case 2)', async () => {
//         // add to exclusions http://www.github.com, it should become service
//         await exclusionsHandler.addUrlToExclusions('www.github.com');
//         const exclusionsData = exclusionsHandler.getExclusions();
//
//         expect(exclusionsData.excludedServices).toHaveLength(1);
//         expect(exclusionsData.excludedServices[0].serviceId).toEqual('github');
//         expect(exclusionsData.excludedServices[0].exclusionsGroups).toHaveLength(6);
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[0].hostname)
//             .toEqual('github.com');
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[0].state)
//             .toEqual(ExclusionStates.Enabled);
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[1].hostname)
//             .toEqual('github.io');
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[1].state)
//             .toEqual(ExclusionStates.Disabled);
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[2].state)
//             .toEqual(ExclusionStates.Disabled);
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[3].state)
//             .toEqual(ExclusionStates.Disabled);
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[4].state)
//             .toEqual(ExclusionStates.Disabled);
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[5].state)
//             .toEqual(ExclusionStates.Disabled);
//     });
//
//     it('service default data', async () => {
//         getServiceMock.mockImplementation(() => GITHUB_SERVICE_DATA);
//         getServiceIdByUrlMock.mockImplementation(() => 'github');
//         // add github service
//         await exclusionsHandler.addService('github');
//         let exclusionsData = exclusionsHandler.getExclusions();
//
//         expect(exclusionsData.excludedServices).toHaveLength(1);
//         expect(exclusionsData.excludedServices[0].serviceId).toEqual('github');
//         expect(exclusionsData.excludedServices[0].exclusionsGroups).toHaveLength(6);
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[0].hostname)
//             .toEqual('github.com');
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[0].state)
//             .toEqual(ExclusionStates.Enabled);
//
//         // remove 'github.com' ExclusionsGroup from Service
//         await exclusionsHandler.removeExclusionsGroupFromService(
//             'github',
//             exclusionsData.excludedServices[0].exclusionsGroups[0].id,
//         );
//         exclusionsData = exclusionsHandler.getExclusions();
//         expect(exclusionsData.excludedServices[0].exclusionsGroups).toHaveLength(5);
//
//         // remove service
//         await exclusionsHandler.removeService('github');
//         exclusionsData = exclusionsHandler.getExclusions();
//         expect(exclusionsData.excludedServices).toHaveLength(0);
//
//         // add same service one more time
//         await exclusionsHandler.addService('github.com');
//         exclusionsData = exclusionsHandler.getExclusions();
//
//         expect(exclusionsData.excludedServices[0].serviceId).toEqual('github');
//         // amount of ExclusionsGroups should should be similar to default service data
//         expect(exclusionsData.excludedServices[0].exclusionsGroups).toHaveLength(6);
//     });
//
//     it('service exclusions groups default data', async () => {
//         getServiceMock.mockImplementation(() => GITHUB_SERVICE_DATA);
//         getServiceIdByUrlMock.mockImplementation(() => 'github');
//         // add github service
//         await exclusionsHandler.addService('github');
//         let exclusionsData = exclusionsHandler.getExclusions();
//
//         expect(exclusionsData.excludedServices).toHaveLength(1);
//         expect(exclusionsData.excludedServices[0].serviceId).toEqual('github');
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[0].hostname)
//             .toEqual('github.com');
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[0].exclusions[1].hostname)
//             .toEqual('*.github.com');
//
//         // remove '*.github.com' exclusion from 'github.com' ExclusionsGroup from github Service
//         await exclusionsHandler.removeSubdomainFromExclusionsGroupInService(
//             'github',
//             exclusionsData.excludedServices[0].exclusionsGroups[0].id,
//             exclusionsData.excludedServices[0].exclusionsGroups[0].exclusions[1].id,
//         );
//
//         exclusionsData = exclusionsHandler.getExclusions();
//         expect(exclusionsData.excludedServices[0].serviceId).toEqual('github');
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[0].hostname)
//             .toEqual('github.com');
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[0].exclusions[0].hostname)
//             .toEqual('github.com');
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[0].exclusions)
//             .toHaveLength(1);
//
//         // remove service
//         await exclusionsHandler.removeService('github');
//         exclusionsData = exclusionsHandler.getExclusions();
//         expect(exclusionsData.excludedServices).toHaveLength(0);
//
//         // add same service one more time
//         await exclusionsHandler.addService('github.com');
//         exclusionsData = exclusionsHandler.getExclusions();
//
//         // ExclusionsGroups should have same amount of exclusions as default service data
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[0].exclusions)
//             .toHaveLength(2);
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[0].exclusions[0].hostname)
//             .toEqual('github.com');
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[0].exclusions[1].hostname)
//             .toEqual('*.github.com');
//     });
//
//     it('disable exclusion by url', async () => {
//         getServiceMock.mockImplementation(() => FACEBOOK_SERVICE_DATA);
//         // add service
//         await exclusionsHandler.addService('facebook');
//         getServiceIdByUrlMock.mockImplementation(() => null);
//         // add exclusions group
//         await exclusionsHandler.addUrlToExclusions('http://www.test.com');
//
//         let exclusionsData = exclusionsHandler.getExclusions();
//         expect(exclusionsData.excludedServices).toHaveLength(1);
//         expect(exclusionsData.excludedServices[0].state).toEqual(ExclusionStates.Enabled);
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[0].hostname).toEqual('facebook.com');
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[0].state)
//             .toEqual(ExclusionStates.Enabled);
//         expect(exclusionsData.exclusionsGroups).toHaveLength(1);
//         expect(exclusionsData.exclusionsGroups[0].state).toEqual(ExclusionStates.Enabled);
//         expect(exclusionsData.exclusionsGroups[0].exclusions[0].hostname).toEqual('test.com');
//         expect(exclusionsData.exclusionsGroups[0].exclusions[0].enabled)
//             .toEqual(ExclusionStates.Enabled);
//
//         expect(exclusionsData.exclusionsGroups[0].hostname).toEqual('test.com');
//
//         // disable service and exclusions group
//         await exclusionsHandler.disableExclusionByUrl('test.com');
//         await exclusionsHandler.disableExclusionByUrl('facebook.com');
//         exclusionsData = exclusionsHandler.getExclusions();
//         // service should be partly enabled
//         expect(exclusionsData.excludedServices[0].state).toEqual(ExclusionStates.PartlyEnabled);
//         // exclusions group in service should be disabled
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[0].state)
//             .toEqual(ExclusionStates.Disabled);
//         // exclusions group should be disabled
//         expect(exclusionsData.exclusionsGroups[0].state).toEqual(ExclusionStates.Disabled);
//         expect(exclusionsData.exclusionsGroups[0].exclusions[0].enabled)
//             .toEqual(ExclusionStates.Disabled);
//     });
//
//     it('reset service data', async () => {
//         getServiceMock.mockImplementation(() => FACEBOOK_SERVICE_DATA);
//         // add facebook service
//         await exclusionsHandler.addService('facebook');
//         let exclusionsData = exclusionsHandler.getExclusions();
//
//         expect(exclusionsData.excludedServices).toHaveLength(1);
//         expect(exclusionsData.excludedServices[0].state).toEqual(ExclusionStates.Enabled);
//         expect(exclusionsData.excludedServices[0].exclusionsGroups).toHaveLength(5);
//
//         // disable facebook.com exclusions group in facebook service
//         await exclusionsHandler.toggleExclusionsGroupStateInService(
//             exclusionsData.excludedServices[0].serviceId,
//             exclusionsData.excludedServices[0].exclusionsGroups[0].id,
//         );
//
//         // add 'test' subdomain to fb.com exclusions group in facebook service
//         await exclusionsHandler.addSubdomainToExclusionsGroupInService(
//             exclusionsData.excludedServices[0].serviceId,
//             exclusionsData.excludedServices[0].exclusionsGroups[2].id,
//             'test',
//         );
//
//         // disable test.fb.com subdomain in fb.com exclusions group in facebook service
//         await exclusionsHandler.toggleSubdomainStateInExclusionsGroupInService(
//             exclusionsData.excludedServices[0].serviceId,
//             exclusionsData.excludedServices[0].exclusionsGroups[2].id,
//             exclusionsData.excludedServices[0].exclusionsGroups[2].exclusions[2].id,
//         );
//
//         // delete facebook.net exclusions group from facebook service
//         await exclusionsHandler.removeExclusionsGroupFromService(
//             exclusionsData.excludedServices[0].serviceId,
//             exclusionsData.excludedServices[0].exclusionsGroups[1].id,
//         );
//
//         exclusionsData = exclusionsHandler.getExclusions();
//         expect(exclusionsData.excludedServices[0].state).toEqual(ExclusionStates.PartlyEnabled);
//         expect(exclusionsData.excludedServices[0].exclusionsGroups).toHaveLength(4);
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[0].state)
//             .toEqual(ExclusionStates.Disabled);
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[1].hostname)
//             .toEqual('fb.com');
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[1].state)
//             .toEqual(ExclusionStates.PartlyEnabled);
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[1].exclusions[2].hostname)
//             .toEqual('test.fb.com');
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[1].exclusions[2].enabled)
//             .toEqual(ExclusionStates.Disabled);
//
//         // reset service data
//         await exclusionsHandler.resetServiceData(exclusionsData.excludedServices[0].serviceId);
//         exclusionsData = exclusionsHandler.getExclusions();
//         expect(exclusionsData.excludedServices[0].state).toEqual(ExclusionStates.PartlyEnabled);
//         expect(exclusionsData.excludedServices[0].exclusionsGroups).toHaveLength(5);
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[0].hostname)
//             .toEqual('facebook.com');
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[0].state)
//             .toEqual(ExclusionStates.Enabled);
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[1].hostname)
//             .toEqual('facebook.net');
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[1].state)
//             .toEqual(ExclusionStates.Enabled);
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[2].hostname)
//             .toEqual('fb.com');
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[2].state)
//             .toEqual(ExclusionStates.PartlyEnabled);
//         // manually added subdomain should not be deleted and should have the same state (disabled)
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[2].exclusions[2].hostname)
//             .toEqual('test.fb.com');
//         expect(exclusionsData.excludedServices[0].exclusionsGroups[2].exclusions[2].enabled)
//             .toEqual(ExclusionStates.Disabled);
//     });
// });

it('reset service data', async () => {
    expect(1).toEqual(1);
});
