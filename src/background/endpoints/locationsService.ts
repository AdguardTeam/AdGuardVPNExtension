import isEmpty from 'lodash/isEmpty';

import { log } from '../../common/logger';
import { notifier } from '../../common/notifier';
import { vpnProvider } from '../providers/vpnProvider';
import { SETTINGS_IDS } from '../../common/constants';
// eslint-disable-next-line import/no-cycle
import { settings } from '../settings';
import { type LocationInterface, type EndpointInterface, StorageKey } from '../schema';
import { StateData } from '../stateStorage';
import { type StorageInterface } from '../browserApi/storage';
import { browserApi } from '../browserApi';

import { Location } from './Location';
import { LocationWithPing } from './LocationWithPing';
import { LocationsTab } from './locationsEnums';

interface LocationsServiceInterface {
    getIsLocationSelectedByUser(): Promise<boolean>;
    getLocationsFromServer(appId: string, vpnToken: string): Promise<Location[]>;
    updateSelectedLocation(): Promise<LocationInterface | null>;
    getEndpointByLocation(
        location: LocationInterface,
        forcePrevEndpoint?: boolean,
    ): Promise<EndpointInterface | null>;
    getLocationByEndpoint(endpointId: string): Promise<LocationInterface | null>;
    getLocationsWithPing(): Promise<LocationWithPing[]>;
    setSelectedLocation(id: string, isLocationSelectedByUser?: boolean): Promise<void>;
    getSelectedLocation(): Promise<LocationInterface | null>;
    getLocations(): Promise<LocationInterface[]>;
    getEndpoint(
        location: LocationInterface,
        forcePrevEndpoint: boolean,
    ): Promise<EndpointInterface | null>;

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
}

/**
 * Constructor parameters for {@link LocationsService}.
 */
export interface LocationsServiceParameters {
    /**
     * Browser local storage.
     */
    storage: StorageInterface;
}

export class LocationsService implements LocationsServiceInterface {
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
    private locationsTab: LocationsTab | null = null;

    /**
     * Locations service state data.
     * Used to save and retrieve locations state from session storage,
     * in order to persist it across service worker restarts.
     */
    private locationsState = new StateData(StorageKey.LocationsService);

    /**
     * Constructor.
     */
    constructor({
        storage,
    }: LocationsServiceParameters) {
        this.storage = storage;
    }

    /**
     * Gets all available VPN location instances.
     *
     * @returns Locations instances.
     */
    getLocations = async (): Promise<LocationInterface[]> => {
        const { locations } = await this.locationsState.get();
        return locations;
    };

    /**
     * Sets location available state
     * @param location
     * @param state
     */
    setLocationAvailableState = (location: LocationInterface, state: boolean): void => {
        // eslint-disable-next-line no-param-reassign
        location.available = state;
    };

    /**
     * Sets location ping
     * @param location
     * @param ping
     */
    setLocationPing = (location: LocationInterface, ping: number | null): void => {
        // eslint-disable-next-line no-param-reassign
        location.ping = ping;
    };

    /**
     * Sets location endpoint
     * @param location
     * @param endpoint
     */
    setLocationEndpoint = (
        location: LocationInterface,
        endpoint: EndpointInterface | null,
    ): void => {
        if (!endpoint) {
            return;
        }
        // eslint-disable-next-line no-param-reassign
        location.endpoint = endpoint;
    };

    /**
     * Gets locations wrapped for UI display.
     * Extracts only the fields needed for the UI from full Location objects.
     *
     * @returns Locations wrapped as LocationWithPing for UI consumption.
     */
    getLocationsWithPing = async (): Promise<LocationWithPing[]> => {
        const { locations } = await this.locationsState.get();
        return locations.map((location: LocationInterface) => new LocationWithPing(location));
    };

    /**
     * Actualizes selected location data.
     *
     * @returns selected location if it's endpoint was updated.
     */
    updateSelectedLocation = async (): Promise<LocationInterface | null> => {
        const { selectedLocation, locations } = await this.locationsState.get();
        if (!selectedLocation) {
            return null;
        }

        const oldSelectedLocation = selectedLocation;
        const actualSelectedLocation = locations.find((location) => {
            return location.id === selectedLocation?.id;
        });

        const updatedSelectedLocation = actualSelectedLocation || oldSelectedLocation;
        await this.locationsState.update({ selectedLocation: updatedSelectedLocation });

        if (oldSelectedLocation?.endpoint?.id && updatedSelectedLocation?.endpoint?.id
            && oldSelectedLocation.endpoint.id !== updatedSelectedLocation.endpoint.id) {
            return updatedSelectedLocation;
        }

        return null;
    };

    setLocations = async (newLocations: LocationInterface[]): Promise<void> => {
        await this.locationsState.update({ locations: newLocations });

        notifier.notifyListeners(
            notifier.types.LOCATIONS_UPDATED,
            await this.getLocationsWithPing(),
        );
    };

