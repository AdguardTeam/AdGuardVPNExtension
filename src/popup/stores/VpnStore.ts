import {
    action,
    computed,
    observable,
    runInAction,
    toJS,
} from 'mobx';

import { messenger } from '../../lib/messenger';
import { translator } from '../../common/translator';
import { animationService } from '../components/Settings/BackgroundAnimation/animationStateMachine';
import { AnimationEvent } from '../../lib/constants';
import { LocationWithPing } from '../../background/endpoints/LocationWithPing';
import { PingData } from '../../background/endpoints/locationsService';
import type { VpnExtensionInfoInterface } from '../../common/schema/endpoints/vpnInfo';
import type { RootStore } from './RootStore';
import { daysToRenewal } from '../../common/utils/date';

interface Pings {
    [key: string]: PingData,
}

interface LocationState extends PingData {
    locationId: string;
}

export interface LocationData extends LocationWithPing {
    selected: boolean;
}

export class VpnStore {
    rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    @observable locations: LocationData[] = [];

    @observable pings: Pings = {};

    @observable selectedLocation: LocationData;

    @observable searchValue = '';

    @observable vpnInfo: VpnExtensionInfoInterface | null = null;

    @observable tooManyDevicesConnected = false;

    @observable maxDevicesAllowed: number | null = null;

    @observable isPremiumToken: boolean;

    @action setSearchValue = (value: string) => {
        // do not trim, or change logic see issue AG-2233
        this.searchValue = value;
    };

    @action setLocations = (locations: LocationData[]): void => {
        if (!locations) {
            return;
        }

        this.locations = locations;
    };

    @action updateLocationState = (state: LocationState): void => {
        const id = state.locationId;
        this.pings[id] = state;
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
                if (!this.searchValue || this.searchValue.length === 0) {
                    return true;
                }
                const escapedSearchValue = this.searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(escapedSearchValue, 'ig');
                return (location.cityName && location.cityName.match(regex))
                || (location.countryCode && location.countryCode.match(regex))
                || (location.countryName && location.countryName.match(regex));
            })
            .sort((a, b) => {
                if (a.countryName < b.countryName) {
                    return -1;
                }
                if (a.countryName > b.countryName) {
                    return 1;
                }
                return 0;
            })
            .map(this.enrichWithStateData)
            .map((location) => {
                if (this.selectedLocation && this.selectedLocation.id === location.id) {
                    return { ...location, selected: true };
                }
                return location;
            });
    }

    /**
     * Adds ping data to locations list
     * @param location
     */
    enrichWithStateData = (location: LocationData): LocationData => {
        const pingData = this.pings[location.id];
        if (pingData) {
            const { ping, available } = pingData;
            return <LocationData>{ ...location, ping, available };
        }
        return location;
    };

    @computed
    get fastestLocations(): LocationData[] {
        const FASTEST_LOCATIONS_COUNT = 3;
        const locations = this.locations || [];
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

        const selectedLocationId = this.selectedLocation.id;
        const currentLocation = this.locations.find((location) => {
            return location.id === selectedLocationId;
        });

        // return selected location ping if it's missing from locations list (AG-3184)
        if (!currentLocation) {
            return this.selectedLocation?.ping || null;
        }

        let ping: number | null = currentLocation?.ping || null;
        // update with fresh values from pings storage
        if (this.pings[selectedLocationId]) {
            ping = this.pings[selectedLocationId].ping;
        }

        return ping;
    }

    @action openPremiumPromoPage = async (): Promise<void> => {
        await messenger.openPremiumPromoPage();
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
     * @returns Forcibly updated locations list.
     */
    forceUpdateLocations = async (): Promise<any> => {
        const locations = await messenger.forceUpdateLocations();
        return locations;
    };
}
