import { ExclusionsGroup } from '../../src/background/exclusions/ExclusionsGroup';

// TODO fine tune tsconfig.json
describe('ExclusionsGroup', () => {
    it('create exclusion group', () => {
        const exampleGroup = new ExclusionsGroup('example.org');

        expect(exampleGroup.hostname).toBe('example.org');
        expect(exampleGroup.exclusions.length).toBe(2);
        expect(exampleGroup.exclusions[0].hostname).toBe('example.org');
        expect(exampleGroup.exclusions[0].enabled).toBeTruthy();
        expect(exampleGroup.exclusions[1].hostname).toBe('*.example.org');
        expect(exampleGroup.exclusions[1].enabled).toBeTruthy();
    });

    it('add exclusion to exclusion group', () => {
        const exampleGroup = new ExclusionsGroup('http://www.example.org');
        exampleGroup.addSubdomain('test1');

        expect(exampleGroup.exclusions[1].hostname).toBe('*.example.org');
        expect(exampleGroup.exclusions[1].enabled).toBeFalsy();
        expect(exampleGroup.exclusions.length).toBe(3);
        expect(exampleGroup.exclusions[2].hostname).toBe('test1.example.org');
        expect(exampleGroup.exclusions[2].enabled).toBeTruthy();

        exampleGroup.addSubdomain('test2');

        expect(exampleGroup.hostname).toBe('example.org');
        expect(exampleGroup.exclusions.length).toBe(4);
        expect(exampleGroup.exclusions[3].hostname).toBe('test2.example.org');

        exampleGroup.addSubdomain('test1');
        exampleGroup.addSubdomain('test2');
        expect(exampleGroup.exclusions.length).toBe(4);
        expect(exampleGroup.exclusions[0].hostname).toBe('example.org');
        expect(exampleGroup.exclusions[1].hostname).toBe('*.example.org');
        expect(exampleGroup.exclusions[2].hostname).toBe('test1.example.org');
        expect(exampleGroup.exclusions[3].hostname).toBe('test2.example.org');

        exampleGroup.addSubdomain('sub.test3');
        expect(exampleGroup.exclusions.length).toBe(5);
        expect(exampleGroup.exclusions[4].hostname).toBe('sub.test3.example.org');
    });
});
