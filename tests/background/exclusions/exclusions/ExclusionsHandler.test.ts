import { ExclusionsHandler } from '../../../../src/background/exclusions/exclusions/ExclusionsHandler';
import { ExclusionsModes, ExclusionStates } from '../../../../src/common/exclusionsConstants';

describe('ExclusionsHandler', () => {
    describe('getExclusionsIndex', () => {
        it('indexes exclusions', () => {
            const exclusions = [
                { id: '1', hostname: 'example.org', state: ExclusionStates.Enabled },
                { id: '2', hostname: '*.example.org', state: ExclusionStates.Enabled },
            ];
            const exclusionsHandler = new ExclusionsHandler(() => {}, [], ExclusionsModes.Regular);
            const indexedExclusions = exclusionsHandler.getExclusionsIndex(exclusions);

            expect(indexedExclusions).toEqual({
                'example.org': ['1', '2'],
            });
        });
    });
});
