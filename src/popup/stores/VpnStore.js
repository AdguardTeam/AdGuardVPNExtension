import {
    action,
    computed,
    observable,
    runInAction,
    toJS,
} from 'mobx';

import messenger from '../../lib/messenger';

export class VpnStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
    }

    @observable locations = [];

    @observable pings = {};

    @observable selectedLocation;

    @observable searchValue = '';

    @observable vpnInfo = {
        bandwidthFreeMbits: null,
        premiumPromoEnabled: null,
        premiumPromoPage: null,
        maxDownloadedBytes: null,
        usedDownloadedBytes: null,
    };

    @observable tooManyDevicesConnected = false;

    @observable maxDevicesAllowed = null;

    @observable isPremiumToken;

    @action
    setSearchValue = (value) => {
        // do not trim, or change logic see issue AG-2233
        this.searchValue = value;
    };

    @action
    setLocations = (locations) => {
        if (!locations) {
            return;
        }

        this.locations = locations;
    }

    @action
    updateLocationState = (state) => {
        const id = state.locationId;
        this.pings[id] = state;
    };

    @action
    selectLocation = async (id) => {
        const selectedLocation = this.locations.find((location) => {
            return location.id === id;
        });

        if (!selectedLocation) {
            throw new Error(`No endpoint with id: "${id}" found`);
        }

        await messenger.setCurrentLocation(toJS(selectedLocation), true);
        runInAction(() => {
            this.selectedLocation = { ...selectedLocation };
        });
    };

    @action
    setSelectedLocation = (location) => {
        if (!location) {
            return;
        }
        if (!this.selectedLocation
            || (this.selectedLocation && this.selectedLocation.id !== location.id)) {
            this.selectedLocation = { ...location };
        }
    };

    @computed
    get filteredLocations() {
        const locations = this.locations || [];

        return locations
            .filter((location) => {
                if (!this.searchValue || this.searchValue.length === 0) {
                    return true;
                }
                const escapedSearchValue = this.searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(escapedSearchValue, 'ig');
                return (location.cityName && location.cityName.match(regex))
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
     * @returns {{ping, available}|*}
     */
    enrichWithStateData = (location) => {
        const pingData = this.pings[location.id];
        if (pingData) {
            const { ping, available } = pingData;
            return { ...location, ping, available };
        }
        return location;
    }

    @computed
    get fastestLocations() {
        const FASTEST_LOCATIONS_COUNT = 3;
        const locations = this.locations || [];
        const sortedLocations = locations
            .map(this.enrichWithStateData)
            .filter((location) => location.ping)
            .sort((a, b) => a.ping - b.ping)
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
    get countryNameToDisplay() {
        return this.selectedLocation?.countryName;
    }

    @computed
    get countryCodeToDisplay() {
        return this.selectedLocation?.countryCode;
    }

    @computed
    get cityNameToDisplay() {
        return this.selectedLocation?.cityName;
    }

    @action
    setVpnInfo = (vpnInfo) => {
        if (!vpnInfo) {
            return;
        }
        this.vpnInfo = vpnInfo;
    };

    @computed
    get bandwidthFreeMbits() {
        return this.vpnInfo.bandwidthFreeMbits;
    }

    @computed
    get premiumPromoEnabled() {
        return this.vpnInfo.premiumPromoEnabled;
    }

    @computed
    get premiumPromoPage() {
        return this.vpnInfo.premiumPromoPage;
    }

    @computed
    get remainingTraffic() {
        return this.vpnInfo.maxDownloadedBytes - this.vpnInfo.usedDownloadedBytes;
    }

    @computed
    get trafficUsingProgress() {
        const { maxDownloadedBytes } = this.vpnInfo;
        return Math.floor((this.remainingTraffic / maxDownloadedBytes) * 100);
    }

    @computed
    get showSearchResults() {
        return this.searchValue.length > 0;
    }

    @action
    setIsPremiumToken(isPremiumToken) {
        this.isPremiumToken = isPremiumToken;
    }

    @action
    async requestIsPremiumToken() {
        const isPremiumToken = await messenger.checkIsPremiumToken();
        runInAction(() => {
            this.isPremiumToken = isPremiumToken;
        });
    }

    @computed
    get selectedLocationPing() {
        if (!this.locations) {
            return null;
        }

        const selectedLocationId = this.selectedLocation.id;
        const currentLocation = this.locations.find((location) => {
            return location.id === selectedLocationId;
        });

        let ping = currentLocation?.ping;
        // update with fresh values from pings storage
        if (this.pings[selectedLocationId]) {
            ping = this.pings[selectedLocationId].ping;
        }

        return ping;
    }

    @action
    openPremiumPromoPage = async () => {
        await messenger.openPremiumPromoPage();
    }

    @action
    setTooManyDevicesConnected = (state) => {
        this.tooManyDevicesConnected = state;
    };

    @action
    setMaxDevicesAllowed = (maxDevicesAllowed) => {
        this.maxDevicesAllowed = maxDevicesAllowed;
    }
}
