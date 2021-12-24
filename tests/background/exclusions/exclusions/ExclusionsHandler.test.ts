import { ExclusionsHandler } from '../../../../src/background/exclusions/exclusions/ExclusionsHandler';
import { ExclusionStates } from '../../../../src/common/exclusionsConstants';
import { ExclusionInterface } from '../../../../src/background/exclusions/exclusions/exclusionsTypes';

describe('ExclusionsHandler', () => {
    describe('getExclusionsIndex', () => {
        it('indexes exclusions', () => {
            const exclusions: ExclusionInterface[] = [
                { id: '1', hostname: 'example.org', state: ExclusionStates.Enabled },
                { id: '2', hostname: '*.example.org', state: ExclusionStates.Enabled },
            ];

            const indexedExclusions = ExclusionsHandler.getExclusionsIndex(exclusions);

            expect(indexedExclusions).toEqual({
                'example.org': ['1', '2'],
            });
        });
    });
});
