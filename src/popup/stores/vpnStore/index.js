import {
    action,
    computed,
    observable,
    runInAction,
    toJS,
} from 'mobx';
import messenger from '../../../lib/messenger';

class VpnStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
    }

    @observable endpoints = {};

    @observable pings = {};

    @observable _fastestEndpoints;

    @observable selectedEndpoint;

    @observable searchValue = '';

    @observable vpnInfo = {
        bandwidthFreeMbits: null,
        premiumPromoEnabled: null,
        premiumPromoPage: null,
        maxDownloadedBytes: null,
        usedDownloadedBytes: null,
    };

    @observable isPremiumToken;

    @action
    setSearchValue = (value) => {
        // do not trim, or change logic see issue AG-2233
        this.searchValue = value;
    };

    @action
    setEndpoints = (endpoints) => {
        if (!endpoints) {
            return;
        }

        this.endpoints.all = endpoints.all;
        this._fastestEndpoints = endpoints.fastest;
    };

    @action
    setAllEndpoints = (endpoints) => {
        if (!endpoints) {
            return;
        }
        this.endpoints.all = endpoints;
    };

    @action
    setPing = (endpointPing) => {
        this.pings[endpointPing.endpointId] = endpointPing;
    };

    @action
    selectEndpoint = async (id) => {
        const selectedEndpoint = this.endpoints?.all?.[id];
        if (!selectedEndpoint) {
            throw new Error(`No endpoint with id: "${id}" found`);
        }
        await messenger.setCurrentEndpoint(toJS(selectedEndpoint));
        runInAction(() => {
            this.selectedEndpoint = { ...selectedEndpoint, selected: true };
        });
    };

    @action
    setSelectedEndpoint = (endpoint) => {
        if (!endpoint) {
            return;
        }
        if (!this.selectedEndpoint
            || (this.selectedEndpoint && this.selectedEndpoint.id !== endpoint.id)) {
            this.selectedEndpoint = { ...endpoint, selected: true };
        }
    };

    @computed
    get filteredEndpoints() {
        const allEndpoints = Object.values(this.endpoints?.all || {});
        const { ping } = this.rootStore.settingsStore;

        return allEndpoints
            .filter((endpoint) => {
                if (!this.searchValue || this.searchValue.length === 0) {
                    return true;
                }
                const regex = new RegExp(this.searchValue, 'ig');
                return (endpoint.cityName && endpoint.cityName.match(regex))
                || (endpoint.countryName && endpoint.countryName.match(regex));
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
            .map((endpoint) => {
                const endpointPing = this.pings[endpoint.id];
                if (endpointPing) {
                    return { ...endpoint, ping: endpointPing.ping };
                }
                return endpoint;
            })
            .map((endpoint) => {
                if (this.selectedEndpoint && this.selectedEndpoint.id === endpoint.id) {
                    let endpointPing = endpoint.ping;
                    if (ping) {
                        endpointPing = ping;
                    }
                    return { ...endpoint, selected: true, ping: endpointPing };
                }
                return endpoint;
            });
    }

    @action
    setFastestEndpoints(fastest) {
        this._fastestEndpoints = fastest;
    }

    @computed
    get fastestEndpoints() {
        const { ping } = this.rootStore.settingsStore;
        return Object.values(this._fastestEndpoints || {})
            .sort((a, b) => a.ping - b.ping)
            .map((endpoint) => {
                if (this.selectedEndpoint && this.selectedEndpoint.id === endpoint.id) {
                    let endpointPing = endpoint.ping;
                    if (ping) {
                        endpointPing = ping;
                    }
                    return { ...endpoint, selected: true, ping: endpointPing };
                }
                return { ...endpoint };
            });
    }

    @computed
    get countryNameToDisplay() {
        return this.selectedEndpoint && this.selectedEndpoint.countryName;
    }

    @computed
    get countryCodeToDisplay() {
        return this.selectedEndpoint && this.selectedEndpoint.countryCode;
    }

    @computed
    get cityNameToDisplay() {
        return this.selectedEndpoint && this.selectedEndpoint.cityName;
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
}

export default VpnStore;
