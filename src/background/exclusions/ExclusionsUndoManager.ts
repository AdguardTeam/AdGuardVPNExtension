import { type ExclusionInterface, StorageKey } from '../schema';
import { StateData } from '../stateStorage';

/**
 * Snapshot of a profile's exclusions at a point in time.
 */
export interface ExclusionsSnapshot {
    regular: ExclusionInterface[];
    selective: ExclusionInterface[];
}

/**
 * Manages undo snapshots for exclusion mutations.
 * Each profile can have at most one saved snapshot at a time.
 */
export class ExclusionsUndoManager {
    /**
     * Persistent state storage for undo snapshots.
     */
    private state = new StateData(StorageKey.ExclusionsState);

    /**
     * Saves a snapshot of the current exclusions for a profile.
     * Overwrites any existing snapshot for that profile.
     *
     * @param profileId Profile ID to save snapshot for.
     * @param regular Current regular mode exclusions.
     * @param selective Current selective mode exclusions.
     */
    public async saveSnapshot(
        profileId: string,
        regular: ExclusionInterface[],
        selective: ExclusionInterface[],
    ): Promise<void> {
        const snapshot: ExclusionsSnapshot = {
            regular: [...regular],
            selective: [...selective],
        };
        const { previousExclusionsMap = {} } = await this.state.get();
        await this.state.update({
            previousExclusionsMap: { ...previousExclusionsMap, [profileId]: snapshot },
        });
    }

    /**
     * Retrieves and removes the saved snapshot for a profile.
     * Returns null if no snapshot exists.
     *
     * @param profileId Profile ID to retrieve snapshot for.
     */
    public async popSnapshot(profileId: string): Promise<ExclusionsSnapshot | null> {
        const { previousExclusionsMap = {} } = await this.state.get();
        const snapshot = previousExclusionsMap[profileId];

        if (!snapshot) {
            return null;
        }

        const rest = { ...previousExclusionsMap };
        delete rest[profileId];
        await this.state.update({ previousExclusionsMap: rest });

        return snapshot;
    }
}
