import ExclusionsHandler from '../../src/background/exclusions/ExclusionsHandler';

jest.mock('../../src/lib/logger');

const updateHandler = () => {

};

const exclusions = {};

const type = 'whitelists';

const exclusionsHandler = new ExclusionsHandler(updateHandler, exclusions, type);

describe('exclusions handler', () => {
    afterEach(async (done) => {
        await exclusionsHandler.clearExclusions();
        done();
    });

    it('should be empty after construction', () => {
        const exclusionsList = exclusionsHandler.getExclusionsList();
        expect(exclusionsList.length).toEqual(0);
    });

    it('should return false if hostname is NOT in exclusions', () => {
        expect(exclusionsHandler.isExcluded('http://example.org')).toEqual(false);
        expect(exclusionsHandler.isExcluded('xn--b1aew.xn--p1ai/')).toEqual(false);
    });

    it('should return true if hostname is IN exclusions', async () => {
        await exclusionsHandler.addToExclusions('http://example.org');
        await exclusionsHandler.addToExclusions('мвд.рф');
        const exclusionsList = exclusionsHandler.getExclusionsList();
        expect(exclusionsList.length).toEqual(2);
        expect(exclusionsHandler.isExcluded('http://example.org')).toEqual(true);
        expect(exclusionsHandler.isExcluded('https://xn--b1aew.xn--p1ai/contacts')).toEqual(true);
    });

    it('should turn on if added exclusion is already in exclusions list', async () => {
        await exclusionsHandler.addToExclusions('http://example.org');
        await exclusionsHandler.addToExclusions('мвд.рф');
        let exclusionsList = exclusionsHandler.getExclusionsList();
        expect(exclusionsList.length).toEqual(2);
        expect(exclusionsHandler.isExcluded('http://example.org')).toEqual(true);
        expect(exclusionsHandler.isExcluded('https://xn--b1aew.xn--p1ai')).toEqual(true);

        await exclusionsHandler.toggleExclusion(exclusionsList[0].id);
        await exclusionsHandler.toggleExclusion(exclusionsList[1].id);
        exclusionsList = exclusionsHandler.getExclusionsList();
        expect(exclusionsList.length).toEqual(2);
        expect(exclusionsHandler.isExcluded('http://example.org')).toEqual(false);
        expect(exclusionsHandler.isExcluded('https://xn--b1aew.xn--p1ai')).toEqual(false);

        await exclusionsHandler.addToExclusions('http://example.org');
        await exclusionsHandler.addToExclusions('мвд.рф');
        exclusionsList = exclusionsHandler.getExclusionsList();
        expect(exclusionsList.length).toEqual(2);
        expect(exclusionsHandler.isExcluded('http://example.org')).toEqual(true);
        expect(exclusionsHandler.isExcluded('https://xn--b1aew.xn--p1ai')).toEqual(true);
    });

    it('should return false if hostname is IN exclusions and is not enabled', () => {
        let exclusionsList = exclusionsHandler.getExclusionsList();
        expect(exclusionsList.length).toEqual(0);
        const url1 = 'http://example.org';
        exclusionsHandler.addToExclusions(url1);
        exclusionsList = exclusionsHandler.getExclusionsList();
        expect(exclusionsList.length).toEqual(1);
        const exclusion = exclusionsList[0];
        expect(exclusionsHandler.isExcluded('http://example.org')).toEqual(true);
        exclusionsHandler.toggleExclusion(exclusion.id);
        exclusionsList = exclusionsHandler.getExclusionsList();
        expect(exclusionsList.length).toEqual(1);
        expect(exclusionsList[0].enabled).toBeFalsy();
        expect(exclusionsList[0].hostname).toEqual('example.org');
        expect(exclusionsHandler.isExcluded('http://example.org')).toEqual(false);
    });

    it('should toggle correctly', () => {
        exclusionsHandler.addToExclusions('http://example.org');
        const exclusionsList = exclusionsHandler.getExclusionsList();
        expect(exclusionsList.length).toEqual(1);
        expect(exclusionsHandler.isExcluded('http://example.org')).toBeTruthy();
        exclusionsHandler.toggleExclusion(exclusionsList[0].id);
        expect(exclusionsHandler.isExcluded('http://example.org')).toBeFalsy();
        exclusionsHandler.toggleExclusion(exclusionsList[0].id);
        expect(exclusionsHandler.isExcluded('http://example.org')).toBeTruthy();
    });

    it('should add more than one correctly', async () => {
        await exclusionsHandler.addToExclusions('http://example.org');
        await exclusionsHandler.addToExclusions('http://example1.org');
        let exclusionsList = exclusionsHandler.getExclusionsList();
        expect(exclusionsList.length).toEqual(2);
        const removedExclusion = exclusionsList[0];
        await exclusionsHandler.removeFromExclusions(removedExclusion.id);
        exclusionsList = exclusionsHandler.getExclusionsList();
        expect(exclusionsList.length).toEqual(1);
    });

    it('can rename exclusions', async () => {
        await exclusionsHandler.addToExclusions('http://example.org');
        let exclusionsList = exclusionsHandler.getExclusionsList();
        let exclusion = exclusionsList[0];
        await exclusionsHandler.renameExclusion(exclusion.id, 'http://new-example.org');
        exclusionsList = exclusionsHandler.getExclusionsList();
        // eslint-disable-next-line prefer-destructuring
        exclusion = exclusionsList[0];
        expect(exclusion.hostname).toEqual('new-example.org');
    });
});
