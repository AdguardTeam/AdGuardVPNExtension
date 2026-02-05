import {
    action,
    computed,
    observable,
    runInAction,
    toJS,
} from 'mobx';

import { messenger } from '../../common/messenger';
import { translator } from '../../common/translator';
import type { LocationDto } from '../../background/endpoints/LocationDto';
import type { VpnExtensionInfoInterface } from '../../common/schema/endpoints/vpnInfo';
import { daysToRenewal } from '../../common/utils/date';
import { animationService } from '../components/Settings/BackgroundAnimation/animationStateMachine';
import { AnimationEvent } from '../constants';
import { type ForwarderUrlQueryKey } from '../../background/config';
import { LocationsTab } from '../../background/endpoints/locationsEnums';
import { containsIgnoreCase } from '../../common/components/SearchHighlighter/helpers';

import type { RootStore } from './RootStore';

export interface LocationData extends LocationDto {
    selected: boolean;
    saved?: boolean;
}

export class VpnStore {
    rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    /**
     * List of all locations.
     */
    @observable locations: LocationData[] = [];

    /**
     * List of so-called cached fastest locations — actually the list of previously calculated fastest locations.
     * but with pruned ping values to display them while pings are recalculating.
     *
     * Needed to avoid skeleton displaying instead of the fastest locations list.
     */
    @observable cachedFastestLocations: LocationData[] = [];

    @observable selectedLocation: LocationData;

    @observable searchValue = '';

    @observable vpnInfo: VpnExtensionInfoInterface | null = null;

    @observable tooManyDevicesConnected = false;

    @observable maxDevicesAllowed: number | null = null;

    @observable isPremiumToken: boolean;

    /**
     * Locations tab.
     */
    @observable locationsTab: LocationsTab;

    /**
     * Set of saved location IDs.
     */
    @observable savedLocationIds: Set<string> = new Set();

    @action setSearchValue = (value: string): void => {
        // do not trim, or change logic see issue AG-2233
        this.searchValue = value;
    };

    @action setLocations = (locations: LocationData[]): void => {
        if (!locations) {
            return;
        }

        this.locations = locations;
    };

    @action selectLocation = async (id: string): Promise<void> => {
        animationService.send(AnimationEvent.LocationSelected);

        const selectedLocation = this.locations.find((location) => {
            return location.id === id;
        });

        if (!selectedLocation) {
            throw new Error(`No endpoint with id: '${id}' found`);
        }

        await messenger.setCurrentLocation(toJS(selectedLocation), true);
        runInAction(() => {
            this.selectedLocation = { ...selectedLocation };
        });
    };

    @action setSelectedLocation = (location: LocationData): void => {
        if (!location) {
            return;
        }
        if (!this.selectedLocation
            || (this.selectedLocation && this.selectedLocation.id !== location.id)) {
            this.selectedLocation = { ...location };
        }
    };

    @computed
    get filteredLocations(): LocationData[] {
        const locations = this.locations || [];

        return locations
            .filter((location) => {
                // If searching, we search from all locations (not depending on the all / saved tab)
                if (this.showSearchResults) {
                    return containsIgnoreCase(location.cityName, this.searchValue)
                        || containsIgnoreCase(location.countryCode, this.searchValue)
                        || containsIgnoreCase(location.countryName, this.searchValue);
                }

                // Include if it's a all tab or if it's a saved tab and the location is saved
                return !this.isSavedLocationsTab || this.savedLocationIds.has(location.id);
            })
            .map((location) => {
                const enrichedLocation = this.enrichWithStateData(location);
                const selected = this.selectedLocation && this.selectedLocation.id === location.id;

                return <LocationData>{ ...enrichedLocation, selected };
            })
            .sort((a, b) => {
                const compareCountryName = a.countryName.localeCompare(b.countryName);

                // If country names are different, sort by country name
                if (compareCountryName !== 0) {
                    return compareCountryName;
                }

                // If country names are the same, sort by city name
                return a.cityName.localeCompare(b.cityName);
            });
    }

    /**
     * Enriches location with saved status.
     * Ping and availability values come directly from the backend via location object.
     *
     * @param location Base location data.
     *
     * @returns Location with saved status.
     */
    enrichWithStateData = (location: LocationData): LocationData => {
        const saved = this.savedLocationIds.has(location.id);
        return { ...location, saved };
    };

