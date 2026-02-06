import { type LocationInterface } from '../schema';

/**
 * DTO class that extracts only UI-relevant fields from a full Location object.
 * Used to pass minimal location data to the popup UI, excluding internal fields
 * like endpoints, coordinates, pingBonus, etc.
 */
export class LocationDto {
    /**
     * Unique location identifier.
     */
    id: string;

    /**
     * City name of the VPN server location.
     */
    cityName: string;

    /**
     * Country name of the VPN server location.
     */
    countryName: string;

    /**
     * ISO 3166-1 alpha-2 country code.
     */
    countryCode: string;

    /**
     * Ping latency in milliseconds provided by the backend, or `null` if unavailable.
     */
    ping: number | null;

    /**
     * Whether this location is currently available for connections.
     */
    available: boolean;

    /**
     * Whether this location is restricted to premium users.
     */
    premiumOnly: boolean;

    /**
     * Whether the endpoint server location does not match the claimed IP geolocation.
     */
    virtual: boolean;

    constructor(location: LocationInterface) {
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
