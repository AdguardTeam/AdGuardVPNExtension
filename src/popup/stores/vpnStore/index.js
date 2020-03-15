import {
    action,
    computed,
    observable,
    runInAction,
    toJS,
} from 'mobx';
import { REQUEST_STATUSES } from '../consts';

class VpnStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
    }

    @observable endpoints = {};

    @observable pings = {};

    @observable _fastestEndpoints;

    @observable gettingFastestStatus;

    @observable endpointsGetState;

    @observable selectedEndpoint;

    @observable searchValue = '';

    @observable vpnInfo = {
        bandwidthFreeMbits: null,
        premiumPromoEnabled: null,
        premiumPromoPage: null,
        maxDownloadedBytes: null,
        usedDownloadedBytes: null,
    };

    @action
    setSearchValue = (value) => {
        const trimmed = value.trim();
        if (trimmed !== this.searchValue) {
            this.searchValue = value;
        }
    };

    @action
    setEndpoints = (endpoints) => {
        if (!endpoints) {
            return;
        }
        this.endpoints = endpoints;
        this.requestFastestEndpoints();
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
        await adguard.proxy.setCurrentEndpoint(toJS(selectedEndpoint));
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
    async requestFastestEndpoints() {
        const fastestPromise = this.endpoints?.fastest;
        if (!fastestPromise) {
            throw new Error('No promise received');
        }
        this.gettingFastestStatus = REQUEST_STATUSES.PENDING;
        const fastestEndpoints = await fastestPromise;
        runInAction(() => {
            this._fastestEndpoints = fastestEndpoints;
            this.gettingFastestStatus = REQUEST_STATUSES.DONE;
        });
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
                return endpoint;
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
    get insufficientTraffic() {
        return this.remainingTraffic <= 0;
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
}

export default VpnStore;
