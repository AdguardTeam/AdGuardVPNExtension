import browser from 'webextension-polyfill';
import JSZip from 'jszip';
import * as v from 'valibot';

import { vpnApi } from '../api';
import { log } from '../../common/logger';
import {
    type ExclusionServicesDomains,
    processExclusionServices,
    processExclusionServicesDomains,
} from '../../common/data-processors';
import type { LocationApiData, EndpointApiData } from '../api/vpnApi';
import type { ServicesInterface, CredentialsDataInterface, LocationInterface } from '../schema';
import { type VpnExtensionInfoInterface } from '../../common/schema/endpoints/vpnInfo';
import { type TrackInstallResponse, trackInstallResponseSchema } from '../schema/credentials/trackInstallResponse';

const DEFAULT_LOCALE = 'en';

interface NameInterface {
    locale: string;
    name: string;
}

interface CurrentLocationData {
    ip: string;
    cityName: string | null;
    countryName: string | null;
    countryCode: string;
    coordinates: [
        longitude: number,
        latitude: number,
    ],
}

export interface EndpointProviderData {
    id: string;
    ipv4Address: string;
    ipv6Address: string;
    domainName: string;
    publicKey: string;
}

export interface RequestSupportParameters {
    appId: string;
    token: string;
    email: string;
    message: string;
    version: string;
    appLogs?: string;
}

/**
 * Response from support request submission.
 *
 * @property status Status of the support request.
 * @property error Error message if request failed, null otherwise.
 */
export interface RequestSupportResponse {
    status: string,
    error: string | null
}

export interface VpnProviderInterface {
    getLocationsData(appId: string, vpnToken: string): Promise<LocationInterface[]>;
    getCurrentLocation(): Promise<CurrentLocationData>;
    getVpnCredentials(
        appId: string,
        vpnToken: string,
        version: string,
        helpUsImprove: boolean,
    ): Promise<CredentialsDataInterface>;
    trackExtensionInstallation(appId: string, version: string, experiments: string): Promise<TrackInstallResponse>;
    getVpnExtensionInfo(
        appId: string,
        vpnToken: string,
    ): Promise<VpnExtensionInfoInterface>;
    requestSupport({
        appId,
        token,
        email,
        message,
        version,
        appLogs,
    }: RequestSupportParameters): Promise<RequestSupportResponse>;
    getExclusionsServices(): Promise<ServicesInterface>;
}

/**
 * Prepares locations data.
 * @param appId
 * @param vpnToken
 *
 * @returns Promise with locations data.
 */
const getLocationsData = async (
    appId: string,
    vpnToken: string,
): Promise<LocationInterface[]> => {
    const locationsData = await vpnApi.getLocations(appId, vpnToken);

    const { locations = [] } = locationsData;

    const prepareEndpointData = (endpoint: EndpointApiData): EndpointProviderData => {
        const {
            domain_name: domainName,
            ipv4_address: ipv4Address,
            ipv6_address: ipv6Address,
            public_key: publicKey,
        } = endpoint;

        return {
            id: domainName,
            ipv4Address,
            ipv6Address,
            domainName,
            publicKey,
        };
    };

    // FIXME jsdoc
    const prepareLocationData = (location: LocationApiData): LocationInterface => {
        const {
            city_name: cityName,
            country_code: countryCode,
            country_name: countryName,
            premium_only: premiumOnly,
            latitude,
            longitude,
            id,
            endpoints,
            ping_bonus: pingBonus,
            virtual,
            // AG-49612: Backend now provides ping and availability data
            ping,
            available,
        } = location;

        return {
            id,
            cityName,
            countryCode,
            countryName,
            premiumOnly,
            coordinates: [longitude, latitude],
            pingBonus,
            endpoints: endpoints.map(prepareEndpointData),
            virtual,
            // AG-49612: Pass through backend ping and availability
            ping,
            available,
        };
    };

    const preparedLocations = locations.map(prepareLocationData);

    return preparedLocations;
};

const getSplitter = (localeCode: string): string | null => {
    const dashSplitter = '-';
    const underscoreSplitter = '_';
    if (localeCode.indexOf(dashSplitter) > -1) {
        return dashSplitter;
    }
    if (localeCode.indexOf(underscoreSplitter) > -1) {
        return underscoreSplitter;
    }
    return null;
};

const getLocaleFirstPart = (localeCode: string, splitter: string): string => {
    const [firstPart] = localeCode.split(splitter);
    return firstPart;
};

const getLocalizedName = (names: [NameInterface], locale = DEFAULT_LOCALE): string | null => {
    if (!names) {
        return null;
    }

    const name = names.find((localizedName) => locale === localizedName.locale);
    if (name) {
        return name.name;
    }

    const splitter = getSplitter(locale);
    if (!splitter) {
        return getLocalizedName(names);
    }

    const localeFirstPart = getLocaleFirstPart(locale, splitter);
    return getLocalizedName(names, localeFirstPart);
};

const getCurrentLocation = async (): Promise<CurrentLocationData> => {
    const currentLocation = await vpnApi.getCurrentLocation();

    const {
        city,
        country,
        country_code: countryCode,
        ip,
        location: { latitude, longitude },
    } = currentLocation;

    const locale = browser.i18n.getUILanguage();
    const localizedCityName = city ? getLocalizedName(city.names, locale) : null;
    const localizedCountryName = country ? getLocalizedName(country.names, locale) : null;

    return {
        cityName: localizedCityName,
        countryName: localizedCountryName,
        countryCode,
        ip,
        coordinates: [longitude, latitude],
    };
};

