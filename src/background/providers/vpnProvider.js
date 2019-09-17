import browser from 'webextension-polyfill';
import uniqBy from 'lodash/uniqBy';
import { vpnApi } from '../api';
import log from '../../lib/logger';

const getEndpoints = async (vpnToken) => {
    const endpointsObj = await vpnApi.getEndpoints(vpnToken);
    log.info(endpointsObj);
    const { endpoints } = endpointsObj;
    const uniqEndpoints = uniqBy(endpoints, 'city_name');
    const normalizedEndpoints = uniqEndpoints.reduce((acc, endpoint) => {
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
    return normalizedEndpoints;
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

const vpnProvider = {
    getEndpoints,
    getCurrentLocation,
};

export default vpnProvider;
