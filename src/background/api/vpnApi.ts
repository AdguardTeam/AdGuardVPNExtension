import browser from 'webextension-polyfill';
import { type AxiosResponse } from 'axios';

import { Api } from './Api';
import { fallbackApi } from './fallbackApi';
import { type RequestProps } from './apiTypes';

const API_PREFIX = '/api';

interface VpnCredentials extends AxiosResponse {
    license_status: string;
    time_expires_sec: number;
    result: {
        credentials: string,
        expires_in_sec: number,
    };
}

export interface VpnExtensionInfo extends AxiosResponse {
    bandwidth_free_mbits: number;
    premium_promo_page: string;
    premium_promo_enabled: boolean;
    refresh_tokens: boolean;
    vpn_failure_page: string;
    used_downloaded_bytes: number;
    used_uploaded_bytes: number;
    max_downloaded_bytes: number;
    max_uploaded_bytes: number;
    renewal_traffic_date: string;
    connected_devices_count: number;
    max_devices_count: number;
    vpn_connected: boolean;
    email_confirmation_required: boolean;
}

export interface EndpointApiData {
    domain_name: string;
    ipsec_domain_name: string;
    ipsec_remote_identifier: string;
    ipv4_address: string;
    ipv6_address: string;
    public_key: string;
}

/**
 * Represents a VPN server location as returned by the backend API.
 *
 * @remarks
 * This interface maps directly to the JSON structure returned by the locations endpoint.
 * The backend provides `ping` and `available` fields,
 * eliminating the need for client-side ping measurements.
 */
export interface LocationApiData {
    /**
     * Unique identifier for the location.
     */
    id: string;

    /**
     * Human-readable country name (e.g., "United States").
     */
    country_name: string;

    /**
     * ISO 3166-1 alpha-2 country code (e.g., "US").
     */
    country_code: string;

    /**
     * Human-readable city name (e.g., "New York").
     */
    city_name: string;

    /**
     * Whether this location is restricted to premium users.
     */
    premium_only: boolean;

    /**
     * Geographic latitude coordinate.
     */
    latitude: number;

    /**
     * Geographic longitude coordinate.
     */
    longitude: number;

    /**
     * Client must subtract ping_bonus from the real ping value and use this
     * calculated value to choose the best location. May have a negative value,
     * in which case the 'effective' ping value becomes greater than real,
     * allowing pessimization of a particular location.
     * Note: user sees the real ping value, not the calculated.
     */
    ping_bonus: number;

    /**
     * List of VPN endpoints available at this location.
     */
    endpoints: EndpointApiData[];

    /**
     * Indicates that the endpoint server location does not match
     * the claimed IP geo location.
     */
    virtual: boolean;

    /**
     * Approximate ping value in milliseconds between the client
     * and the endpoint location. `null` means ping is not set.
     * @since v2.9
     */
    ping: number | null;

    /**
     * Whether this location is currently available for connections.
     * @since v2.9
     */
    available: boolean;
}

interface LocationsData extends AxiosResponse {
    locations: LocationApiData[];
}

interface CurrentLocationData extends AxiosResponse {
    ip: string;
    country_code: string;
    country: {
        names: [{
            locale: string,
            name: string,
        }],
    };
    location: {
        latitude: number,
        longitude: number,
    };
    city: {
        names: [{
            locale: string,
            name: string,
        }],
    };
}

interface ExclusionsServicesData extends AxiosResponse {
    services: [{
        service_id: string,
        service_name: string,
        icon_url: string,
        categories: string[],
        modified_time: string,
    }];
    categories: [{
        id: string,
        name: string,
    }];
}

interface ExclusionServiceDomainsData extends AxiosResponse {
    services: [{
        service_id: string,
        domains: string[],
    }];
}

interface VpnApiInterface {
    getLocations(appId: string, vpnToken: string): Promise<LocationsData>;

    /**
     * Fetches VPN proxy credentials from the backend.
     *
     * @param appId Application identifier.
     * @param vpnToken VPN authentication token.
     * @param version Extension version.
     * @param helpUsImprove Value of flag to report.
     *
     * @returns Promise resolving to VPN credentials with license status and expiration time.
     */
    getVpnCredentials(
        appId: string,
        vpnToken: string,
        version: string,
        helpUsImprove: boolean
    ): Promise<VpnCredentials>;
    getCurrentLocation(): Promise<CurrentLocationData>;
    getVpnExtensionInfo(appId: string, vpnToken: string): Promise<VpnExtensionInfo>;
    trackExtensionInstallation(appId: string, version: string, experiments: string): Promise<unknown>;
    requestSupport(data: FormData): Promise<Response>;
    getExclusionsServices(): Promise<ExclusionsServicesData>;
    getExclusionServiceDomains(servicesIds: string[]): Promise<ExclusionServiceDomainsData>;
}

