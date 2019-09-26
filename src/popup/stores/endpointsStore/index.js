import {
    action,
    computed,
    observable,
    runInAction,
} from 'mobx';
import bgProvider from '../../../lib/background-provider';
import { REQUEST_STATUSES } from '../consts';

class EndpointsStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
    }

    @observable endpoints;

    @observable endpointsGetState;

    @observable selectedEndpoint;

    @observable searchValue = '';

    @observable currentLocation;

    @action
    setSearchValue = (value) => {
        const trimmed = value.trim();
        if (trimmed !== this.searchValue) {
            this.searchValue = value;
        }
    };

    @action fetchEndpoints = async () => {
        try {
            this.endpointsGetState = REQUEST_STATUSES.PENDING;
            const endpointsData = await bgProvider.vpn.getEndpoints();
            runInAction(() => {
                this.endpoints = endpointsData;
                this.endpointsGetState = REQUEST_STATUSES.DONE;
            });
        } catch (e) {
            console.log(e);
            this.endpointsGetState = REQUEST_STATUSES.ERROR;
        }
    };

    @action
    setSelectedEndpoint = async (id) => {
        const selectedEndpoint = this.endpoints[id];
        await bgProvider.proxy.setCurrentEndpoint(selectedEndpoint);
        runInAction(() => {
            this.selectedEndpoint = selectedEndpoint;
            this.rootStore.tooltipStore.setMapCoordinatesDefault();
        });
    };

    @action
    getSelectedEndpoint = async () => {
        let endpoint;
        try {
            endpoint = await bgProvider.proxy.getCurrentEndpoint();
        } catch (e) {
            endpoint = null; // no current selected endpoint
        }
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
    }
}

export default EndpointsStore;
