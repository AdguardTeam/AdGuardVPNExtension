import { Locations } from './Locations';
import vpnProvider from '../providers/vpnProvider';
import credentials from '../credentials';
import log from '../../lib/logger';
import { Location } from './Location';
import notifier from '../../lib/notifier';

class LocationsManager {
    locations = new Locations();

    getLocations = () => {
        // every time launch locations update
        this.updateLocations();

        // return cached data
        return this.locations.getLocations();
    }

    getLocationsFromServer = async () => {
        const vpnToken = await credentials.gainValidVpnToken();
        const locationsData = await vpnProvider.getLocationsData(vpnToken.token);

        return Object.values(locationsData).map((locationData) => {
            return new Location(locationData);
        });
    }

    updateLocations = async () => {
        if (this.isUpdatingLocations) {
            return;
        }

        this.isUpdatingLocations = true;

        try {
            const locations = await this.getLocationsFromServer();
            this.setLocations(locations);
        } catch (e) {
            log.error(e.message);
        }

        this.isUpdatingLocations = false;
        // TODO check if selected location exists in the new list of locations
        //  and user can connect to it, otherwise reconnect to closest one
    }

    setLocations = (newLocations) => {
        // copy previous pings data
        this.locations.updateKeepingPings(newLocations);
        // launch pings measurement
        this.locations.measurePings();

        notifier.notifyListeners(notifier.types.LOCATIONS_UPDATED, this.locations.getLocations());
    }

    getEndpoint = async (id) => {
        const location = this.locations.getLocation(id);
        return location.getEndpoint();
    }
}

export const locationsManager = new LocationsManager();
