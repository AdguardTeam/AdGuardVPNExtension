import { type StorageInterface } from '../browserApi/storage';

/**
 * Locations tab.
 */
export enum LocationsTab {
    All = 'all',
    Saved = 'saved',
}

/**
 * SavedLocations interface.
 */
export interface SavedLocationsInterface {
    /**
     * Retrieves locations tab from local storage. If it doesn't exist or corrupted - sets default value.
     *
     * @returns Locations tab.
     */
    getLocationsTab(): Promise<LocationsTab>;

    /**
     * Sets locations tab in local storage.
     *
     * @param locationsTab New locations tab.
     */
    saveLocationsTab(locationsTab: LocationsTab): Promise<void>;
}

/**
 * Constructor parameters for {@link SavedLocations}.
 */
export interface SavedLocationsParameters {
    /**
     * Browser local storage.
     */
    storage: StorageInterface;
}

/**
 * Saved locations service.
 */
export class SavedLocations implements SavedLocationsInterface {
    /**
     * Key for saved locations in local storage.
     */
    private static readonly LOCATIONS_TAB_KEY = 'locations.tab';

    /**
     * Default locations tab after installation.
     */
    private static readonly DEFAULT_LOCATIONS_TAB = LocationsTab.All;

    /**
     * Browser local storage.
     */
    private storage: StorageInterface;

    /**
     * Cached locations tab.
     *
     * Lazy-loaded in {@link getLocationsTab} method.
     */
    private locationsTab!: LocationsTab;

    /**
     * Constructor.
     */
    constructor({
        storage,
    }: SavedLocationsParameters) {
        this.storage = storage;
    }

    /**
     * Retrieves locations tab from local storage. If it doesn't exist or corrupted - sets default value.
     *
     * @returns Locations tab.
     */
    public getLocationsTab = async (): Promise<LocationsTab> => {
        // If already in memory - return it
        if (this.locationsTab) {
            return this.locationsTab;
        }

        let storageLocationsTab = await this.storage.get<LocationsTab>(SavedLocations.LOCATIONS_TAB_KEY);

        // Sets default value if it doesn't exist or corrupted in local storage
        if (!storageLocationsTab || !Object.values(LocationsTab).includes(storageLocationsTab)) {
            storageLocationsTab = SavedLocations.DEFAULT_LOCATIONS_TAB;
            await this.saveLocationsTab(storageLocationsTab);
        }

        // Save in memory and return
        this.locationsTab = storageLocationsTab;
        return this.locationsTab;
    };

    /**
     * Saves locations tab in local storage.
     *
     * @param locationsTab New locations tab.
     */
    public saveLocationsTab = async (locationsTab: LocationsTab): Promise<void> => {
        this.locationsTab = locationsTab;
        await this.storage.set(SavedLocations.LOCATIONS_TAB_KEY, this.locationsTab);
    };
}
