import browser from 'webextension-polyfill';
import { vpnApi } from '../api';
import { ERROR_STATUSES } from '../../lib/constants';
import CustomError from '../../lib/CustomError';

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

            const {
                license_status: licenseStatus,
                time_expires_sec: timeExpiresSec,
            } = errorMessageData;

            if (licenseStatus === 'LIMIT_EXCEEDED') {
                throw new CustomError(
                    ERROR_STATUSES.LIMIT_EXCEEDED,
                    JSON.stringify({
                        licenseStatus,
                        timeExpiresSec,
                    })
                );
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

const vpnProvider = {
    getCurrentLocation,
    getVpnExtensionInfo,
    getVpnCredentials,
    postExtensionInstalled,
    getLocationsData,
};

export default vpnProvider;
