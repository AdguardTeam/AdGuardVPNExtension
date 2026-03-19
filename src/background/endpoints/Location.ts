import type { EndpointInterface, LocationData, LocationInterface } from '../schema';

import { Endpoint } from './Endpoint';
import { parseBackendPing } from './locationHelpers';

export interface LocationWithPingInterface extends LocationData {
    ping: number;
}

/**
 * A VPN server location with its metadata, endpoints, and ping state.
 *
 * The `ping` field has a dual source: backend-provided (preferred) or
 * locally measured (fallback). When the backend supplies a valid non-negative
 * ping, it is used directly; otherwise local measurement fills it in.
 */
export class Location implements LocationInterface {
    /**
     * Unique location identifier (Base64-encoded).
     */
    id: string;

    /**
     * Localized country name.
     */
    countryName: string;

    /**
     * Localized city name.
     */
    cityName: string;

    /**
     * ISO 3166-1 alpha-2 country code.
     */
    countryCode: string;

    /**
     * Available VPN endpoints (servers) within this location.
     */
    endpoints: EndpointInterface[];

    /**
     * Geographic coordinates as `[longitude, latitude]`.
     */
    coordinates: [
        longitude: number,
        latitude: number,
    ];

    /**
     * Whether this location is restricted to premium subscribers.
     */
    premiumOnly: boolean;

    /**
     * Bonus subtracted from ping when ranking fastest locations (ms).
     */
    pingBonus: number;

    /**
     * Whether this is a virtual (non-physical) location.
     */
    virtual: boolean;

    /**
     * Whether this location is currently reachable.
     */
    available: boolean;

    /**
     * Ping latency in milliseconds, or `null` if not yet determined.
     *
     * May originate from the backend API or from local measurement.
     */
    ping: number | null;

    /**
     * The endpoint last used or selected for this location.
     */
    endpoint: EndpointInterface | null;

    constructor(locationData: LocationData) {
        this.id = locationData.id;
        this.countryName = locationData.countryName;
        this.cityName = locationData.cityName;
        this.countryCode = locationData.countryCode;
        this.endpoints = locationData.endpoints
            .map((endpoint) => new Endpoint(endpoint));
        this.coordinates = locationData.coordinates;
        this.premiumOnly = locationData.premiumOnly;
        this.pingBonus = locationData.pingBonus;
        this.virtual = locationData.virtual;
        this.available = true;
        this.ping = parseBackendPing(locationData.ping);
        this.endpoint = null;
    }
}
