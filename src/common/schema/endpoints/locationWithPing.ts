/**
 * Lightweight location data with optional ping and availability info.
 * Shared between background and UI contexts (type-only import safe).
 */
export interface LocationWithPingInterface {
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
     * ISO 3166-1 alpha-2 country code (e.g. "US", "DE").
     */
    countryCode: string;

    /**
     * Measured ping in milliseconds, or `null`/`undefined` if not yet measured.
     */
    ping?: number | null;

    /**
     * Whether the location is currently reachable.
     */
    available?: boolean;

    /**
     * Whether the location is restricted to premium users.
     */
    premiumOnly: boolean;

    /**
     * Whether this is a virtual (non-physical) server location.
     */
    virtual: boolean;
}
