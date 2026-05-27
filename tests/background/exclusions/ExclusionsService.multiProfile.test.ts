import {
    vi,
    describe,
    beforeEach,
    afterEach,
    it,
    expect,
} from 'vitest';

import { ExclusionsService } from '../../../src/background/exclusions/ExclusionsService';
import { ExclusionsMode, ExclusionState } from '../../../src/common/exclusionsConstants';
import { servicesManager } from '../../../src/background/exclusions/services/ServicesManager';
import { proxy } from '../../../src/background/proxy';

/**
 * Stub settings per profile ID, allowing tests to set up different initial data.
 */
const profileSettingsMap: Record<string, object> = {};

const resetProfileSettings = (): void => {
    profileSettingsMap.default = {
        exclusions: { inverted: false, regular: [], selective: [] },
    };
    profileSettingsMap.work = {
        exclusions: { inverted: false, regular: [], selective: [] },
    };
};

vi.mock('../../../src/background/profiles', () => {
    return {
        __esModule: true,
        profilesService: {
            getActiveProfileId: () => 'default',
            resolveProfileId: async (id?: string) => id ?? 'default',
            getProfileSettings: (id: string) => structuredClone(profileSettingsMap[id] ?? {
                exclusions: { inverted: false, regular: [], selective: [] },
            }),
            getProfileInfoList: async () => ({
                profiles: [
                    { id: 'default', name: 'Default' },
                    { id: 'work', name: 'Work' },
                ],
                activeProfileId: 'default',
            }),
            updateProfileSettings: async (
                _id: string,
                _patch: unknown,
                onApply?: () => Promise<void>,
            ) => {
                if (onApply) {
                    await onApply();
                }
            },
        },
    };
});

vi.mock('../../../src/background/settings', () => ({
    __esModule: true,
    settings: {},
}));

vi.mock('../../../src/background/api/fallbackApi', () => ({
    __esModule: true,
    fallbackApi: { getApiUrlsExclusions: () => [] },
}));

vi.mock('../../../src/background/providers/vpnProvider', () => ({
    __esModule: true,
    vpnProvider: {
        getExclusionsServices: async () => ({}),
        getExclusionsServicesDomains: async () => ({}),
    },
}));

const SERVICE_DATA = {
    categories: { id: 'SHOP', name: 'Shopping' },
    iconUrl: 'https://test.example.com/icon?domain=aliexpress.com',
    serviceId: 'aliexpress',
    serviceName: 'Aliexpress',
    modifiedTime: '2021-09-14T10:23:00+0000',
    domains: ['aliexpress.com', 'aliexpress.ru'],
};

servicesManager.getServicesDto = vi.fn().mockResolvedValue([SERVICE_DATA]);
servicesManager.getService = vi.fn().mockResolvedValue(SERVICE_DATA);
servicesManager.getServices = vi.fn().mockResolvedValue({ aliexpress: SERVICE_DATA });
servicesManager.getIndexedServices = vi.fn().mockResolvedValue({
    'aliexpress.com': 'aliexpress',
    'aliexpress.ru': 'aliexpress',
});

