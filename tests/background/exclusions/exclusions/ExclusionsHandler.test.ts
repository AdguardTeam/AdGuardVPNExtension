import { describe, it, expect } from 'vitest';

import { ExclusionsHandler } from '../../../../src/background/exclusions/exclusions/ExclusionsHandler';
import { ExclusionState, ExclusionsMode } from '../../../../src/common/exclusionsConstants';
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

    describe('addExclusions', () => {
        it('normalizes prepared exclusion values before storing', async () => {
            const exclusions: ExclusionInterface[] = [];
            const handler = new ExclusionsHandler(async () => {}, exclusions, ExclusionsMode.Regular);

            const addedCount = await handler.addExclusions([{ value: '.com' }]);

            expect(addedCount).toBe(1);
            expect(handler.exclusions).toMatchObject([{ hostname: 'com', state: ExclusionState.Enabled }]);
        });

        it('drops prepared exclusion values that cannot be normalized', async () => {
            const exclusions: ExclusionInterface[] = [];
            const handler = new ExclusionsHandler(async () => {}, exclusions, ExclusionsMode.Regular);

            const addedCount = await handler.addExclusions([{ value: '*..com' }, { value: '..example.com' }]);

            expect(addedCount).toBe(0);
            expect(handler.exclusions).toEqual([]);
        });
    });
});
