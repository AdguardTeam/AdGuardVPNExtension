export class Endpoint {
    constructor({
        cityName,
        countryCode,
        countryName,
        domainName,
        coordinates,
        premiumOnly,
        publicKey,
    }) {
        this.id = domainName;
        this.cityName = cityName;
        this.countryCode = countryCode;
        this.countryName = countryName;
        this.domainName = domainName;
        this.coordinates = coordinates;
        this.premiumOnly = premiumOnly;
        this.publicKey = publicKey;
    }
}