    /**
     * Calculated the fastest of all locations, prunes their pings,
     * and sets a new list to {@link cachedFastestLocations}.
     */
    @action setCachedFastestLocations = (): void => {
        this.cachedFastestLocations = this.calculateFastestLocations(this.locations).map((location) => {
            return { ...location, ping: null };
        });
    };

    /**
     * Sets the value of {@link cachedFastestLocations} to empty array.
     */
    @action resetCachedFastestLocations = (): void => {
        this.cachedFastestLocations = [];
    };

    /**
     * Calculates the fastest location based on passed `locations` list.
     *
     * @param locations List of locations to calculate the fastest from.
     *
     * @returns List of 3 fastest locations.
     */
    calculateFastestLocations = (locations: LocationData[]): LocationData[] => {
        const FASTEST_LOCATIONS_COUNT = 3;
        const sortedLocations = locations
            .map(this.enrichWithStateData)
            .filter((location) => location.ping)
            .sort((a, b) => Number(a.ping) - Number(b.ping))
            .map((location) => {
                if (this.selectedLocation && this.selectedLocation.id === location.id) {
                    return { ...location, selected: true };
                }
                return { ...location };
            });
        // display fastest if
        // pings number is equal to endpoints number
        if (sortedLocations.length === locations.length) {
            return sortedLocations.slice(0, FASTEST_LOCATIONS_COUNT);
        }
        // there are more than three pings ready
        if (sortedLocations.length >= FASTEST_LOCATIONS_COUNT) {
            return sortedLocations.slice(0, FASTEST_LOCATIONS_COUNT);
        }
        return [];
    };

    /**
     * Returns the list of fastest locations to display.
     *
     * If pings are recalculating, returns the list of cached fastest locations if they were calculated before.
     * Otherwise, calculates the fastest locations based on {@link locations} list.
     */
    @computed
    get fastestLocationsToDisplay(): LocationData[] {
        const locations = this.locations || [];

        if (this.rootStore.settingsStore.arePingsRecalculating
            && this.cachedFastestLocations.length > 0) {
            return this.cachedFastestLocations;
        }

        return this.calculateFastestLocations(locations);
    }

    @computed
    get countryNameToDisplay(): string {
        return this.selectedLocation?.countryName;
    }

    @computed
    get countryCodeToDisplay(): string {
        return this.selectedLocation?.countryCode;
    }

    @computed
    get cityNameToDisplay(): string {
        if (this.selectedLocation?.virtual) {
            return `${this.selectedLocation?.cityName} (${translator.getMessage('endpoints_location_virtual')})`;
        }
        return this.selectedLocation?.cityName;
    }

    @action setVpnInfo = (vpnInfo: VpnExtensionInfoInterface): void => {
        if (!vpnInfo) {
            return;
        }
        this.vpnInfo = vpnInfo;
    };

    @computed
    get bandwidthFreeMbits(): number | null {
        if (!this.vpnInfo || !this.vpnInfo.bandwidthFreeMbits) {
            return null;
        }
        return this.vpnInfo.bandwidthFreeMbits;
    }

    @computed
    get premiumPromoEnabled(): boolean | null {
        if (!this.vpnInfo?.premiumPromoEnabled) {
            return null;
        }
        return this.vpnInfo.premiumPromoEnabled;
    }

    @computed
    get premiumPromoPage(): string | null {
        if (!this.vpnInfo?.premiumPromoPage) {
            return null;
        }
        return this.vpnInfo.premiumPromoPage;
    }

    @computed
    get remainingTraffic(): number {
        if (this.vpnInfo?.maxDownloadedBytes === undefined || this.vpnInfo?.usedDownloadedBytes === undefined) {
            return 0;
        }

        return this.vpnInfo.maxDownloadedBytes - this.vpnInfo.usedDownloadedBytes;
    }

    @computed
    get daysToTrafficRenewal(): number {
        if (!this.vpnInfo?.renewalTrafficDate) {
            return 0;
        }
        return daysToRenewal(new Date(), this.vpnInfo.renewalTrafficDate);
    }

    @computed
    get trafficUsingProgress(): number {
        const HUNDRED_PERCENT = 100;

        if (!this.vpnInfo?.maxDownloadedBytes) {
            return HUNDRED_PERCENT;
        }

        return Math.floor((this.remainingTraffic / this.vpnInfo.maxDownloadedBytes) * HUNDRED_PERCENT);
    }

    @computed
    get showSearchResults(): boolean {
        return this.searchValue.length > 0;
    }

    @computed
    get isSavedLocationsTab(): boolean {
        return this.locationsTab === LocationsTab.Saved;
    }

