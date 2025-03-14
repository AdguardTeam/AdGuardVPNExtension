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
     * Retrieves locations tab from local storage.
     * If it doesn't exist or corrupted - sets default value.
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

    /**
     * Retrieves saved location IDs from local storage.
     * If it doesn't exist or corrupted - initializes empty array.
     *
     * @returns Saved location IDs.
     */
    getSavedLocationIds(): Promise<string[]>;

    /**
     * Adds new location to saved locations.
     *
     * @param locationId Location ID to add.
     */
    addSavedLocation(locationId: string): Promise<void>;

    /**
     * Removes location from saved locations.
     *
     * @param locationId Location ID to remove.
     */
    removeSavedLocation(locationId: string): Promise<void>;
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
     * Key for saved location IDs in local storage.
     */
    private static readonly SAVED_LOCATION_IDS_KEY = 'saved.location.ids';

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
     * Cached saved location IDs.
     *
     * Lazy-loaded in {@link getSavedLocationIds} method.
     */
    private savedLocationIds!: string[];

    /**
     * Constructor.
     */
    constructor({
        storage,
    }: SavedLocationsParameters) {
        this.storage = storage;
    }

    /**
     * Retrieves locations tab from local storage.
     * If it doesn't exist or corrupted - sets default value.
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

    /**
     * Retrieves saved location IDs from local storage.
     * If it doesn't exist or corrupted - initializes empty array.
     *
     * @returns Saved location IDs.
     */
    public getSavedLocationIds = async (): Promise<string[]> => {
        // If already in memory - return it
        if (this.savedLocationIds) {
            return this.savedLocationIds;
        }

        let storageSavedLocationIds = await this.storage.get<string[]>(SavedLocations.SAVED_LOCATION_IDS_KEY);

        // Sets default value if it doesn't exist or corrupted in local storage
        if (!storageSavedLocationIds || !Array.isArray(storageSavedLocationIds)) {
            storageSavedLocationIds = [];
            await this.saveSavedLocationIds(storageSavedLocationIds);
        }

        // Save in memory and return
        this.savedLocationIds = storageSavedLocationIds;
        return this.savedLocationIds;
    };

    /**
     * Adds new location to saved locations.
     *
     * @param locationId Location ID to add.
     */
    public addSavedLocation = async (locationId: string): Promise<void> => {
        const savedLocations = await this.getSavedLocationIds();
        const index = savedLocations.indexOf(locationId);

        // Add location if it doesn't exist
        if (index === -1) {
            savedLocations.push(locationId);
            await this.saveSavedLocationIds(savedLocations);
        }
    };

    /**
     * Removes location from saved locations.
     *
     * @param locationId Location ID to remove.
     */
    public removeSavedLocation = async (locationId: string): Promise<void> => {
        const savedLocations = await this.getSavedLocationIds();
        const index = savedLocations.indexOf(locationId);

        // Remove location if it exists
        if (index !== -1) {
            savedLocations.splice(index, 1);
            await this.saveSavedLocationIds(savedLocations);
        }
    };

    /**
     * Saves saved location IDs in local storage.
     *
     * @param savedLocations New saved location IDs.
     */
    private async saveSavedLocationIds(savedLocations: string[]): Promise<void> {
        this.savedLocationIds = savedLocations;
        await this.storage.set(SavedLocations.SAVED_LOCATION_IDS_KEY, this.savedLocationIds);
    }
}
