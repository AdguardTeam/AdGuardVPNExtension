import { log } from '../../../common/logger';
import { type DnsServerData, type ExclusionsSnapshot, StorageKey } from '../../schema';
import { StateData } from '../../stateStorage';
import { type ProfileExclusionsEntry } from '../../exclusions/profileExclusionsTypes';

import { InMemoryProfileStore } from './InMemoryProfileStore';
import { SessionProfileStore } from './SessionProfileStore';
import { type ProfileStore, type ProfileStoreCleaner } from './ProfileStore';

/**
 * Single owner of all temporary per-profile data (in-memory and session).
 *
 * Stores created via {@link createStore} are registered for cleanup,
 * so {@link clearProfileData} clears every registered store. A store added
 * as a plain field instead of through {@link createStore} is silently
 * skipped — always use {@link createStore}.
 */
export class ProfileStateService {
    /**
     * All per-profile stores iterated by {@link clearProfileData}.
     */
    private readonly stores: Array<{ name: string; store: ProfileStoreCleaner }> = [];

    /**
     * Profile IDs deleted during this process lifetime (tombstones).
     * Writes for these IDs are rejected, closing the set-after-delete
     * resurrection window. Profile IDs are generated with nanoid and are not reused,
     * so tombstones need no expiry and are dropped on SW restart.
     */
    private readonly deletedProfileIds = new Set<string>();

    private readonly canWrite = (profileId: string): boolean => !this.deletedProfileIds.has(profileId);

    /**
     * Session state of all per-profile runtime data.
     */
    private readonly profileSessionState = new StateData(StorageKey.ProfileSessionState);

    /**
     * Exclusions cache. In-memory only (contains non-serializable handlers).
     */
    public readonly exclusionsCache = this.createStore(
        'exclusionsCache',
        new InMemoryProfileStore<Promise<ProfileExclusionsEntry>>(this.canWrite),
    );

    /**
     * Custom DNS servers backups. Session storage.
     */
    public readonly dnsBackup = this.createStore(
        'dnsBackup',
        new SessionProfileStore<DnsServerData[]>(
            async () => (await this.profileSessionState.get()).dnsBackup,
            async (data) => { await this.profileSessionState.update({ dnsBackup: data }); },
            this.canWrite,
        ),
    );

    /**
     * Exclusions undo snapshots. Session storage.
     */
    public readonly exclusionsSnapshots = this.createStore(
        'exclusionsSnapshots',
        new SessionProfileStore<ExclusionsSnapshot>(
            async () => (await this.profileSessionState.get()).exclusionsSnapshots,
            async (data) => { await this.profileSessionState.update({ exclusionsSnapshots: data }); },
            this.canWrite,
        ),
    );

    /**
     * Registers a store in the cleanup list and returns it.
     * The concrete store type is preserved so callers can use
     * store-specific methods (e.g. {@link InMemoryProfileStore.getOrCreate}).
     *
     * @param name Store name (used in logs).
     * @param store Store to register.
     * @returns The same store.
     */
    private createStore<T extends ProfileStore<unknown>>(
        name: string,
        store: T,
    ): T {
        this.stores.push({ name, store });
        return store;
    }

    /**
     * Removes all runtime data (in-memory and session) of the given profile.
     * A failure while clearing one store is logged and does not stop the rest.
     *
     * Stores are cleared in parallel: session stores serialize themselves
     * through their shared queue, so parallel deletes cannot overwrite
     * each other on the common storage key.
     *
     * @param profileId Profile ID to remove.
     */
    public async clearProfileData(profileId: string): Promise<void> {
        this.deletedProfileIds.add(profileId);

        await Promise.all(
            this.stores.map(async ({ name, store }) => {
                try {
                    await store.delete(profileId);
                } catch (e) {
                    log.error(`[vpn.ProfileStateService.clearProfileData]: Failed to clear store "${name}" for profile "${profileId}"`, e);
                }
            }),
        );
    }
}
