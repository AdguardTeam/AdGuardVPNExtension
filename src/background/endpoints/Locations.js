import { Location } from './Location';

export class Locations {
    locations = {};

    addLocation = (location) => {
        this.locations[location.id] = location;
    }

    getLocations = () => {
        return Object.values(this.locations).reduce((acc, location) => {
            acc[location.id] = {
                id: location.id,
                cityName: location.cityName,
                countryName: location.countryName,
                ping: location.ping,
            };
            return acc;
        }, {});
    }

    getLocationByEndpoint = (endpoint) => {
        const locationId = Location.generateId(endpoint.countryName, endpoint.cityName);
        return this.locations[locationId];
    }

    addEndpoint = (endpoint) => {
        let location = this.getLocationByEndpoint(endpoint);

        if (location) {
            location.addEndpoint(endpoint);
            return;
        }

        location = new Location(endpoint.countryName, endpoint.cityName, endpoint.countryCode);
        location.addEndpoint(endpoint);
        this.addLocation(location);
    }
}
