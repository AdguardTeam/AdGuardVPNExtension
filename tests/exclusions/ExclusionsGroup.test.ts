import { ExclusionsGroup, State } from '../../src/background/exclusions/ExclusionsGroup';

// TODO fine tune tsconfig.json
describe('ExclusionsGroup', () => {
    it('create exclusion group', () => {
        const exampleGroup = new ExclusionsGroup('example.org');

        expect(exampleGroup.hostname).toEqual('example.org');
        expect(exampleGroup.exclusions.length).toEqual(2);
        expect(exampleGroup.exclusions[0].hostname).toEqual('example.org');
        expect(exampleGroup.exclusions[0].enabled).toBeTruthy();
        expect(exampleGroup.exclusions[1].hostname).toEqual('*.example.org');
        expect(exampleGroup.exclusions[1].enabled).toBeTruthy();
    });

    it('add exclusion to exclusion group', () => {
        const exampleGroup = new ExclusionsGroup('http://www.example.org');
        // check hostname is cleaned out of 'https' and 'www'
        expect(exampleGroup.hostname).toEqual('example.org');

        exampleGroup.addSubdomain('test1');

        expect(exampleGroup.exclusions[1].hostname).toEqual('*.example.org');
        // subdomain pattern exclusion should be disabled if added new subdomain
        expect(exampleGroup.exclusions[1].enabled).toBeFalsy();
        expect(exampleGroup.exclusions.length).toEqual(3);
        expect(exampleGroup.exclusions[2].hostname).toEqual('test1.example.org');
        expect(exampleGroup.exclusions[2].enabled).toBeTruthy();

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
    });

    it('Exclusions group and subdomain states', () => {
        const exampleGroup = new ExclusionsGroup('example.org');
        expect(exampleGroup.state).toEqual(State.Enabled);
        exampleGroup.addSubdomain('test');
        expect(exampleGroup.state).toEqual(State.PartlyEnabled);
        expect(exampleGroup.exclusions[2].hostname).toEqual('test.example.org');
        // disable all domains
        exampleGroup.toggleSubdomainState(exampleGroup.exclusions[2].id);
        exampleGroup.toggleSubdomainState(exampleGroup.exclusions[0].id);
        expect(exampleGroup.exclusions[0].enabled).toBeFalsy();
        expect(exampleGroup.exclusions[1].enabled).toBeFalsy();
        expect(exampleGroup.exclusions[2].enabled).toBeFalsy();
        // group state should be disabled
        expect(exampleGroup.state).toEqual(State.Disabled);
        // enable some domain
        exampleGroup.toggleSubdomainState(exampleGroup.exclusions[2].id);
        expect(exampleGroup.exclusions[2].enabled).toBeTruthy();
        // group state should be partly enabled
        expect(exampleGroup.state).toEqual(State.PartlyEnabled);
    });
});
