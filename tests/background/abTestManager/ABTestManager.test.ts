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
import { type SessionStartResponse } from '../../../src/background/schema/telemetry/sessionStartResponse';

const REGISTRY: ExperimentRegistry = {
    experiment_1: 'AG-001-feature-a',
    experiment_2: 'AG-002-feature-b',
};

const FULL_REGISTRY: ExperimentRegistry = {
    experiment_1: 'AG-001-feature-a',
    experiment_2: 'AG-002-feature-b',
    experiment_3: 'AG-003-feature-c',
};

const makeResponse = (
    overrides: SessionStartResponse['versions'] = {},
): SessionStartResponse => ({
    versions: overrides,
});

type AssignmentFixture = {
    experiment_name: string;
    version_name: string;
};

const makeAssignment = (overrides: Partial<AssignmentFixture> = {}): AssignmentFixture => ({
    experiment_name: 'AG-001-feature-a',
    version_name: 'AG-001-feature-a-variant_def',
    ...overrides,
});

describe('ABTestManager', () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('lazy loading', () => {
        it('should be a no-op - cache is lazy-loaded on first access', async () => {
            const cached = {
                experiment_1: makeAssignment(),
            };
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(cached);

            const manager = new ABTestManager(REGISTRY);

            expect(browserApi.storage.get).not.toHaveBeenCalled();

            expect(await manager.getVariantsForProps()).toEqual({
                experiment_1: 'AG-001-feature-a-variant_def',
            });
            expect(browserApi.storage.get).toHaveBeenCalledWith(ABTestManager.VARIANTS_STORAGE_KEY);
        });

        it('should use empty cache if storage returns nothing', async () => {
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(undefined);

            const manager = new ABTestManager(REGISTRY);

            expect(await manager.getVariantsForProps()).toEqual({});
        });

        it('should lazy-load and log info if storage value is corrupted', async () => {
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue('corrupted-string');

            const manager = new ABTestManager(REGISTRY);

            expect(log.info).not.toHaveBeenCalled();

            expect(await manager.getVariantsForProps()).toEqual({});
            expect(log.info).toHaveBeenCalledWith(
                '[vpn.ABTestManager.loadFromStorage]: Unsupported variant cache format, resetting assignments',
                expect.anything(),
            );
            expect(browserApi.storage.remove).toHaveBeenCalledWith(ABTestManager.VARIANTS_STORAGE_KEY);
        });

        it('should use empty cache if storage read rejects', async () => {
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockRejectedValue(new Error('storage unavailable'));

            const manager = new ABTestManager(REGISTRY);

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
            const cached = {
                experiment_1: makeAssignment(),
            };
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(cached);

            const manager = new ABTestManager(REGISTRY);

            expect(await manager.getTestsPayload()).toEqual({
                experiment_2: 'AG-002-feature-b',
            });
        });

        it('should return empty object when all slots are cached', async () => {
            const cached = {
                experiment_1: makeAssignment(),
                experiment_2: makeAssignment({
                    experiment_name: 'AG-002-feature-b',
                    version_name: 'AG-002-feature-b-variant_b',
                }),
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
                experiment_1: makeAssignment(),
                experiment_2: makeAssignment({
                    experiment_name: 'AG-002-feature-b',
                    version_name: 'AG-002-feature-b-variant_b',
                }),
            });

            await manager.processResponse(response);

            expect(browserApi.storage.set).toHaveBeenCalledWith(
                ABTestManager.VARIANTS_STORAGE_KEY,
                {
                    experiment_1: {
                        experiment_name: 'AG-001-feature-a',
                        version_name: 'AG-001-feature-a-variant_def',
                    },
                    experiment_2: {
                        experiment_name: 'AG-002-feature-b',
                        version_name: 'AG-002-feature-b-variant_b',
                    },
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
                experiment_3: makeAssignment({
                    experiment_name: 'AG-003-feature-c',
                    version_name: 'AG-003-feature-c-variant_def',
                }),
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
                experiment_1: makeAssignment(),
                experiment_3: makeAssignment({
                    experiment_name: 'AG-003-feature-c',
                    version_name: 'AG-003-feature-c-variant_def',
                }),
            });

            await manager.processResponse(response);

            expect(browserApi.storage.set).toHaveBeenCalledWith(
                ABTestManager.VARIANTS_STORAGE_KEY,
                {
                    experiment_1: {
                        experiment_name: 'AG-001-feature-a',
                        version_name: 'AG-001-feature-a-variant_def',
                    },
                },
            );
            expect(await manager.getVariantsForProps()).toEqual({
                experiment_1: 'AG-001-feature-a-variant_def',
            });
        });

        it('should ignore an assignment for a different experiment in a registered slot', async () => {
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(undefined);

            const manager = new ABTestManager(REGISTRY);

            const response = makeResponse({
                experiment_1: makeAssignment({ experiment_name: 'AG-retired-experiment', version_name: 'b' }),
            });

            await manager.processResponse(response);

            expect(browserApi.storage.set).not.toHaveBeenCalled();
            expect(await manager.getVariantsForProps()).toEqual({});
        });

        it('should cache valid assignments when another assignment has an empty version_name', async () => {
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(undefined);

            const manager = new ABTestManager(REGISTRY);

            const response = makeResponse({
                experiment_1: makeAssignment({ version_name: 'b' }),
                experiment_2: makeAssignment({ experiment_name: 'AG-002-feature-b', version_name: '' }),
            });

            await manager.processResponse(response);

            expect(browserApi.storage.set).toHaveBeenCalledWith(
                ABTestManager.VARIANTS_STORAGE_KEY,
                {
                    experiment_1: {
                        experiment_name: 'AG-001-feature-a',
                        version_name: 'b',
                    },
                },
            );
            expect(await manager.getVariantsForProps()).toEqual({ experiment_1: 'b' });
        });

        it('should merge new assignments with existing cached variants', async () => {
            const cached = {
                experiment_1: makeAssignment(),
            };
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(cached);

            const manager = new ABTestManager(REGISTRY);

            const response = makeResponse({
                experiment_2: makeAssignment({
                    experiment_name: 'AG-002-feature-b',
                    version_name: 'AG-002-feature-b-variant_b',
                }),
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
                experiment_1: makeAssignment(),
                experiment_2: makeAssignment({
                    experiment_name: 'AG-002-feature-b',
                    version_name: 'AG-002-feature-b-variant_b',
                }),
            };
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(cached);

            const manager = new ABTestManager(REGISTRY);

            expect(await manager.getVariantsForProps()).toEqual({
                experiment_1: 'AG-001-feature-a-variant_def',
                experiment_2: 'AG-002-feature-b-variant_b',
            });
        });

        it('should return empty object when no variants are cached', async () => {
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(undefined);

            const manager = new ABTestManager(REGISTRY);

            expect(await manager.getVariantsForProps()).toEqual({});
        });

        it('should migrate a legacy string cache for an active experiment', async () => {
            const cached = { experiment_1: 'AG-001-feature-a-variant_def' };
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(cached);

            const manager = new ABTestManager(REGISTRY);

            expect(await manager.getVariantsForProps()).toEqual({
                experiment_1: 'AG-001-feature-a-variant_def',
            });
            expect(browserApi.storage.set).toHaveBeenCalledWith(
                ABTestManager.VARIANTS_STORAGE_KEY,
                {
                    experiment_1: {
                        experiment_name: 'AG-001-feature-a',
                        version_name: 'AG-001-feature-a-variant_def',
                    },
                },
            );
            expect(browserApi.storage.remove).not.toHaveBeenCalled();
            expect(await manager.getTestsPayload()).toEqual({
                experiment_2: 'AG-002-feature-b',
            });
        });

        it('should migrate a legacy entry with a generic version name', async () => {
            const cached = { experiment_1: 'b' };
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(cached);

            const manager = new ABTestManager(REGISTRY);

            expect(await manager.getVariantsForProps()).toEqual({ experiment_1: 'b' });
            expect(browserApi.storage.set).toHaveBeenCalledWith(
                ABTestManager.VARIANTS_STORAGE_KEY,
                {
                    experiment_1: {
                        experiment_name: 'AG-001-feature-a',
                        version_name: 'b',
                    },
                },
            );
            expect(browserApi.storage.remove).not.toHaveBeenCalled();
            expect(log.debug).toHaveBeenCalledWith(
                '[vpn.ABTestManager.migrateLegacyCache]: Migrating legacy variant cache',
                {
                    migrated: ['experiment_1'],
                    dropped: [],
                },
            );
        });

        it('should use the migrated cache in memory when persisting fails', async () => {
            const cached = { experiment_1: 'AG-001-feature-a-variant_def' };
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(cached);
            // @ts-expect-error - partially mocked
            browserApi.storage.set.mockRejectedValue(new Error('storage unavailable'));

            const manager = new ABTestManager(REGISTRY);

            expect(await manager.getVariantsForProps()).toEqual({
                experiment_1: 'AG-001-feature-a-variant_def',
            });
            expect(log.warn).toHaveBeenCalled();
        });

        it('should drop legacy entries that do not belong to active experiments', async () => {
            const cached = {
                experiment_1: 'AG-001-feature-a-variant_def',
                experiment_3: 'AG-retired-variant',
            };
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(cached);

            const manager = new ABTestManager(REGISTRY);

            expect(await manager.getVariantsForProps()).toEqual({
                experiment_1: 'AG-001-feature-a-variant_def',
            });
            expect(browserApi.storage.set).toHaveBeenCalledWith(
                ABTestManager.VARIANTS_STORAGE_KEY,
                {
                    experiment_1: {
                        experiment_name: 'AG-001-feature-a',
                        version_name: 'AG-001-feature-a-variant_def',
                    },
                },
            );
            expect(browserApi.storage.remove).not.toHaveBeenCalled();
            expect(log.debug).toHaveBeenCalledWith(
                '[vpn.ABTestManager.migrateLegacyCache]: Migrating legacy variant cache',
                {
                    migrated: ['experiment_1'],
                    dropped: ['experiment_3'],
                },
            );
        });

        it('should remove the storage key when no legacy entry can be migrated', async () => {
            const cached = { experiment_1: '' };
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(cached);

            const manager = new ABTestManager(REGISTRY);

            expect(await manager.getVariantsForProps()).toEqual({});
            expect(browserApi.storage.set).not.toHaveBeenCalled();
            expect(browserApi.storage.remove).toHaveBeenCalledWith(ABTestManager.VARIANTS_STORAGE_KEY);
            expect(await manager.getTestsPayload()).toEqual({
                experiment_1: 'AG-001-feature-a',
                experiment_2: 'AG-002-feature-b',
            });
        });
    });

    describe('removeRetiredVariants', () => {
        it('should not mutate storage when the cache is empty', async () => {
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(undefined);

            const manager = new ABTestManager(REGISTRY);

            await manager.removeRetiredVariants();

            expect(browserApi.storage.remove).not.toHaveBeenCalled();
            expect(browserApi.storage.set).not.toHaveBeenCalled();
        });

        it('should remove the storage key when all cached slots are retired', async () => {
            const cached = {
                experiment_3: makeAssignment({
                    experiment_name: 'AG-retired-experiment',
                    version_name: 'b',
                }),
            };
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(cached);

            const manager = new ABTestManager(REGISTRY);

            await manager.removeRetiredVariants();

            expect(browserApi.storage.remove).toHaveBeenCalledWith(ABTestManager.VARIANTS_STORAGE_KEY);
            expect(log.debug).toHaveBeenCalledWith(
                '[vpn.ABTestManager.removeRetiredVariants]: Removing retired variant slots',
                ['experiment_3'],
            );
            expect(browserApi.storage.set).not.toHaveBeenCalled();
            expect(await manager.getVariantsForProps()).toEqual({});
        });

        it('should not wipe a fresh assignment when cleanup races processing', async () => {
            const cached = {
                experiment_3: makeAssignment({
                    experiment_name: 'AG-retired-experiment',
                    version_name: 'b',
                }),
            };
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(cached);

            let resolveRemove: () => void = () => {
                // overridden by the storage mock below
            };
            // @ts-expect-error - partially mocked
            browserApi.storage.remove.mockImplementation(() => new Promise<void>((resolve) => {
                resolveRemove = resolve;
            }));

            const manager = new ABTestManager(REGISTRY);

            const cleanup = manager.removeRetiredVariants();
            await vi.waitFor(() => expect(browserApi.storage.remove).toHaveBeenCalled());

            const processing = manager.processResponse(makeResponse({
                experiment_2: makeAssignment({
                    experiment_name: 'AG-002-feature-b',
                    version_name: 'AG-002-feature-b-variant_b',
                }),
            }));

            // Serialized: processing must wait for cleanup and cannot write yet.
            await new Promise((resolve) => {
                setTimeout(resolve, 0);
            });
            expect(browserApi.storage.set).not.toHaveBeenCalled();

            resolveRemove();
            await cleanup;
            await processing;

            expect(await manager.getVariantsForProps()).toEqual({
                experiment_2: 'AG-002-feature-b-variant_b',
            });
            expect(browserApi.storage.set).toHaveBeenCalledWith(
                ABTestManager.VARIANTS_STORAGE_KEY,
                {
                    experiment_2: {
                        experiment_name: 'AG-002-feature-b',
                        version_name: 'AG-002-feature-b-variant_b',
                    },
                },
            );
        });

        it('should persist active variants when only some cached slots are retired', async () => {
            const cached = {
                experiment_1: makeAssignment({ version_name: 'b' }),
                experiment_3: makeAssignment({
                    experiment_name: 'AG-retired-experiment',
                    version_name: 'b',
                }),
            };
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(cached);

            const manager = new ABTestManager(REGISTRY);

            await manager.removeRetiredVariants();

            expect(browserApi.storage.remove).not.toHaveBeenCalled();
            expect(browserApi.storage.set).toHaveBeenCalledWith(
                ABTestManager.VARIANTS_STORAGE_KEY,
                {
                    experiment_1: {
                        experiment_name: 'AG-001-feature-a',
                        version_name: 'b',
                    },
                },
            );
            expect(log.debug).toHaveBeenCalledWith(
                '[vpn.ABTestManager.removeRetiredVariants]: Removing retired variant slots',
                ['experiment_3'],
            );
            expect(await manager.getVariantsForProps()).toEqual({
                experiment_1: 'b',
            });
        });

        it('should remove a cached variant when its slot is reused', async () => {
            const cached = {
                experiment_1: makeAssignment({
                    experiment_name: 'AG-retired-experiment',
                    version_name: 'b',
                }),
            };
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(cached);

            const manager = new ABTestManager(REGISTRY);

            await manager.removeRetiredVariants();

            expect(browserApi.storage.remove).toHaveBeenCalledWith(ABTestManager.VARIANTS_STORAGE_KEY);
            expect(await manager.getTestsPayload()).toEqual({
                experiment_1: 'AG-001-feature-a',
                experiment_2: 'AG-002-feature-b',
            });
        });

        it('should propagate a storage failure during cleanup', async () => {
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue({
                experiment_3: makeAssignment({
                    experiment_name: 'AG-retired-experiment',
                    version_name: 'b',
                }),
            });
            // @ts-expect-error - partially mocked
            browserApi.storage.remove.mockRejectedValue(new Error('storage unavailable'));

            const manager = new ABTestManager(REGISTRY);

            await expect(manager.removeRetiredVariants()).rejects.toThrow('storage unavailable');
        });

        it('should keep an active variant regardless of its version name', async () => {
            const cached = {
                experiment_1: makeAssignment({ version_name: 'b' }),
            };
            // @ts-expect-error - partially mocked
            browserApi.storage.get.mockResolvedValue(cached);

            const manager = new ABTestManager(REGISTRY);

            await manager.removeRetiredVariants();

            expect(browserApi.storage.remove).not.toHaveBeenCalled();
            expect(browserApi.storage.set).not.toHaveBeenCalled();
            expect(await manager.getVariantsForProps()).toEqual({ experiment_1: 'b' });
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
