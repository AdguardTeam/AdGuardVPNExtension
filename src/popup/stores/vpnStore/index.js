import {
    action,
    computed,
    observable,
    runInAction,
    toJS,
} from 'mobx';
import bgProvider from '../../../lib/background-provider';

class VpnStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
    }

    @observable endpoints;

    @observable endpointsGetState;

    @observable selectedEndpoint;

    @observable searchValue = '';

    @observable currentLocation;

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
        const endpoints = await bgProvider.vpn.getEndpoints();
        this.setEndpoints(endpoints);
    };

    @action
    setEndpoints = (endpoints) => {
        console.log(endpoints);
        this.endpoints = endpoints;
    };

    @action
    setSelectedEndpoint = async (id) => {
        const selectedEndpoint = this.endpoints[id];
        await bgProvider.proxy.setCurrentEndpoint(toJS(selectedEndpoint));
        runInAction(() => {
            this.selectedEndpoint = selectedEndpoint;
            this.rootStore.tooltipStore.setMapCoordinatesDefault();
        });
    };

    @action
    getSelectedEndpoint = async () => {
        const endpoint = await bgProvider.proxy.getCurrentEndpoint();
        runInAction(() => {
            this.selectedEndpoint = endpoint;
        });
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
        const selectedCountryName = this.selectedEndpoint && this.selectedEndpoint.countryName;
        const currentCountryName = this.currentLocation && this.currentLocation.countryName;
        return selectedCountryName || currentCountryName || 'Select country';
    }

    @computed
    get cityNameToDisplay() {
        const selectedCityName = this.selectedEndpoint && this.selectedEndpoint.cityName;
        const currentCityName = this.currentLocation && this.currentLocation.cityName;
        return selectedCityName || currentCityName || '';
    }

    @action
    getCurrentLocation = async () => {
        const currentLocation = await bgProvider.vpn.getCurrentLocation();
        runInAction(() => {
            this.currentLocation = currentLocation;
        });
    };

    @action
    getVpnInfo = async () => {
        const vpnInfo = await bgProvider.vpn.getVpnInfo();
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
