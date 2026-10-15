import {
    vi,
    describe,
    beforeEach,
    it,
    expect,
} from 'vitest';

import { InMemoryProfileStore } from '../../../../src/background/profiles/profileState/InMemoryProfileStore';
import { ProfileStateService } from '../../../../src/background/profiles/profileState/ProfileStateService';
import { SessionProfileStore } from '../../../../src/background/profiles/profileState/SessionProfileStore';
import { stateStorage } from '../../../../src/background/stateStorage';
import { PROFILE_SESSION_STATE_DEFAULTS, StorageKey } from '../../../../src/background/schema';
import { type ProfileExclusionsEntry } from '../../../../src/background/exclusions/profileExclusionsTypes';

describe('ProfileStateService', () => {
    const PROFILE_A = 'profile-a';
    const PROFILE_B = 'profile-b';

    let service: ProfileStateService;

    /**
     * Creates a shared in-memory storage and a factory of stores over it,
     * so several stores can share the same underlying map.
     *
     * @returns Factory of stores over one shared storage.
     */
    const createSharedStorage = () => {
        const storage: { data: Record<string, string[]> } = { data: {} };

        const createStore = () => {
            return new SessionProfileStore<string[]>(
                async () => storage.data,
                async (data) => { storage.data = data; },
                (): boolean => true,
            );
        };

        return { createStore };
    };

    beforeEach(async () => {
        service = new ProfileStateService();
        // Session stores share the stateStorage singleton, so reset the key
        // between tests to avoid order-dependent assertions.
        await stateStorage.setItem(StorageKey.ProfileSessionState, PROFILE_SESSION_STATE_DEFAULTS);
    });

    it('should store and retrieve in-memory data per profile', async () => {
        const entry = {} as ProfileExclusionsEntry;

        await service.exclusionsCache.set(PROFILE_A, Promise.resolve(entry));

        await expect(service.exclusionsCache.get(PROFILE_A)).resolves.toBeDefined();
        await expect(service.exclusionsCache.get(PROFILE_B)).resolves.toBeUndefined();
        await expect(service.exclusionsCache.getProfileIds()).resolves.toEqual([PROFILE_A]);
    });

    it('should delete in-memory data', async () => {
        const entry = {} as ProfileExclusionsEntry;
        await service.exclusionsCache.set(PROFILE_A, Promise.resolve(entry));

        await service.exclusionsCache.delete(PROFILE_A);

        await expect(service.exclusionsCache.get(PROFILE_A)).resolves.toBeUndefined();
        await expect(service.exclusionsCache.getProfileIds()).resolves.toEqual([]);
    });

    it('should share the in-flight value between concurrent getOrCreate calls', () => {
        let factoryCalls = 0;
        const promise = Promise.resolve({} as ProfileExclusionsEntry);

        const first = service.exclusionsCache.getOrCreate(PROFILE_A, () => {
            factoryCalls += 1;
            return promise;
        });
        const second = service.exclusionsCache.getOrCreate(PROFILE_A, () => {
            factoryCalls += 1;
            return promise;
        });

        expect(first).toBe(second);
        expect(factoryCalls).toBe(1);
    });

    it('should store and retrieve session data per profile', async () => {
        await service.dnsBackup.set(PROFILE_A, []);

        await expect(service.dnsBackup.get(PROFILE_A)).resolves.toEqual([]);
        await expect(service.dnsBackup.get(PROFILE_B)).resolves.toBeUndefined();
    });

    it('should delete session data', async () => {
        await service.dnsBackup.set(PROFILE_A, []);

        await service.dnsBackup.delete(PROFILE_A);

        await expect(service.dnsBackup.get(PROFILE_A)).resolves.toBeUndefined();
    });

    it('should clear in-memory and session data for a profile', async () => {
        await service.exclusionsCache.set(PROFILE_A, Promise.resolve({} as ProfileExclusionsEntry));
        await service.dnsBackup.set(PROFILE_A, []);
        await service.exclusionsSnapshots.set(PROFILE_A, {
            regular: [],
            selective: [],
        });

        await service.clearProfileData(PROFILE_A);

        await expect(service.exclusionsCache.get(PROFILE_A)).resolves.toBeUndefined();
        await expect(service.dnsBackup.get(PROFILE_A)).resolves.toBeUndefined();
        await expect(service.exclusionsSnapshots.get(PROFILE_A)).resolves.toBeUndefined();
    });

    it('should clear every exposed store during cleanup', async () => {
        const stores = Object.values(service).filter((value) => (
            value instanceof InMemoryProfileStore || value instanceof SessionProfileStore
        ));
        const deleteSpies = stores.map((store) => vi.spyOn(store, 'delete'));

        await service.clearProfileData(PROFILE_A);

        deleteSpies.forEach((deleteSpy) => {
            expect(deleteSpy).toHaveBeenCalledWith(PROFILE_A);
        });
    });

    it('should keep data of other profiles intact', async () => {
        await service.exclusionsCache.set(PROFILE_A, Promise.resolve({} as ProfileExclusionsEntry));
        await service.dnsBackup.set(PROFILE_B, []);

        await service.clearProfileData(PROFILE_A);

        await expect(service.exclusionsCache.get(PROFILE_A)).resolves.toBeUndefined();
        await expect(service.dnsBackup.get(PROFILE_B)).resolves.toEqual([]);
    });

    it('should be a no-op for an unknown profile', async () => {
        await expect(service.clearProfileData('unknown')).resolves.toBeUndefined();
    });

    it('should not resurrect a deleted profile via a late set', async () => {
        await service.dnsBackup.set(PROFILE_A, []);
        await service.clearProfileData(PROFILE_A);

        // A late set enqueued after cleanup must not re-add the profile's data.
        await service.dnsBackup.set(PROFILE_A, []);

        await expect(service.dnsBackup.get(PROFILE_A)).resolves.toBeUndefined();
    });

    it('should not resurrect a deleted profile via a late snapshot set', async () => {
        await service.exclusionsSnapshots.set(PROFILE_A, { regular: [], selective: [] });
        await service.clearProfileData(PROFILE_A);

        await service.exclusionsSnapshots.set(PROFILE_A, { regular: [], selective: [] });

        await expect(service.exclusionsSnapshots.get(PROFILE_A)).resolves.toBeUndefined();
    });

    it('should not resurrect a deleted profile via a late cache create', async () => {
        await service.clearProfileData(PROFILE_A);
        const factory = vi.fn(() => Promise.resolve({} as ProfileExclusionsEntry));

        const entry = service.exclusionsCache.getOrCreate(PROFILE_A, factory);

        expect(entry).toBeUndefined();
        expect(factory).not.toHaveBeenCalled();
        await expect(service.exclusionsCache.get(PROFILE_A)).resolves.toBeUndefined();
    });

    it('should keep clearing other stores when a session delete fails', async () => {
        await service.exclusionsCache.set(PROFILE_A, Promise.resolve({} as ProfileExclusionsEntry));
        await service.dnsBackup.set(PROFILE_A, []);
        await service.exclusionsSnapshots.set(PROFILE_A, { regular: [], selective: [] });

        // Defensive: StateStorage.setItem swallows failures today, so this
        // rejection cannot come from production — the test only verifies the
        // catch in clearProfileData does not block the remaining stores.
        const deleteSpy = vi
            .spyOn(service.dnsBackup, 'delete')
            .mockRejectedValueOnce(new Error('boom'));

        await service.clearProfileData(PROFILE_A);

        expect(deleteSpy).toHaveBeenCalledWith(PROFILE_A);
        await expect(service.exclusionsCache.get(PROFILE_A)).resolves.toBeUndefined();
        await expect(service.exclusionsSnapshots.get(PROFILE_A)).resolves.toBeUndefined();

        deleteSpy.mockRestore();
    });

    it('should not lose writes when two stores share a queue', async () => {
        const { createStore } = createSharedStorage();
        const storeA = createStore();
        const storeB = createStore();

        await Promise.all([
            storeA.set('p1', ['a']),
            storeB.set('p2', ['b']),
        ]);

        await expect(storeA.get('p1')).resolves.toEqual(['a']);
        await expect(storeB.get('p2')).resolves.toEqual(['b']);
    });

    it('should apply a delete after a preceding set in FIFO order', async () => {
        const { createStore } = createSharedStorage();
        const store = createStore();

        const setPromise = store.set('p1', ['a']);
        const deletePromise = store.delete('p1');
        await Promise.all([setPromise, deletePromise]);

        await expect(store.get('p1')).resolves.toBeUndefined();
    });

    it('should not treat prototype keys as own data', async () => {
        await service.dnsBackup.set(PROFILE_A, []);

        await expect(service.dnsBackup.get('toString')).resolves.toBeUndefined();

        await service.dnsBackup.delete('toString');

        await expect(service.dnsBackup.get(PROFILE_A)).resolves.toEqual([]);
    });
});
