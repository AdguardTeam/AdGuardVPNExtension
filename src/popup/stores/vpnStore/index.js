import {
    action,
    computed,
    observable,
    runInAction,
    toJS,
} from 'mobx';

class VpnStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
    }

    @observable endpoints;

    @observable endpointsGetState;

    @observable selectedEndpoint;

    @observable searchValue = '';

    @observable vpnInfo = {
        bandwidthFreeMbits: null,
        premiumPromoEnabled: null,
        premiumPromoPage: null,
    };

    @action
    setSearchValue = (value) => {
        const trimmed = value.trim();
        if (trimmed !== this.searchValue) {
            this.searchValue = value;
        }
    };

    @action getEndpoints = async () => {
        const endpoints = adguard.vpn.getEndpoints();
        this.setEndpoints(endpoints);
    };

    @action
    setEndpoints = (endpoints) => {
        if (!endpoints) {
            return;
        }
        this.endpoints = endpoints;
    };

    @action
    selectEndpoint = async (id) => {
        const selectedEndpoint = this.endpoints[id];
        await adguard.proxy.setCurrentEndpoint(toJS(selectedEndpoint));
        runInAction(() => {
            this.selectedEndpoint = selectedEndpoint;
            this.rootStore.tooltipStore.setMapCoordinatesDefault();
        });
    };

    @action
    setSelectedEndpoint = (endpoint) => {
        if (!endpoint) {
            return;
        }
        if (!this.selectedEndpoint
            || (this.selectedEndpoint && this.selectedEndpoint.id !== endpoint.id)) {
            this.selectedEndpoint = endpoint;
            this.rootStore.tooltipStore.setMapCoordinates(endpoint.coordinates);
        }
    };

    @computed
    get filteredEndpoints() {
        if (!this.endpoints) {
            return [];
        }
        return Object.values(this.endpoints).filter((endpoint) => {
            if (!this.searchValue || this.searchValue.length === 0) {
                return true;
            }
            const regex = new RegExp(this.searchValue, 'ig');
            return endpoint.cityName && endpoint.cityName.match(regex);
        }).map((endpoint) => {
            if (this.selectedEndpoint && this.selectedEndpoint.id === endpoint.id) {
                return { ...endpoint, selected: true };
            }
            return endpoint;
        });
    }

    @computed
    get countryNameToDisplay() {
        return this.selectedEndpoint && this.selectedEndpoint.countryName;
    }

    @computed
    get cityNameToDisplay() {
        return this.selectedEndpoint && this.selectedEndpoint.cityName;
    }

    @action
    getVpnInfo = async () => {
        const vpnInfo = adguard.vpn.getVpnInfo();
        this.setVpnInfo(vpnInfo);
    };

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
}

export default VpnStore;
