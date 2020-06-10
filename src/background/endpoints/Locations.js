export class Locations {
    locations = {};

    getLocations = () => {
        return Object.values(this.locations).reduce((acc, location) => {
            acc[location.id] = {
                id: location.id,
                cityName: location.cityName,
                countryName: location.countryName,
                countryCode: location.countryCode,
                ping: location.ping,
                available: location.available,
            };
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
}
