import vpnProvider from '../providers/vpnProvider';
import { Location } from './Location';
import notifier from '../../lib/notifier';
import { locationService } from './locationService';
import { LocationWithPing } from './LocationWithPing';

class LocationsManager {
    locations = [];

    /**
     * Returns locations instances
     */
    getLocations = () => {
        return this.locations;
    }

    /**
     * Returns locations with pings, used for UI
     * @returns {*}
     */
    getLocationsWithPing = () => {
        return this.locations.map((location) => {
            return new LocationWithPing(location);
        });
    }

    /**
     * Retrieves locations from server
     * @param vpnToken
     * @returns {Promise<Location[]>}
     */
    getLocationsFromServer = async (vpnToken) => {
        const locationsData = await vpnProvider.getLocationsData(vpnToken);

        const locations = locationsData.map((locationData) => {
            return new Location(locationData);
        });

        this.setLocations(locations);

        return this.locations;
    }

    measurePings = () => {
        this.locations.forEach(async (location) => {
            await locationService.measurePing(location);
        });
    }

    setLocations = (newLocations) => {
        // copy previous pings data
        this.locations = newLocations;
        // launch pings measurement
        this.measurePings();

        notifier.notifyListeners(
            notifier.types.LOCATIONS_UPDATED,
            this.getLocationsWithPing()
        );
    }

    /**
     * Returns endpoint by location id
     * @param locationId
     * @returns {Promise<*>}
     */
    getEndpointByLocation = async (locationId) => {
        const location = this.locations.find((location) => {
            return location.id === locationId;
        });
        return locationService.getEndpoint(location);
    }

    /**
     * Returns location by endpoint id
     * @param endpointId
     */
    getLocationByEndpoint = (endpointId) => {
        if (!endpointId) {
            return null;
        }

        const location = this.locations.find((location) => {
            return location.endpoints.some((endpoint) => endpoint.id === endpointId);
        });

        return location;
    }
}

export const locationsManager = new LocationsManager();
