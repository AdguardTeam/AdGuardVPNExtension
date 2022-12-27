export interface LocationWithPingProps {
    id: string;
    cityName: string;
    countryName: string;
    countryCode: string;
    ping: number;
    available: boolean;
    premiumOnly: boolean;
    virtual: boolean;
}

/**
 * Helper class used to extract minimal set of information for UI
 */
export class LocationWithPing {
    id: string;

    cityName: string;

    countryName: string;

    countryCode: string;

    ping: number;

    available: boolean;

    premiumOnly: boolean;

    virtual: boolean;

    constructor(location: LocationWithPingProps) {
        this.id = location.id;
        this.cityName = location.cityName;
        this.countryName = location.countryName;
        this.countryCode = location.countryCode;
        this.ping = location.ping;
        this.available = location.available;
        this.premiumOnly = location.premiumOnly;
        this.virtual = location.virtual;
    }
}
