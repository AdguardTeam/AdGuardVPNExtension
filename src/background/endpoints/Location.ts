import type { EndpointInterface, LocationData, LocationInterface } from '../schema';

import { Endpoint } from './Endpoint';

/**
 * Represents a VPN server location with its endpoints and metadata.
 *
 * @remarks
 * This class wraps the raw location data from the backend API and provides
 * a domain model for use throughout the application. As of AG-49612,
 * ping and availability values are provided by the backend.
 */
export class Location implements LocationInterface {
    /**
     * Unique identifier for the location.
     */
    id: string;

    /**
     * Country name (e.g., "United States").
     */
    countryName: string;

    /**
     * City name (e.g., "New York").
     */
    cityName: string;

    /**
     * ISO 3166-1 alpha-2 country code (e.g., "US").
     */
    countryCode: string;

    /**
     * Collection of VPN endpoints available at this location.
     */
    endpoints: EndpointInterface[];

    /**
     * Geographic coordinates as [longitude, latitude].
     */
    coordinates: [
        longitude: number,
        latitude: number,
    ];

    /**
     * Whether this location is restricted to premium users.
     */
    premiumOnly: boolean;

    /**
     * Client must subtract ping_bonus from the real ping value and use this
     * calculated value to choose the best location. May have a negative value,
     * in which case the 'effective' ping value becomes greater than real,
     * allowing pessimization of a particular location.
     * Note: user sees the real ping value, not the calculated.
     */
    pingBonus: number;

    /**
     * Indicates that the endpoint server location does not match
     * the claimed IP geo location.
     */
    virtual: boolean;

    /**
     * Whether this location is currently available for connections.
     * Defaults to `true` for backwards compatibility if not provided by backend.
     * @since AG-49612
     */
    available: boolean;

    /**
     * Approximate ping value in milliseconds between the client
     * and the endpoint location. `null` means ping is not set.
     * @since AG-49612
     */
    ping: number | null;

    /**
     * The currently selected endpoint for this location.
     * `null` until an endpoint is explicitly selected.
     */
    endpoint: EndpointInterface | null;

    /**
     * Creates a new Location instance from raw location data.
     *
     * @param locationData - The raw location data from the backend API.
     */
    constructor(locationData: LocationData) {
        this.id = locationData.id;
        this.countryName = locationData.countryName;
        this.cityName = locationData.cityName;
        this.countryCode = locationData.countryCode;
        this.endpoints = locationData.endpoints.map((endpoint) => new Endpoint(endpoint));
        this.coordinates = locationData.coordinates;
        this.premiumOnly = locationData.premiumOnly;
        this.pingBonus = locationData.pingBonus;
        this.virtual = locationData.virtual;
        // AG-49612: Use backend-provided ping and availability values
        // Fallback to defaults for backwards compatibility
        this.available = locationData.available ?? true;
        this.ping = locationData.ping ?? null;
        this.endpoint = null;
    }
}