describe('ExclusionsService — multi-profile', () => {
    beforeEach(async () => {
        resetProfileSettings();
        await proxy.init();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should isolate exclusions between profiles', async () => {
        const service = new ExclusionsService();
        await service.init();

        // Add exclusion to default profile
        await service.addUrlToExclusions('default', 'example.org');
        // Add exclusion to work profile
        await service.addUrlToExclusions('work', 'example.com');

        const defaultExclusions = await service.getExclusions();
        expect(defaultExclusions.children).toHaveLength(1);
        expect(defaultExclusions.children[0].hostname).toEqual('example.org');

        const workData = await service.getExclusionsDataForProfile('work');
        expect(workData.exclusionsData.exclusions.children).toHaveLength(1);
        expect(workData.exclusionsData.exclusions.children[0].hostname).toEqual('example.com');
    });

    it('should support different modes per profile', async () => {
        const service = new ExclusionsService();
        await service.init();

        await service.setMode('work', ExclusionsMode.Selective, false);

        expect(await service.getMode('default')).toEqual(ExclusionsMode.Regular);
        expect(await service.getMode('work')).toEqual(ExclusionsMode.Selective);
    });

    it('should toggle exclusion state for a specific profile', async () => {
        const service = new ExclusionsService();
        await service.init();

        await service.addUrlToExclusions('work', 'example.org');
        const workData = await service.getExclusionsDataForProfile('work');
        const groupId = workData.exclusionsData.exclusions.children[0].id;

        await service.toggleExclusionState('work', groupId);

        const updatedData = await service.getExclusionsDataForProfile('work');
        expect(updatedData.exclusionsData.exclusions.children[0].state).toEqual(ExclusionState.Disabled);

        // Default profile should be unaffected
        const defaultExclusions = await service.getExclusions();
        expect(defaultExclusions.children).toHaveLength(0);
    });

    it('should remove exclusion from specific profile without affecting others', async () => {
        const service = new ExclusionsService();
        await service.init();

        await service.addUrlToExclusions('default', 'example.org');
        await service.addUrlToExclusions('work', 'example.org');

        const workData = await service.getExclusionsDataForProfile('work');
        const workGroupId = workData.exclusionsData.exclusions.children[0].id;

        await service.removeExclusion('work', workGroupId);

        const updatedWork = await service.getExclusionsDataForProfile('work');
        expect(updatedWork.exclusionsData.exclusions.children).toHaveLength(0);

        const defaultExclusions = await service.getExclusions();
        expect(defaultExclusions.children).toHaveLength(1);
    });

    it('should clear exclusions for specific profile only', async () => {
        const service = new ExclusionsService();
        await service.init();

        await service.addUrlToExclusions('default', 'example.org');
        await service.addUrlToExclusions('work', 'example.com');

        await service.clearExclusionsData('work');

        const defaultExclusions = await service.getExclusions();
        expect(defaultExclusions.children).toHaveLength(1);

        const workData = await service.getExclusionsDataForProfile('work');
        expect(workData.exclusionsData.exclusions.children).toHaveLength(0);
    });

    it('should restore exclusions per profile independently', async () => {
        const service = new ExclusionsService();
        await service.init();

        // Set up default profile
        await service.addUrlToExclusions('default', 'example.org');
        const defaultBefore = await service.getExclusions();

        // Set up work profile
        await service.addUrlToExclusions('work', 'example.com');
        const workBefore = await service.getExclusionsDataForProfile('work');

        // Add more to default (creates snapshot of pre-addition state)
        await service.addUrlToExclusions('default', 'example.net');
        const defaultAfter = await service.getExclusions();
        expect(defaultAfter.children).toHaveLength(2);

        // Restore default profile
        await service.restoreExclusions('default');
        const defaultRestored = await service.getExclusions();
        expect(defaultRestored).toEqual(defaultBefore);

        // Work profile should be unaffected
        const workAfter = await service.getExclusionsDataForProfile('work');
        expect(workAfter.exclusionsData.exclusions).toEqual(workBefore.exclusionsData.exclusions);
    });

    it('should restore exclusions for a non-active profile', async () => {
        const service = new ExclusionsService();
        await service.init();

        // Add exclusion to work (non-active) — creates snapshot (empty state)
        await service.addUrlToExclusions('work', 'example.org');
        const workBefore = await service.getExclusionsDataForProfile('work');
        expect(workBefore.exclusionsData.exclusions.children).toHaveLength(1);

        // Add more to work — creates snapshot with example.org
        await service.addUrlToExclusions('work', 'example.com');
        const workAfter = await service.getExclusionsDataForProfile('work');
        expect(workAfter.exclusionsData.exclusions.children).toHaveLength(2);

        // Restore work profile
        await service.restoreExclusions('work');
        const workRestored = await service.getExclusionsDataForProfile('work');
        expect(workRestored.exclusionsData.exclusions.children).toHaveLength(1);
        expect(workRestored.exclusionsData.exclusions.children[0].hostname).toEqual('example.org');
    });

    it('should restore exclusions for the active profile without affecting non-active', async () => {
        const service = new ExclusionsService();
        await service.init();

        // Set up both profiles
        await service.addUrlToExclusions('default', 'default-1.org');
        await service.addUrlToExclusions('work', 'work-1.org');

        // Add more to default (active) — creates snapshot
        await service.addUrlToExclusions('default', 'default-2.org');
        expect((await service.getExclusions()).children).toHaveLength(2);

        // Restore active profile
        await service.restoreExclusions('default');
        const defaultRestored = await service.getExclusions();
        expect(defaultRestored.children).toHaveLength(1);
        expect(defaultRestored.children[0].hostname).toEqual('default-1.org');

        // Non-active profile should be unaffected
        const workData = await service.getExclusionsDataForProfile('work');
        expect(workData.exclusionsData.exclusions.children).toHaveLength(1);
        expect(workData.exclusionsData.exclusions.children[0].hostname).toEqual('work-1.org');
    });

    it('savePreviousExclusions should use snapshots (not references)', async () => {
        const service = new ExclusionsService();
        await service.init();

        // Add first exclusion — this creates a snapshot (empty state)
        await service.addUrlToExclusions('default', 'example.org');
        // Add second exclusion — this creates a snapshot with example.org
        await service.addUrlToExclusions('default', 'example.com');

        const exclusions = await service.getExclusions();
        expect(exclusions.children).toHaveLength(2);

        // Restore to before example.com was added
        await service.restoreExclusions('default');
        const restored = await service.getExclusions();
        expect(restored.children).toHaveLength(1);
        expect(restored.children[0].hostname).toEqual('example.org');
    });

    it('getProfileExclusionsDataMap should return data for all profiles', async () => {
        const service = new ExclusionsService();
        await service.init();

        await service.addUrlToExclusions('default', 'example.org');
        await service.addUrlToExclusions('work', 'example.com');

        const dataMap = await service.getProfileExclusionsDataMap();

        expect(Object.keys(dataMap)).toContain('default');
        expect(Object.keys(dataMap)).toContain('work');
        expect(dataMap.default.exclusionsData.exclusions.children).toHaveLength(1);
        expect(dataMap.work.exclusionsData.exclusions.children).toHaveLength(1);
        expect(dataMap.default.exclusionsData.exclusions.children[0].hostname).toEqual('example.org');
        expect(dataMap.work.exclusionsData.exclusions.children[0].hostname).toEqual('example.com');
    });

    it('isInverted should return correct value per profile', async () => {
        const service = new ExclusionsService();
        await service.init();

        expect(await service.isInverted('default')).toBe(false);
        expect(await service.isInverted('work')).toBe(false);

        await service.setMode('work', ExclusionsMode.Selective, false);

        expect(await service.isInverted('default')).toBe(false);
        expect(await service.isInverted('work')).toBe(true);
    });

    it('getRegularExclusions and getSelectiveExclusions for specific profile', async () => {
        const service = new ExclusionsService();
        await service.init();

        await service.addGeneralExclusions('work', ['example.org']);
        await service.setMode('work', ExclusionsMode.Selective, false);
        await service.addSelectiveExclusions('work', ['example.com']);

        const regular = await service.getRegularExclusions('work');
        expect(regular).toContain('example.org');

        const selective = await service.getSelectiveExclusions('work');
        expect(selective).toContain('example.com');

        // Default profile should have neither
        const defaultRegular = await service.getRegularExclusions('default');
        expect(defaultRegular).toEqual('');
    });

    it('addExclusionsMap for specific profile', async () => {
        const service = new ExclusionsService();
        await service.init();

        const exclusionsMap = {
            [ExclusionsMode.Regular]: ['example.org'],
            [ExclusionsMode.Selective]: ['example.com'],
        };

        const count = await service.addExclusionsMap('work', exclusionsMap);
        expect(count).toBeGreaterThan(0);

        const regular = await service.getRegularExclusions('work');
        expect(regular).toContain('example.org');

        const selective = await service.getSelectiveExclusions('work');
        expect(selective).toContain('example.com');

        // Default unaffected
        expect(await service.getRegularExclusions('default')).toEqual('');
    });

    it('getExclusionsDataForProfile should include services state', async () => {
        const service = new ExclusionsService();
        await service.init();

        const data = await service.getExclusionsDataForProfile('work');

        expect(data.services).toBeDefined();
        expect(data.services).toHaveLength(1);
        expect(data.services[0].serviceId).toEqual('aliexpress');
        expect(data.isAllExclusionsListsEmpty).toBe(true);
    });

    it('isAllExclusionsListsEmpty should be false when exclusions exist', async () => {
        const service = new ExclusionsService();
        await service.init();

        await service.addUrlToExclusions('work', 'example.org');

        const data = await service.getExclusionsDataForProfile('work');
        expect(data.isAllExclusionsListsEmpty).toBe(false);
    });
});
