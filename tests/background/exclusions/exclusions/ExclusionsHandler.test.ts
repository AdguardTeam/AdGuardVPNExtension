import { ExclusionsHandler } from '../../../../src/background/exclusions/exclusions/ExclusionsHandler';
import { ExclusionState } from '../../../../src/common/exclusionsConstants';
import { ExclusionInterface } from '../../../../src/background/exclusions/exclusions/exclusionsTypes';

describe('ExclusionsHandler', () => {
    describe('getExclusionsIndex', () => {
        it('indexes exclusions', () => {
            const exclusions: ExclusionInterface[] = [
                { id: '1', hostname: 'example.org', state: ExclusionState.Enabled },
                { id: '2', hostname: '*.example.org', state: ExclusionState.Enabled },
            ];

            const indexedExclusions = ExclusionsHandler.getExclusionsIndex(exclusions);

            expect(indexedExclusions).toEqual({
                'example.org': ['1', '2'],
            });
        });
    });
});
