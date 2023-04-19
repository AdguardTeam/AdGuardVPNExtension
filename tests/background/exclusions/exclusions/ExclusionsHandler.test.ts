import { ExclusionsHandler } from '../../../../src/background/exclusions/exclusions/ExclusionsHandler';
import { ExclusionState } from '../../../../src/common/exclusionsConstants';
import type { ExclusionInterface } from '../../../../src/background/schema';

describe('ExclusionsHandler', () => {
    describe('buildExclusionsIndex', () => {
        it('indexes exclusions', () => {
            const exclusions: ExclusionInterface[] = [
                { id: '1', hostname: 'example.org', state: ExclusionState.Enabled },
                { id: '2', hostname: '*.example.org', state: ExclusionState.Enabled },
            ];

            const indexedExclusions = ExclusionsHandler.buildExclusionsIndex(exclusions);

            expect(indexedExclusions).toEqual({
                'example.org': ['1', '2'],
            });
        });
    });
});
