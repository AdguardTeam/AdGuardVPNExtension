export class Locations {
    locations = {};

    getLocations = () => {
        return this.locations;
    }

    getLocationsData = () => {
        return Object.values(this.locations).reduce((acc, location) => {
            acc[location.id] = location.simplify();
            return acc;
        }, {});
    }

    updateKeepingPings = (newLocations) => {
        const result = {};

        for (let i = 0; i < newLocations.length; i += 1) {
            const newLocation = newLocations[i];
            const { id: newLocationId } = newLocation;

            const oldLocation = this.locations[newLocationId];

            if (!oldLocation) {
                result[newLocationId] = newLocation;
            } else {
                newLocation.setPingData(oldLocation.getPingData());
                result[newLocationId] = newLocation;
            }
        }

        this.locations = result;
    }

    measurePings = () => {
        Object.values(this.locations).forEach((location) => {
            location.measurePings();
        });
    }

    getLocation = (id) => {
        return this.locations[id];
    }

    getLocationByEndpoint = (endpointId) => {
        if (!endpointId) {
            return null;
        }

        const location = Object.values(this.locations).find((location) => {
            return location.getEndpointById(endpointId);
        });

        return location;
    }
}
