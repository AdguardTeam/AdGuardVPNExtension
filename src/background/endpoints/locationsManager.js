import { Locations } from './Locations';
import vpnProvider from '../providers/vpnProvider';
import credentials from '../credentials';
import { Endpoint } from './Endpoint';
import log from '../../lib/logger';

class LocationsManager {
    locations = new Locations();

    getLocations = () => {
        // every time launch locations update
        this.updateLocations();
        // todo prepare data
        // return cached data
        return this.locations.getLocations();
    }

    getLocationsFromServer = async () => {
        const vpnToken = await credentials.gainValidVpnToken();
        const endpointsData = await vpnProvider.getEndpoints(vpnToken);
        const { endpoints, backupEndpoints } = endpointsData;

        const locations = new Locations();

        // TODO endpoints api would return locations
        [...Object.values(endpoints), ...Object.values(backupEndpoints)].forEach((endpointData) => {
            const endpoint = new Endpoint(endpointData);
            locations.addEndpoint(endpoint);
        });

        return locations;
    }

    updateLocations = async () => {
        if (this.isUpdatingLocations) {
            return;
        }

        this.isUpdatingLocations = true;

        try {
            this.locations = await this.getLocationsFromServer();
            this.isUpdatingLocations = false;
        } catch (e) {
            log.error(e.message);
        }

        // TODO check if selected location exists in the new list of locations
        //  and user can connect to it, otherwise reconnect to closest one
    }
}

export const locationsManager = new LocationsManager();
