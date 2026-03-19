import {
    vi,
    describe,
    afterEach,
    it,
    expect,
} from 'vitest';

import { ABTestManager } from '../../../src/background/abTestManager/ABTestManager';
import { type ExperimentRegistry } from '../../../src/background/abTestManager/constants';
import { browserApi } from '../../../src/background/browserApi';
import { log } from '../../../src/common/logger';
import { type SessionStartResponse } from '../../../src/background/telemetry/telemetryTypes';

const REGISTRY: ExperimentRegistry = {
    experiment_1: 'AG-001-feature-a',
    experiment_2: 'AG-002-feature-b',
};

const FULL_REGISTRY: ExperimentRegistry = {
    experiment_1: 'AG-001-feature-a',
    experiment_2: 'AG-002-feature-b',
    experiment_3: 'AG-003-feature-c',
};

const makeResponse = (overrides: SessionStartResponse['versions'] = {}): SessionStartResponse => ({
    versions: overrides,
});

describe('ABTestManager', () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('init', () => {
        it('should be a no-op - cache is lazy-loaded on first access', async () => {
            const cached = { experiment_1: 'AG-001-feature-a-variant_def' };
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(cached);

            const manager = new ABTestManager(REGISTRY);

            expect(browserApi.storage.get).not.toHaveBeenCalled();

            expect(await manager.getVariantsForProps()).toEqual(cached);
            expect(browserApi.storage.get).toHaveBeenCalledWith(ABTestManager.VARIANTS_STORAGE_KEY);
        });

        it('should use empty cache if storage returns nothing', async () => {
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(undefined);

            const manager = new ABTestManager(REGISTRY);

            expect(await manager.getVariantsForProps()).toEqual({});
        });

        it('should lazy-load and log error if storage value is corrupted', async () => {
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue('corrupted-string');

            const manager = new ABTestManager(REGISTRY);

            expect(log.error).not.toHaveBeenCalled();

            expect(await manager.getVariantsForProps()).toEqual({});
            expect(log.error).toHaveBeenCalled();
        });
    });

    describe('buildTestsPayload', () => {
        it('should return all registered slots when cache is empty', async () => {
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(undefined);

            const manager = new ABTestManager(REGISTRY);

            expect(await manager.getTestsPayload()).toEqual({
                experiment_1: 'AG-001-feature-a',
                experiment_2: 'AG-002-feature-b',
            });
        });

        it('should omit slots that already have a cached variant', async () => {
            const cached = { experiment_1: 'AG-001-feature-a-variant_def' };
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(cached);

            const manager = new ABTestManager(REGISTRY);

            expect(await manager.getTestsPayload()).toEqual({
                experiment_2: 'AG-002-feature-b',
            });
        });

        it('should return empty object when all slots are cached', async () => {
            const cached = {
                experiment_1: 'AG-001-feature-a-variant_def',
                experiment_2: 'AG-002-feature-b-variant_b',
            };
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(cached);

            const manager = new ABTestManager(REGISTRY);

            expect(await manager.getTestsPayload()).toEqual({});
        });

        it('should return empty object when registry is empty', async () => {
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(undefined);

            const manager = new ABTestManager({});

            expect(await manager.getTestsPayload()).toEqual({});
        });
    });

    describe('processResponse', () => {
        it('should cache returned variant assignments and persist to storage', async () => {
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(undefined);

            const manager = new ABTestManager(REGISTRY);

            const response = makeResponse({
                experiment_1: { experiment_name: 'AG-001-feature-a', version_name: 'AG-001-feature-a-variant_def' },
                experiment_2: { experiment_name: 'AG-002-feature-b', version_name: 'AG-002-feature-b-variant_b' },
            });

            await manager.processResponse(response);

            expect(browserApi.storage.set).toHaveBeenCalledWith(
                ABTestManager.VARIANTS_STORAGE_KEY,
                {
                    experiment_1: 'AG-001-feature-a-variant_def',
                    experiment_2: 'AG-002-feature-b-variant_b',
                },
            );
            expect(await manager.getVariantsForProps()).toEqual({
                experiment_1: 'AG-001-feature-a-variant_def',
                experiment_2: 'AG-002-feature-b-variant_b',
            });
        });

        it('should not persist to storage when response is empty', async () => {
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(undefined);

            const manager = new ABTestManager(REGISTRY);

            await manager.processResponse(makeResponse({}));

            expect(browserApi.storage.set).not.toHaveBeenCalled();
            expect(await manager.getVariantsForProps()).toEqual({});
        });

        it('should ignore slots not present in the registry', async () => {
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(undefined);

            const manager = new ABTestManager(REGISTRY);

            const response = makeResponse({
                experiment_3: { experiment_name: 'AG-003-feature-c', version_name: 'AG-003-feature-c-variant_def' },
            });

            await manager.processResponse(response);

            expect(browserApi.storage.set).not.toHaveBeenCalled();
            expect(await manager.getVariantsForProps()).toEqual({});
        });

        it('should filter out unregistered slots when response contains both registered and unregistered slots', async () => {
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(undefined);

            const manager = new ABTestManager(REGISTRY);

            const response = makeResponse({
                experiment_1: { experiment_name: 'AG-001-feature-a', version_name: 'AG-001-feature-a-variant_def' },
                experiment_3: { experiment_name: 'AG-003-feature-c', version_name: 'AG-003-feature-c-variant_def' },
            });

            await manager.processResponse(response);

            expect(browserApi.storage.set).toHaveBeenCalledWith(
                ABTestManager.VARIANTS_STORAGE_KEY,
                {
                    experiment_1: 'AG-001-feature-a-variant_def',
                },
            );
            expect(await manager.getVariantsForProps()).toEqual({
                experiment_1: 'AG-001-feature-a-variant_def',
            });
        });

        it('should merge new assignments with existing cached variants', async () => {
            const cached = { experiment_1: 'AG-001-feature-a-variant_def' };
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(cached);

            const manager = new ABTestManager(REGISTRY);

            const response = makeResponse({
                experiment_2: { experiment_name: 'AG-002-feature-b', version_name: 'AG-002-feature-b-variant_b' },
            });

            await manager.processResponse(response);

            expect(await manager.getVariantsForProps()).toEqual({
                experiment_1: 'AG-001-feature-a-variant_def',
                experiment_2: 'AG-002-feature-b-variant_b',
            });
        });
    });

    describe('getVariantsForProps', () => {
        it('should return only slots with a cached variant', async () => {
            const cached = {
                experiment_1: 'AG-001-feature-a-variant_def',
                experiment_2: 'AG-002-feature-b-variant_b',
            };
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(cached);

            const manager = new ABTestManager(REGISTRY);

            expect(await manager.getVariantsForProps()).toEqual(cached);
        });

        it('should return empty object when no variants are cached', async () => {
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(undefined);

            const manager = new ABTestManager(REGISTRY);

            expect(await manager.getVariantsForProps()).toEqual({});
        });
    });

    describe('registry constraints', () => {
        it('should support up to 3 experiment slots', async () => {
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(undefined);

            const manager = new ABTestManager(FULL_REGISTRY);

            const payload = await manager.getTestsPayload();
            expect(Object.keys(payload)).toHaveLength(3);
            expect(payload).toEqual({
                experiment_1: 'AG-001-feature-a',
                experiment_2: 'AG-002-feature-b',
                experiment_3: 'AG-003-feature-c',
            });
        });
    });
});