// projects/ADGUARD/repos/adguard-vpn-backend-service/browse
class VpnApi extends Api implements VpnApiInterface {
    GET_LOCATIONS: RequestProps = { path: 'v2/locations/extension', method: 'GET' };

    getLocations = (appId: string, vpnToken: string): Promise<LocationsData> => {
        const { path, method } = this.GET_LOCATIONS;
        const language = browser.i18n.getUILanguage();

        const params = {
            app_id: appId,
            token: vpnToken,
            language,
        };

        return this.makeRequest<LocationsData>(path, { params }, method);
    };

    GET_VPN_CREDENTIALS: RequestProps = { path: 'v1/proxy_credentials', method: 'POST' };

    /**
     * @inheritDoc
     */
    getVpnCredentials = (
        appId: string,
        vpnToken: string,
        version: string,
        helpUsImprove: boolean,
    ): Promise<VpnCredentials> => {
        const { path, method } = this.GET_VPN_CREDENTIALS;

        const language = browser.i18n.getUILanguage();

        const params = {
            app_id: appId,
            token: vpnToken,
            send_technical_interaction_data: String(helpUsImprove),
            send_crash_reports: String(helpUsImprove),
            version,
            language,
            system_language: language,
        };

        return this.makeRequest<VpnCredentials>(path, { params }, method);
    };

    GET_CURRENT_LOCATION: RequestProps = { path: 'v1/geo_location', method: 'GET' };

    getCurrentLocation = (): Promise<CurrentLocationData> => {
        const { path, method } = this.GET_CURRENT_LOCATION;
        return this.makeRequest<CurrentLocationData>(path, {}, method);
    };

    VPN_EXTENSION_INFO: RequestProps = { path: 'v1/info/extension', method: 'GET' };

    getVpnExtensionInfo = (
        appId: string,
        vpnToken: string,
    ): Promise<VpnExtensionInfo> => {
        const { path, method } = this.VPN_EXTENSION_INFO;

        const params = {
            app_id: appId,
            token: vpnToken,
        };
        return this.makeRequest<VpnExtensionInfo>(path, { params }, method);
    };

    TRACK_EXTENSION_INSTALL: RequestProps = { path: 'v1/init/extension', method: 'POST' };

    trackExtensionInstallation = (appId: string, version: string, experiments: string): Promise<unknown> => {
        const { path, method } = this.TRACK_EXTENSION_INSTALL;

        const language = browser.i18n.getUILanguage();

        const params = {
            app_id: appId,
            version,
            language,
            system_language: language,
            experiments,
        };

        return this.makeRequest(path, { params }, method);
    };

    SUPPORT_REQUEST: RequestProps = { path: 'v1/support', method: 'POST' };

    requestSupport = (data: FormData): Promise<Response> => {
        const { path, method } = this.SUPPORT_REQUEST;

        const config = {
            body: data,
        };

        return this.makeRequest(path, config, method);
    };

    EXCLUSION_SERVICES: RequestProps = { path: 'v2/exclusion_services', method: 'GET' };

    getExclusionsServices = (): Promise<ExclusionsServicesData> => {
        const { path, method } = this.EXCLUSION_SERVICES;
        const language = browser.i18n.getUILanguage();

        const params = {
            locale: language,
        };

        return this.makeRequest<ExclusionsServicesData>(path, { params }, method);
    };

    EXCLUSION_SERVICE_DOMAINS: RequestProps = { path: 'v1/exclusion_services/domains', method: 'GET' };

    getExclusionServiceDomains = (servicesIds: string[]): Promise<ExclusionServiceDomainsData> => {
        const { path, method } = this.EXCLUSION_SERVICE_DOMAINS;

        const servicesIdsParam = servicesIds.length > 0 ? servicesIds.join(',') : '';

        const params = {
            service_id: servicesIdsParam,
        };

        return this.makeRequest<ExclusionServiceDomainsData>(path, { params }, method);
    };
}

export const vpnApi = new VpnApi(async () => `${await fallbackApi.getVpnApiUrl()}${API_PREFIX}`);
