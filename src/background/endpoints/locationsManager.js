import { Locations } from './Locations';
import vpnProvider from '../providers/vpnProvider';
import { Location } from './Location';
import notifier from '../../lib/notifier';

class LocationsManager {
    locations = new Locations();

    /**
     * Returns locations instances
     */
    getLocations = () => {
        return this.locations.getLocations();
    }

    /**
     * Returns cached data
     * @returns {*}
     */
    getLocationsData = () => {
        return this.locations.getLocationsData();
    }

    /**
     * Retrieves locations from server
     * @param vpnToken
     * @returns {Promise<Locations>}
     */
    getLocationsFromServer = async (vpnToken) => {
        const locationsData = await vpnProvider.getLocationsData(vpnToken);

        const locations = Object.values(locationsData).map((locationData) => {
            return new Location(locationData);
        });

        this.setLocations(locations);

        return this.locations;
    }

    setLocations = (newLocations) => {
        // copy previous pings data
        this.locations.updateKeepingPings(newLocations);
        // launch pings measurement
        this.locations.measurePings();

        notifier.notifyListeners(
            notifier.types.LOCATIONS_UPDATED,
            this.locations.getLocationsData()
        );
    }

    /**
     * Returns endpoint by location id
     * @param locationId
     * @returns {Promise<*>}
     */
    getEndpointByLocation = async (locationId) => {
        const location = this.locations.getLocation(locationId);
        return location.getEndpoint();
    }

    /**
     * Returns location by endpoint id
     * @param endpointId
     */
    getLocationByEndpoint = (endpointId) => {
        if (!endpointId) {
            return null;
        }
        return this.locations.getLocationByEndpoint(endpointId);
    }
}

export const locationsManager = new LocationsManager();
