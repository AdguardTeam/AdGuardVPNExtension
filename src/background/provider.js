import browser from 'webextension-polyfill';
import { vpnApi } from './api';

const getEndpoints = async () => {
    const endpointsObj = await vpnApi.getEndpoints();
    const { endpoints } = endpointsObj;
    console.log('endpoints', endpoints);
    const normalizedEndpoints = endpoints.reduce((acc, endpoint) => {
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
    const DEFAULT_LOCALE = 'en';
    // eslint-disable-next-line no-param-reassign
    locale = locale || DEFAULT_LOCALE;

    const name = names.find(localizedName => locale === localizedName.locale);
    if (name) {
        return name;
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
    const localizedCityName = getLocalizedName(city.names, locale);
    const localizedCountryName = getLocalizedName(country.names, locale);

    return {
        cityName: localizedCityName.name,
        countryName: localizedCountryName.name,
        countryCode,
        ip,
        coordinates: [longitude, latitude],
    };
};

const provider = {
    getEndpoints,
    getCurrentLocation,
};

export default provider;