    @computed
    get notSearchingAndSavedTab(): boolean {
        return !this.showSearchResults && !this.isSavedLocationsTab;
    }

    @action
    setIsPremiumToken(isPremiumToken: boolean): void {
        this.isPremiumToken = isPremiumToken;
    }

    @action
    async requestIsPremiumToken(): Promise<void> {
        const isPremiumToken = await messenger.checkIsPremiumToken();
        runInAction(() => {
            this.isPremiumToken = isPremiumToken;
        });
    }

    @computed
    get selectedLocationPing(): number | null {
        if (!this.locations) {
            return null;
        }

        const selectedLocationId = this.selectedLocation?.id;
        const currentLocation = this.locations.find((location) => {
            return location.id === selectedLocationId;
        });

        // Return selected location ping if it's missing from locations list (AG-3184)
        if (!currentLocation) {
            return this.selectedLocation?.ping || null;
        }

        return currentLocation?.ping || null;
    }

    /**
     * Opens Premium Promo Page in new tab.
     */
    openPremiumPromoPage = async (): Promise<void> => {
        await messenger.openPremiumPromoPage();
    };

    /**
     * Opens Subscribe Promo Page in new tab.
     */
    openSubscribePromoPage = async (): Promise<void> => {
        await messenger.openSubscribePromoPage();
    };

    /**
     * Opens forwarder URL in new tab by appending email query param if user is logged in.
     *
     * @param forwarderUrlQueryKey Forwarder query key.
     */
    openForwarderUrlWithEmail = async (forwarderUrlQueryKey: ForwarderUrlQueryKey): Promise<void> => {
        await messenger.openForwarderUrlWithEmail(forwarderUrlQueryKey);
    };

    @action setTooManyDevicesConnected = (state: boolean): void => {
        this.tooManyDevicesConnected = state;
    };

    @action setMaxDevicesAllowed = (maxDevicesAllowed: number): void => {
        this.maxDevicesAllowed = maxDevicesAllowed;
    };

    /**
     * Forces update of locations list from server
     * and updates locations list in store.
     *
     * @returns Promise of Forcibly updated locations list.
     */
    forceUpdateLocations = async (): Promise<LocationData[]> => {
        const locations = await messenger.forceUpdateLocations() as LocationData[];
        return locations;
    };

    /**
     * Sets locations tab to the store.
     *
     * @param locationsTab New locations tab.
     */
    @action setLocationsTab = (locationsTab: LocationsTab): void => {
        this.locationsTab = locationsTab;
    };

    /**
     * Saves locations tab in local storage and sets it to the store.
     *
     * @param locationsTab New locations tab.
     */
    @action saveLocationsTab = async (locationsTab: LocationsTab): Promise<void> => {
        // Do nothing if the tab is the same
        if (this.locationsTab === locationsTab) {
            return;
        }

        await messenger.saveLocationsTab(locationsTab);
        runInAction(() => {
            this.setLocationsTab(locationsTab);
        });
    };

    /**
     * Sets saved location IDs to the store.
     *
     * @param savedLocationIds Saved location IDs.
     */
    @action setSavedLocationIds = (savedLocationIds: string[]): void => {
        this.savedLocationIds = new Set(savedLocationIds);
    };

    /**
     * Adds saved location by its ID.
     *
     * @param locationId Location ID to add.
     */
    @action addSavedLocation = async (locationId: string): Promise<void> => {
        if (this.savedLocationIds.has(locationId)) {
            return;
        }

        await messenger.addSavedLocation(locationId);
        runInAction(() => {
            this.savedLocationIds.add(locationId);
        });
    };

    /**
     * Removes saved location by its ID.
     *
     * @param locationId Location ID to remove.
     */
    @action removeSavedLocation = async (locationId: string): Promise<void> => {
        if (!this.savedLocationIds.has(locationId)) {
            return;
        }

        await messenger.removeSavedLocation(locationId);
        runInAction(() => {
            this.savedLocationIds.delete(locationId);
        });
    };

    /**
     * Toggles saved location by its ID.
     *
     * @param locationId Location ID to toggle.
     * @returns Promise with true if location was added, false if location was removed.
     */
    @action toggleSavedLocation = async (locationId: string): Promise<boolean> => {
        if (this.savedLocationIds.has(locationId)) {
            this.removeSavedLocation(locationId);
            return false;
        }

        this.addSavedLocation(locationId);
        return true;
    };
}
