import {
    vi,
    describe,
    beforeEach,
    it,
    expect,
} from 'vitest';
import { observable, runInAction } from 'mobx';

import { ExclusionsMode, ExclusionState, ExclusionsType } from '../../../src/common/exclusionsConstants';
import { DEFAULT_PROFILE_ID } from '../../../src/common/profiles';
import { ExclusionsStore } from '../../../src/options/stores/ExclusionsStore';
import { type ProfilesStore, type ProfileExclusionsCacheEntry } from '../../../src/options/stores/ProfilesStore';

vi.mock('../../../src/common/messenger', () => ({
    messenger: {
        getExclusionsData: vi.fn(),
        addUrlToExclusions: vi.fn(),
        removeExclusion: vi.fn(),
        toggleExclusionState: vi.fn(),
        toggleServices: vi.fn(),
        setExclusionsMode: vi.fn(),
        clearExclusionsList: vi.fn(),
        restoreExclusions: vi.fn(),
        resetServiceData: vi.fn(),
    },
}));

vi.mock('../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => key),
    },
}));

const MOCK_EXCLUSIONS_TREE = {
    id: 'root',
    parentId: null,
    hostname: '',
    state: ExclusionState.Disabled,
    type: ExclusionsType.Group,
    children: [
        {
            id: 'example.org',
            parentId: 'root',
            hostname: 'example.org',
            state: ExclusionState.Enabled,
            type: ExclusionsType.Group,
            children: [],
        },
    ],
};

const MOCK_SERVICES = [
    {
        serviceId: 'aliexpress',
        serviceName: 'Aliexpress',
        iconUrl: '',
        categories: [{ id: 'SHOP', name: 'Shopping' }],
        domains: ['aliexpress.com'],
        state: ExclusionState.Disabled,
        modifiedTime: '',
    },
];

describe('ExclusionsStore', () => {
    let profilesStore: ProfilesStore;
    let exclusionsStore: ExclusionsStore;

    beforeEach(() => {
        vi.clearAllMocks();

        // Create a mock ProfilesStore with activeProfileId for effectiveProfileId resolution.
        profilesStore = observable.object({
            exclusionsCache: {} as Record<string, ProfileExclusionsCacheEntry>,
            profiles: [
                { id: DEFAULT_PROFILE_ID, name: '' },
                { id: 'work', name: 'Work' },
            ],
            activeProfileId: DEFAULT_PROFILE_ID,
            updateExclusionsCache: vi.fn(),
        }) as unknown as ProfilesStore;

        exclusionsStore = new ExclusionsStore(profilesStore);

        // Fill the ProfilesStore exclusions cache
        runInAction(() => {
            profilesStore.exclusionsCache[DEFAULT_PROFILE_ID] = {
                exclusionsTree: MOCK_EXCLUSIONS_TREE,
                currentMode: ExclusionsMode.Regular,
                services: MOCK_SERVICES,
                isAllExclusionsListsEmpty: false,
            };
            profilesStore.exclusionsCache.work = {
                exclusionsTree: {
                    id: 'root',
                    parentId: null,
                    hostname: '',
                    state: ExclusionState.Disabled,
                    type: ExclusionsType.Group,
                    children: [],
                },
                currentMode: ExclusionsMode.Selective,
                services: [],
                isAllExclusionsListsEmpty: true,
            };
        });
    });

    describe('profileId', () => {
        it('should default to undefined', () => {
            expect(exclusionsStore.profileId).toBeUndefined();
        });

        it('should be settable via setProfileId', () => {
            exclusionsStore.setProfileId('work');
            expect(exclusionsStore.profileId).toBe('work');
        });

        it('should reset UI state when profileId changes', () => {
            exclusionsStore.setModeSelectorModalOpen(true);
            exclusionsStore.setExclusionsSearchValue('test');

            exclusionsStore.setProfileId('work');

            expect(exclusionsStore.modeSelectorModalOpen).toBe(false);
            expect(exclusionsStore.exclusionsSearchValue).toBe('');
        });
    });

    describe('effectiveProfileId-based computed properties', () => {
        it('should read exclusions tree from active profile when profileId is undefined', () => {
            expect(exclusionsStore.exclusionsTree.children).toHaveLength(1);
            expect(exclusionsStore.exclusionsTree.children[0].hostname).toEqual('example.org');
        });

        it('should read exclusions tree from specific profile when profileId is set', () => {
            exclusionsStore.setProfileId('work');
            expect(exclusionsStore.exclusionsTree.children).toHaveLength(0);
        });

        it('should read currentMode from active profile by default', () => {
            expect(exclusionsStore.currentMode).toEqual(ExclusionsMode.Regular);
        });

        it('should read currentMode from specific profile when profileId is set', () => {
            exclusionsStore.setProfileId('work');
            expect(exclusionsStore.currentMode).toEqual(ExclusionsMode.Selective);
        });

        it('should read isAllExclusionsListsEmpty from active profile by default', () => {
            expect(exclusionsStore.isAllExclusionsListsEmpty).toBe(false);
        });

        it('should read isAllExclusionsListsEmpty from specific profile when profileId is set', () => {
            exclusionsStore.setProfileId('work');
            expect(exclusionsStore.isAllExclusionsListsEmpty).toBe(true);
        });
    });

    describe('resetUiState', () => {
        it('should reset all modal and search state', () => {
            exclusionsStore.setModeSelectorModalOpen(true);
            exclusionsStore.openAddExclusionModal();
            exclusionsStore.openRemoveAllModal();
            exclusionsStore.setExclusionsSearchValue('query');

            exclusionsStore.resetUiState();

            expect(exclusionsStore.modeSelectorModalOpen).toBe(false);
            expect(exclusionsStore.addExclusionModalOpen).toBe(false);
            expect(exclusionsStore.removeAllModalOpen).toBe(false);
            expect(exclusionsStore.exclusionsSearchValue).toBe('');
        });
    });

    describe('fallback when cache is empty', () => {
        it('should return empty tree when profile has no cache entry', () => {
            exclusionsStore.setProfileId('nonexistent');
            expect(exclusionsStore.exclusionsTree.children).toHaveLength(0);
            expect(exclusionsStore.exclusionsTree.id).toBe('root');
        });

        it('should return Regular mode when profile has no cache entry', () => {
            exclusionsStore.setProfileId('nonexistent');
            expect(exclusionsStore.currentMode).toEqual(ExclusionsMode.Regular);
        });

        it('should return true for isAllExclusionsListsEmpty when profile has no cache entry', () => {
            exclusionsStore.setProfileId('nonexistent');
            expect(exclusionsStore.isAllExclusionsListsEmpty).toBe(true);
        });
    });
});
