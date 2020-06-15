/**
 * Helper class used to extract minimal set of information for UI
 */
export class LocationWithPing {
    constructor(location) {
        this.id = location.id;
        this.cityName = location.cityName;
        this.countryName = location.countryName;
        this.countryCode = location.countryCode;
        this.ping = location.ping;
        this.available = location.available;
    }
}