const getVpnExtensionInfo = async (
    appId: string,
    vpnToken: string,
): Promise<VpnExtensionInfoInterface> => {
    const info = await vpnApi.getVpnExtensionInfo(appId, vpnToken);

    const {
        bandwidth_free_mbits: bandwidthFreeMbits,
        premium_promo_page: premiumPromoPage,
        premium_promo_enabled: premiumPromoEnabled,
        refresh_tokens: refreshTokens,
        vpn_failure_page: vpnFailurePage,
        used_downloaded_bytes: usedDownloadedBytes,
        used_uploaded_bytes: usedUploadedBytes,
        max_downloaded_bytes: maxDownloadedBytes,
        max_uploaded_bytes: maxUploadedBytes,
        renewal_traffic_date: renewalTrafficDate,
        max_devices_count: maxDevicesCount,
        email_confirmation_required: emailConfirmationRequired,
    } = info;

    return {
        bandwidthFreeMbits,
        premiumPromoPage,
        premiumPromoEnabled,
        refreshTokens,
        vpnFailurePage,
        usedDownloadedBytes,
        usedUploadedBytes,
        maxDownloadedBytes,
        maxUploadedBytes,
        renewalTrafficDate,
        maxDevicesCount,
        emailConfirmationRequired,
    };
};

const getVpnCredentials = async (
    appId: string,
    vpnToken: string,
    version: string,
    helpUsImprove: boolean,
): Promise<CredentialsDataInterface> => {
    let responseData;
    try {
        responseData = await vpnApi.getVpnCredentials(appId, vpnToken, version, helpUsImprove);
    } catch (e) {
        if (e.status === 400) {
            let errorMessageData;

            // if unable to parse message throw error as is
            try {
                errorMessageData = JSON.parse(e.message);
            } catch (parseError) {
                throw e;
            }

            // if license status is limit exceeded we do not throw error
            if (errorMessageData?.license_status === 'LIMIT_EXCEEDED') {
                responseData = errorMessageData;
            } else {
                throw e;
            }
        } else {
            throw e;
        }
    }

    const {
        license_status: licenseStatus,
        result: { credentials, expires_in_sec: expiresInSec },
        time_expires_sec: timeExpiresSec,
    } = responseData;

    return {
        licenseStatus,
        result: {
            credentials,
            expiresInSec,
        },
        timeExpiresSec,
    };
};

/**
 * Tracks vpn extensions install.
 *
 * @param appId
 * @param version
 * @param experiments
 *
 * @returns Promise with track install response.
 */
const trackExtensionInstallation = async (
    appId: string,
    version: string,
    experiments: string,
): Promise<TrackInstallResponse> => {
    const rawResponse = await vpnApi.trackExtensionInstallation(appId, version, experiments);
    let response;
    try {
        response = v.parse(trackInstallResponseSchema, rawResponse);
    } catch (e) {
        log.error('[vpn.vpnProvider]: Error while parsing track install response', e);
        response = {};
    }
    return response;
};

const prepareLogs = async (appLogs: string): Promise<Blob> => {
    const LOGS_FILENAME = 'logs.txt';

    const zip = new JSZip();
    zip.file(LOGS_FILENAME, appLogs);
    const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
            level: 9,
        },
    });
    return zipBlob;
};

const requestSupport = async ({
    appId,
    token,
    email,
    message,
    version,
    appLogs,
}: RequestSupportParameters): Promise<{ status: string, error: string | null }> => {
    const BUG_REPORT_SUBJECT = '[VPN Browser extension] Bug report';
    const LOGS_ZIP_FILENAME = 'logs.zip';

    const formData = new FormData();

    formData.append('app_id', appId);
    formData.append('token', token);
    formData.append('email', email);
    formData.append('message', message);
    formData.append('version', version);
    formData.append('subject', BUG_REPORT_SUBJECT);

    if (appLogs) {
        const preparedAppLogs = await prepareLogs(appLogs);
        formData.append('app_logs', preparedAppLogs, LOGS_ZIP_FILENAME);
    }

    try {
        await vpnApi.requestSupport(formData);
        return { status: 'ok', error: null };
    } catch (e) {
        log.error('[vpn.vpnProvider]: ', e);
        return {
            status: e.status,
            error: 'error',
        };
    }
};

const getExclusionsServicesDomains = async (serviceIds: string[]): Promise<ExclusionServicesDomains> => {
    const exclusionServiceDomains = await vpnApi.getExclusionServiceDomains(serviceIds);
    return processExclusionServicesDomains(exclusionServiceDomains);
};

/**
 * Moved to separate module in order to not mangle with webextension-polyfill.
 *
 * @returns Promise with exclusions services.
 */
export const getExclusionsServices = async (): Promise<ServicesInterface> => {
    const [exclusionsServices, servicesDomains] = await Promise.all([
        vpnApi.getExclusionsServices(),
        getExclusionsServicesDomains([]),
    ]);

    return processExclusionServices(exclusionsServices, servicesDomains);
};

export const vpnProvider: VpnProviderInterface = {
    getCurrentLocation,
    getVpnExtensionInfo,
    getVpnCredentials,
    trackExtensionInstallation,
    getLocationsData,
    requestSupport,
    getExclusionsServices,
};
