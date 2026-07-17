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

        it('reactivates an existing disabled exclusion when enabled is requested', async () => {
            const exclusions: ExclusionInterface[] = [
                { id: '1', hostname: 'example.com', state: ExclusionState.Disabled },
            ];
            const handler = new ExclusionsHandler(async () => {}, exclusions, ExclusionsMode.Regular);

            const addedCount = await handler.addExclusions([{ value: 'example.com', enabled: true }]);

            expect(addedCount).toBe(1);
            expect(handler.exclusions).toMatchObject([
                { id: '1', hostname: 'example.com', state: ExclusionState.Enabled },
            ]);
        });

        it('reactivates multiple existing disabled exclusions and counts them all', async () => {
            const exclusions: ExclusionInterface[] = [
                { id: '1', hostname: 'a.com', state: ExclusionState.Disabled },
                { id: '2', hostname: 'b.com', state: ExclusionState.Disabled },
                { id: '3', hostname: 'c.com', state: ExclusionState.Disabled },
            ];
            const handler = new ExclusionsHandler(async () => {}, exclusions, ExclusionsMode.Regular);

            const addedCount = await handler.addExclusions([
                { value: 'a.com', enabled: true },
                { value: 'b.com', enabled: true },
                { value: 'c.com', enabled: true },
            ]);

            expect(addedCount).toBe(3);
            expect(handler.exclusions).toMatchObject([
                { hostname: 'a.com', state: ExclusionState.Enabled },
                { hostname: 'b.com', state: ExclusionState.Enabled },
                { hostname: 'c.com', state: ExclusionState.Enabled },
            ]);
        });

        it('does not downgrade an existing enabled exclusion when enabled is false and overwriteState is unset', async () => {
            const exclusions: ExclusionInterface[] = [
                { id: '1', hostname: 'example.com', state: ExclusionState.Enabled },
            ];
            const handler = new ExclusionsHandler(async () => {}, exclusions, ExclusionsMode.Regular);

            const addedCount = await handler.addExclusions([{ value: 'example.com', enabled: false }]);

            expect(addedCount).toBe(0);
            expect(handler.exclusions).toMatchObject([
                { id: '1', hostname: 'example.com', state: ExclusionState.Enabled },
            ]);
        });

        it('leaves an existing disabled exclusion unchanged when enabled is false and overwriteState is unset', async () => {
            const exclusions: ExclusionInterface[] = [
                { id: '1', hostname: 'example.com', state: ExclusionState.Disabled },
            ];
            const handler = new ExclusionsHandler(async () => {}, exclusions, ExclusionsMode.Regular);

            const addedCount = await handler.addExclusions([{ value: 'example.com', enabled: false }]);

            expect(addedCount).toBe(0);
            expect(handler.exclusions).toMatchObject([
                { id: '1', hostname: 'example.com', state: ExclusionState.Disabled },
            ]);
        });

        it('counts the state change when overwriteState forces a downgrade', async () => {
            const exclusions: ExclusionInterface[] = [
                { id: '1', hostname: 'example.com', state: ExclusionState.Enabled },
            ];
            const handler = new ExclusionsHandler(async () => {}, exclusions, ExclusionsMode.Regular);

            const addedCount = await handler.addExclusions([
                { value: 'example.com', enabled: false, overwriteState: true },
            ]);

            expect(addedCount).toBe(1);
            expect(handler.exclusions).toMatchObject([
                { id: '1', hostname: 'example.com', state: ExclusionState.Disabled },
            ]);
        });

        it('does not count when overwriteState forces a state that already matches', async () => {
            const exclusions: ExclusionInterface[] = [
                { id: '1', hostname: 'example.com', state: ExclusionState.Disabled },
            ];
            const handler = new ExclusionsHandler(async () => {}, exclusions, ExclusionsMode.Regular);

            const addedCount = await handler.addExclusions([
                { value: 'example.com', enabled: false, overwriteState: true },
            ]);

            expect(addedCount).toBe(0);
            expect(handler.exclusions).toMatchObject([
                { id: '1', hostname: 'example.com', state: ExclusionState.Disabled },
            ]);
        });
    });

    describe('import batch regression', () => {
        it('preserves existing Enabled companions and creates new entries with requested states, counting only changes', async () => {
            const exclusions: ExclusionInterface[] = [
                { id: '1', hostname: 'example.com', state: ExclusionState.Enabled },
                { id: '2', hostname: '*.example.com', state: ExclusionState.Enabled },
                { id: '3', hostname: 'other.com', state: ExclusionState.Disabled },
            ];
            const handler = new ExclusionsHandler(async () => {}, exclusions, ExclusionsMode.Regular);

            // Mirrors a realistic import batch produced by supplementExclusion when
            // re-importing example.com (force-enable + enabled:false wildcard companion)
            // and adding new.com.
            const addedCount = await handler.addExclusions([
                { value: 'example.com', enabled: true, overwriteState: true },
                { value: '*.example.com', enabled: false },
                { value: 'new.com', enabled: true, overwriteState: true },
                { value: '*.new.com', enabled: false },
            ]);

            // example.com: overwriteState true but state already matches -> no count.
            // *.example.com: enabled false + default overwriteState -> no-op (preserved Enabled).
            // new.com: new -> Enabled (+1).
            // *.new.com: new -> Disabled (+1).
            expect(addedCount).toBe(2);
            expect(handler.exclusions).toMatchObject([
                { id: '1', hostname: 'example.com', state: ExclusionState.Enabled },
                { id: '2', hostname: '*.example.com', state: ExclusionState.Enabled },
                { id: '3', hostname: 'other.com', state: ExclusionState.Disabled },
                { hostname: 'new.com', state: ExclusionState.Enabled },
                { hostname: '*.new.com', state: ExclusionState.Disabled },
            ]);
        });
    });
});
