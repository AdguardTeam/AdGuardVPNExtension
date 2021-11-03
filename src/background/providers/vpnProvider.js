import browser from 'webextension-polyfill';
import JSZip from 'jszip';

import { vpnApi } from '../api';
import { log } from '../../lib/logger';

/**
 * Prepares locations data
 * @param vpnToken
 * @returns {Promise<*>}
 */
const getLocationsData = async (vpnToken) => {
    const locationsData = await vpnApi.getLocations(vpnToken);

    const { locations = [] } = locationsData;

    const prepareEndpointData = (endpoint) => {
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

    const prepareLocationData = (location) => {
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
        };
    };

    const preparedLocations = locations.map(prepareLocationData);

    return preparedLocations;
};

const getSplitter = (localeCode) => {
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

const getLocaleFirstPart = (localeCode, splitter) => {
    const [firstPart] = localeCode.split(splitter);
    return firstPart;
};

const getLocalizedName = (names, locale) => {
    if (!names) {
        return null;
    }
    const DEFAULT_LOCALE = 'en';
    // eslint-disable-next-line no-param-reassign
    locale = locale || DEFAULT_LOCALE;

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

const getCurrentLocation = async () => {
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

const getVpnExtensionInfo = async (vpnToken) => {
    const info = await vpnApi.getVpnExtensionInfo(vpnToken);

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
    };
};

const getVpnCredentials = async (appId, vpnToken) => {
    let responseData;
    try {
        responseData = await vpnApi.getVpnCredentials(appId, vpnToken);
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

const postExtensionInstalled = async (appId) => {
    return vpnApi.postExtensionInstalled(appId);
};

const prepareLogs = async (appLogs) => {
    const LOGS_FILENAME = 'logs.txt';

    const zip = new JSZip();
    zip.file(LOGS_FILENAME, appLogs);
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return zipBlob;
};

const requestSupport = async ({
    appId,
    token,
    email,
    message,
    version,
    appLogs,
}) => {
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
        return { status: 'ok' };
    } catch (e) {
        log.error(e);
        return {
            status: e.status,
            error: 'error',
        };
    }
};

// TODO if no services returned, use default list
// TODO if services were returned recently,
//  but they are not returned now, we should use services from the storage
const getExclusionsServices = async () => {
    let exclusionsServices;
    try {
        exclusionsServices = await vpnApi.getExclusionsServices();
    } catch (e) {
        log.error(e);
        exclusionsServices = [];
    }

    // [ {
    //     "service_id" : "whatsapp",
    //     "service_name" : "WhatsApp",
    //     "icon_url" : "https://icons.adguard.org/icon?domain=whatsapp.com",
    //     "categories" : [ "MESSENGERS" ],
    //     "modified_time" : "2021-10-29T09:58:04+0000"
    // } ]
    return exclusionsServices.map((exclusionService) => {
        const {
            service_id: serviceId,
            service_name: serviceName,
            icon_url: iconUrl,
            categories,
            modified_time: modifiedTime,
        } = exclusionService;

        return {
            serviceId,
            serviceName,
            iconUrl,
            categories,
            modifiedTime,
        };
    });
};

const getExclusionsServicesDomains = async (serviceIds) => {
    let exclusionServiceDomains;
    try {
        exclusionServiceDomains = await vpnApi.getExclusionServiceDomains(serviceIds);
    } catch (e) {
        log.error(e);
        exclusionServiceDomains = [];
    }
    return exclusionServiceDomains.services.map((exclusion) => {
        const {
            service_id: serviceId,
            domains,
        } = exclusion;

        return {
            serviceId,
            domains,
        };
    });
};

const vpnProvider = {
    getCurrentLocation,
    getVpnExtensionInfo,
    getVpnCredentials,
    postExtensionInstalled,
    getLocationsData,
    requestSupport,
    getExclusionsServices,
    getExclusionsServicesDomains,
};

export default vpnProvider;
