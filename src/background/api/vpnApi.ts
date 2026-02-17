import browser from 'webextension-polyfill';
import { type AxiosResponse } from 'axios';

import { i18n } from '../../common/i18n';

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
 * Raw location data returned by the backend API
 *
 * Each object represents a single VPN server location (city) with its
 * geographic metadata, access restrictions, and connectivity endpoints.
 */
export interface LocationApiData {
    /**
     * Unique location identifier (Base64-encoded).
     */
    id: string;

    /**
     * Localized country name.
     */
    country_name: string;

    /**
     * ISO 3166-1 alpha-2 country code (e.g. `"US"`, `"DE"`).
     */
    country_code: string;

    /**
     * Localized city name.
     */
    city_name: string;

    /**
     * Whether this location is restricted to premium subscribers.
     */
    premium_only: boolean;

    /**
     * Geographic latitude of the location.
     */
    latitude: number;

    /**
     * Geographic longitude of the location.
     */
    longitude: number;

    /**
     * Bonus subtracted from ping when ranking fastest locations (ms).
     */
    ping_bonus: number;

    /**
     * Available VPN endpoints (servers) within this location.
     */
    endpoints: EndpointApiData[];

    /**
     * Whether this is a virtual (non-physical) location.
     */
    virtual: boolean;

    /**
     * Backend-provided approximate ping in milliseconds.
     *
     * When present and non-negative the extension uses this value directly
     * instead of performing local ping measurement.  `null` or absent means
     * the ping is not set and the extension falls back to local measurement.
     */
    ping?: number | null;
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
        const language = i18n.getUILanguage();

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
