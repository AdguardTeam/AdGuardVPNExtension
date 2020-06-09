export class Location {
    constructor(countryName, cityName, countryCode) {
        this.id = Location.generateId(countryName, cityName);
        this.countryName = countryName;
        this.cityName = cityName;
        this.countryCode = countryCode;
        this.endpoints = [];
    }

    // getEndpoint = async () => {
    //     let ping;
    //     if (!this.endpoints) {
    //         return null;
    //     }
    //     while (!ping || ) {
    //         ping =
    //     }
    // };

    addEndpoint = (endpoint) => {
        this.endpoints.push(endpoint);
    };

    static generateId = (country, city) => {
        return `${country}-${city}`;
    }
}
