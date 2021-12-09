import { ExclusionsGroup } from '../../src/background/exclusions/exclusions/ExclusionsGroup';
import { ExclusionStates } from '../../src/common/exclusionsConstants';

describe('ExclusionsGroup', () => {
    it('create exclusion group', () => {
        const exampleGroup = new ExclusionsGroup('example.org');

        expect(exampleGroup.hostname).toEqual('example.org');
        expect(exampleGroup.exclusions.length).toEqual(2);
        expect(exampleGroup.exclusions[0].hostname).toEqual('example.org');
        expect(exampleGroup.exclusions[0].enabled).toEqual(ExclusionStates.Enabled);
        expect(exampleGroup.exclusions[1].hostname).toEqual('*.example.org');
        expect(exampleGroup.exclusions[1].enabled).toEqual(ExclusionStates.Enabled);
    });

    it('add and remove exclusion to exclusion group', () => {
        const exampleGroup = new ExclusionsGroup('http://www.example.org');
        // check hostname is cleaned out of 'https' and 'www'
        expect(exampleGroup.hostname).toEqual('example.org');

        exampleGroup.addSubdomain('test1');

        expect(exampleGroup.exclusions[1].hostname).toEqual('*.example.org');
        expect(exampleGroup.exclusions.length).toEqual(3);
        expect(exampleGroup.exclusions[2].hostname).toEqual('test1.example.org');
        // subdomain pattern exclusion should be disabled if added new subdomain
        expect(exampleGroup.exclusions[2].enabled).toEqual(ExclusionStates.Enabled);

        exampleGroup.addSubdomain('test2');

        expect(exampleGroup.exclusions.length).toEqual(4);
        expect(exampleGroup.exclusions[3].hostname).toEqual('test2.example.org');

        // add duplicated subdomains
        exampleGroup.addSubdomain('test1');
        exampleGroup.addSubdomain('test2');
        // duplicated subdomains should be ignored
        expect(exampleGroup.exclusions.length).toEqual(4);
        expect(exampleGroup.exclusions[0].hostname).toEqual('example.org');
        expect(exampleGroup.exclusions[1].hostname).toEqual('*.example.org');
        expect(exampleGroup.exclusions[2].hostname).toEqual('test1.example.org');
        expect(exampleGroup.exclusions[3].hostname).toEqual('test2.example.org');

        // add fourth level subdomain
        exampleGroup.addSubdomain('sub.test3');
        expect(exampleGroup.exclusions.length).toEqual(5);
        expect(exampleGroup.exclusions[4].hostname).toEqual('sub.test3.example.org');

        const subdomainId1 = exampleGroup.exclusions[2].id; // test1.example.org
        const subdomainId2 = exampleGroup.exclusions[4].id; // sub.test3.example.org
        exampleGroup.removeSubdomain(subdomainId1);
        exampleGroup.removeSubdomain(subdomainId2);

        expect(exampleGroup.exclusions.length).toEqual(3);
        expect(exampleGroup.exclusions[0].hostname).toEqual('example.org');
        expect(exampleGroup.exclusions[1].hostname).toEqual('*.example.org');
        expect(exampleGroup.exclusions[2].hostname).toEqual('test2.example.org');
    });

    it('Exclusions group and subdomain states', () => {
        const exampleGroup = new ExclusionsGroup('example.org');
        expect(exampleGroup.state).toEqual(ExclusionStates.Enabled);
        exampleGroup.addSubdomain('test');

        expect(exampleGroup.exclusions[1].hostname).toEqual('*.example.org');
        // group state should be PartlyEnabled
        expect(exampleGroup.state).toEqual(ExclusionStates.Enabled);
        expect(exampleGroup.exclusions[2].hostname).toEqual('test.example.org');
        expect(exampleGroup.exclusions[2].enabled).toEqual(ExclusionStates.Enabled);

        // disable all domains
        exampleGroup.toggleSubdomainState(exampleGroup.exclusions[0].id);
        exampleGroup.toggleSubdomainState(exampleGroup.exclusions[1].id);
        expect(exampleGroup.exclusions[0].enabled).toEqual(ExclusionStates.Disabled);
        expect(exampleGroup.exclusions[1].enabled).toEqual(ExclusionStates.Disabled);
        expect(exampleGroup.exclusions[2].enabled).toEqual(ExclusionStates.Enabled);
        // group state should be disabled
        expect(exampleGroup.state).toEqual(ExclusionStates.PartlyEnabled);
        // enable some domain
        exampleGroup.toggleSubdomainState(exampleGroup.exclusions[2].id);
        expect(exampleGroup.exclusions[2].enabled).toEqual(ExclusionStates.Disabled);
        // group state should be partly enabled
        expect(exampleGroup.state).toEqual(ExclusionStates.Disabled);
    });

    it('add subdomain test', async () => {
        const exampleGroup = new ExclusionsGroup('www.test.com');
        expect(exampleGroup.exclusions).toHaveLength(2);
        // add url 'https://www.music.test.com' instead of subdomain name
        exampleGroup.addSubdomain('https://www.music.test.com');
        expect(exampleGroup.exclusions).toHaveLength(3);
        expect(exampleGroup.exclusions[0].hostname).toEqual('test.com');
        expect(exampleGroup.exclusions[1].hostname).toEqual('*.test.com');
        // new subdomain should become 'music.test.com'
        expect(exampleGroup.exclusions[2].hostname).toEqual('music.test.com');

        // add url 'https://www.video.example.com' instead of subdomain name
        exampleGroup.addSubdomain('https://www.video.example.com');
        expect(exampleGroup.exclusions).toHaveLength(4);
        // new subdomain should become 'video.example.com.test.com'
        expect(exampleGroup.exclusions[3].hostname).toEqual('video.example.com.test.com');
    });
});
