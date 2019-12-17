import browser from 'webextension-polyfill';
import uniqBy from 'lodash/uniqBy';
import { vpnApi } from '../api';

const getEndpoints = async (vpnToken) => {
    const endpointsObj = await vpnApi.getEndpoints(vpnToken);
    const { endpoints } = endpointsObj;
    const uniqEndpoints = uniqBy(endpoints, 'city_name');
    return uniqEndpoints.reduce((acc, endpoint) => {
        const {
            city_name: cityName,
            country_code: countryCode,
            country_name: countryName,
            domain_name: domainName,
            latitude,
            longitude,
            premium_only: premiumOnly,
            public_key: publicKey,
        } = endpoint;

        return {
            ...acc,
            [domainName]: {
                id: domainName,
                cityName,
                countryCode,
                countryName,
                domainName,
                coordinates: [longitude, latitude],
                premiumOnly,
                publicKey,
            },
        };
    }, {});
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

    const name = names.find(localizedName => locale === localizedName.locale);
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
    } = info;

    return {
        bandwidthFreeMbits,
        premiumPromoPage,
        premiumPromoEnabled,
        refreshTokens,
        vpnFailurePage,
    };
};

const getVpnCredentials = async (appId, vpnToken) => {
    const responseData = await vpnApi.getVpnCredentials(appId, vpnToken);

    const {
        license_status: licenseStatus,
        result: { credentials, expires_in_sec: expiresInSec },
        time_expires_sec: timeExpiresSec,
    } = responseData;

    return {
        licenseStatus,
        result: { credentials, expiresInSec },
        timeExpiresSec,
    };
};

const postExtensionInstalled = async (appId) => {
    return vpnApi.postExtensionInstalled(appId);
};

const vpnProvider = {
    getEndpoints,
    getCurrentLocation,
    getVpnExtensionInfo,
    getVpnCredentials,
    postExtensionInstalled,
};

export default vpnProvider;
