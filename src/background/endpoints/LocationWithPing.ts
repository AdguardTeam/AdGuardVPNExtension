import { type LocationInterface } from '../schema';

/**
 * Interface for location data used by the UI.
 * Contains only the fields needed for display, excluding internal fields
 * like endpoints, coordinates, pingBonus, etc.
 */
export interface LocationWithPingInterface {
    id: string;
    cityName: string;
    countryName: string;
    countryCode: string;
    ping: number | null;
    available: boolean;
    premiumOnly: boolean;
    virtual: boolean;
}

/**
 * DTO class that extracts only UI-relevant fields from a full Location object.
 * Used to pass minimal location data to the popup UI.
 */
export class LocationWithPing implements LocationWithPingInterface {
    id: string;

    cityName: string;

    countryName: string;

    countryCode: string;

    ping: number | null;

    available: boolean;

    premiumOnly: boolean;

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
