import qs from 'qs';
import browser from 'webextension-polyfill';
import { AxiosResponse } from 'axios';

import { Api } from './Api';
import { fallbackApi } from './fallbackApi';
import { RequestProps } from './apiTypes';

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

export interface LocationApiData {
    id: string;
    country_name: string;
    country_code: string;
    city_name: string;
    premium_only: boolean;
    latitude: number;
    longitude: number;
    ping_bonus: number;
    endpoints: EndpointApiData[];
    virtual: boolean;
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

interface PostExtensionInstalledData extends AxiosResponse {
    social_providers: string[];
}

export interface VpnConnectionStatus extends AxiosResponse {
    connected: boolean;
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
    getVpnCredentials(appId: string, vpnToken: string): Promise<VpnCredentials>;
    getCurrentLocation(): Promise<CurrentLocationData>;
    getVpnExtensionInfo(appId: string, vpnToken: string): Promise<VpnExtensionInfo>;
    postExtensionInstalled(appId: string): Promise<PostExtensionInstalledData>;
    requestSupport(data: FormData): Promise<AxiosResponse>;
    getDesktopVpnConnectionStatus(): Promise<VpnConnectionStatus>;
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

        return this.makeRequest(path, { params }, method);
    };

    GET_VPN_CREDENTIALS: RequestProps = { path: 'v1/proxy_credentials', method: 'POST' };

    getVpnCredentials = (appId: string, vpnToken: string): Promise<VpnCredentials> => {
        const { path, method } = this.GET_VPN_CREDENTIALS;

        const data = {
            app_id: appId,
            token: vpnToken,
        };

        const config = {
            data: qs.stringify(data),
        };

        return this.makeRequest(path, config, method);
    };

    GET_CURRENT_LOCATION: RequestProps = { path: 'v1/geo_location', method: 'GET' };

    getCurrentLocation = (): Promise<CurrentLocationData> => {
        const { path, method } = this.GET_CURRENT_LOCATION;
        return this.makeRequest(path, {}, method);
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
        return this.makeRequest(path, { params }, method);
    };

    TRACK_EXTENSION_INSTALL: RequestProps = { path: 'v1/init/extension', method: 'POST' };

    postExtensionInstalled = (appId: string): Promise<PostExtensionInstalledData> => {
        const { path, method } = this.TRACK_EXTENSION_INSTALL;

        const config = {
            data: qs.stringify({
                app_id: appId,
            }),
        };

        return this.makeRequest(path, config, method);
    };

    SUPPORT_REQUEST: RequestProps = { path: 'v1/support', method: 'POST' };

    requestSupport = (data: FormData): Promise<AxiosResponse> => {
        const { path, method } = this.SUPPORT_REQUEST;

        const config = {
            data,
        };

        return this.makeRequest(path, config, method);
    };

    GET_DESKTOP_VPN_CONNECTION_STATUS: RequestProps = { path: 'v1/vpn_connected', method: 'GET' };

    getDesktopVpnConnectionStatus = (): Promise<VpnConnectionStatus> => {
        const { path, method } = this.GET_DESKTOP_VPN_CONNECTION_STATUS;
        return this.makeRequest(path, {}, method);
    };

    EXCLUSION_SERVICES: RequestProps = { path: 'v2/exclusion_services', method: 'GET' };

    getExclusionsServices = (): Promise<ExclusionsServicesData> => {
        const { path, method } = this.EXCLUSION_SERVICES;
        const language = browser.i18n.getUILanguage();

        const params = {
            locale: language,
        };

        return this.makeRequest(path, { params }, method);
    };

    EXCLUSION_SERVICE_DOMAINS: RequestProps = { path: 'v1/exclusion_services/domains', method: 'GET' };

    getExclusionServiceDomains = (servicesIds: string[]): Promise<ExclusionServiceDomainsData> => {
        const { path, method } = this.EXCLUSION_SERVICE_DOMAINS;

        const servicesIdsParam = servicesIds.length > 0 ? servicesIds.join(',') : null;

        const params = {
            service_id: servicesIdsParam,
        };

        return this.makeRequest(path, { params }, method);
    };
}

export const vpnApi = new VpnApi(async () => `${await fallbackApi.getVpnApiUrl()}${API_PREFIX}`);