    /**
     * Retrieves locations from server.
     *
     * @param appId
     * @param vpnToken
     *
     * @returns Locations from server.
     */
    getLocationsFromServer = async (appId: string, vpnToken: string): Promise<Location[]> => {
        const locationsData = await vpnProvider.getLocationsData(appId, vpnToken);

        const locations = locationsData.map((locationData: LocationInterface) => {
            return new Location(locationData);
        });

        // During endpoint deployments, api can return empty list of locations
        // thus we continue to use locations from memory
        if (!isEmpty(locations)) {
            await this.setLocations(locations);
        } else {
            log.debug('[vpn.LocationsService]: Api returned empty list of locations', locations);
        }

        return locations;
    };

    /**
     * Gets an endpoint for a location.
     * Returns the previously selected endpoint if forcePrevEndpoint is true and one exists,
     * otherwise returns the first available endpoint.
     *
     * @param location Location to get endpoint for.
     * @param forcePrevEndpoint Force using previously selected endpoint.
     *
     * @returns Promise with endpoint, or null if location has no endpoints.
     */
    getEndpoint = async (
        location: LocationInterface,
        forcePrevEndpoint: boolean,
    ): Promise<EndpointInterface | null> => {
        if (!location) {
            return null;
        }

        // Use previously selected endpoint if requested and available
        if (forcePrevEndpoint && location.endpoint) {
            return location.endpoint;
        }

        // Return first endpoint from the list
        const endpoint = location.endpoints[0] || null;
        this.setLocationEndpoint(location, endpoint);

        return endpoint;
    };

    /**
     * Gets endpoint for a specific location by its ID.
     *
     * @param location Location to get endpoint for.
     * @param forcePrevEndpoint Force using previously selected endpoint.
     *
     * @returns Promise with endpoint by location id.
     */
    getEndpointByLocation = async (
        location: LocationInterface,
        forcePrevEndpoint: boolean = false,
    ): Promise<EndpointInterface | null> => {
        const { locations } = await this.locationsState.get();
        let targetLocation: LocationInterface | undefined = location;

        // This could be empty on extension restart, but after we try to use the most fresh data
        if (locations && locations.length > 0) {
            targetLocation = locations.find((l) => {
                return l.id === location.id;
            });
        }

        if (!targetLocation) {
            return null;
        }

        return this.getEndpoint(targetLocation, forcePrevEndpoint);
    };

    /**
     * Finds a location that contains the specified endpoint.
     *
     * @param endpointId Endpoint id.
     *
     * @returns Location by endpoint id.
     */
    getLocationByEndpoint = async (endpointId: string): Promise<LocationInterface | null> => {
        if (!endpointId) {
            return null;
        }

        const { locations } = await this.locationsState.get();
        const location = locations.find((location) => {
            return location.endpoints.some((endpoint) => endpoint.id === endpointId);
        });

        return location || null;
    };

    /**
     * Persists selected location in the memory and storage
     * @param id - Location id
     * @param isLocationSelectedByUser - Flag indicating that location was selected by user
     */
    setSelectedLocation = async (id: string, isLocationSelectedByUser = false): Promise<void> => {
        const { locations } = await this.locationsState.get();

        const newSelectedLocation = locations.find((location) => location.id === id) || null;

        await this.locationsState.update({ selectedLocation: newSelectedLocation });
        await settings.setSetting(SETTINGS_IDS.SELECTED_LOCATION_KEY, newSelectedLocation);

        if (isLocationSelectedByUser) {
            await settings.setSetting(
                SETTINGS_IDS.LOCATION_SELECTED_BY_USER_KEY,
                isLocationSelectedByUser,
            );
        }
    };

    getIsLocationSelectedByUser = async (): Promise<boolean> => {
        const isLocationSelectedByUser = await settings.getSetting(
            SETTINGS_IDS.LOCATION_SELECTED_BY_USER_KEY,
        );
        return isLocationSelectedByUser;
    };

    /**
     * When we connect to the location there is no time to find better location.
     *
     * @returns Promise with null or selected location.
     */
    getSelectedLocation = async (): Promise<LocationInterface | null> => {
        let { selectedLocation } = await this.locationsState.get();

        if (!selectedLocation) {
            // eslint-disable-next-line max-len
            const storedSelectedLocation = await settings.getSetting(SETTINGS_IDS.SELECTED_LOCATION_KEY);

            if (!storedSelectedLocation) {
                return null;
            }

            selectedLocation = new Location(storedSelectedLocation);
            await this.locationsState.update({ selectedLocation });
        }

        return selectedLocation;
    };

    /**
     * Retrieves locations tab from local storage.
     * If it doesn't exist or corrupted - sets default value.
     *
     * @returns Promise with locations tab.
     */
    public getLocationsTab = async (): Promise<LocationsTab> => {
        // If already in memory - return it
        if (this.locationsTab) {
            return this.locationsTab;
        }

        let storageLocationsTab = await this.storage.get<LocationsTab>(LocationsService.LOCATIONS_TAB_KEY);

        // Sets default value if it doesn't exist or corrupted in local storage
        if (!storageLocationsTab || !Object.values(LocationsTab).includes(storageLocationsTab)) {
            storageLocationsTab = LocationsService.DEFAULT_LOCATIONS_TAB;
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
        await this.storage.set(LocationsService.LOCATIONS_TAB_KEY, this.locationsTab);
    };
}

export const locationsService = new LocationsService({
    storage: browserApi.storage,
});
