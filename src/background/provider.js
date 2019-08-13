import { vpnApi } from './api';

// TODO [maximtop] remove when api will return data correctly
const addExampleEndpoints = (data) => {
    const exampleEndpoints = {
        ru: {
            id: 'ru',
            cityName: 'Moscow',
            countryName: 'Russia',
            coordinates: [37.6173, 55.7558],
        },
        de: {
            id: 'de',
            cityName: 'Berlin',
            countryName: 'Germany',

        },
        fr: {
            id: 'fr',
            cityName: 'Paris',
            countryName: 'France',
            coordinates: [2.3522, 48.8566],
        },
        uk: {
            id: 'uk',
            cityName: 'London',
            countryName: 'Great Britain',
        },
        ja: {
            id: 'ja',
            cityName: 'Tokyo',
            countryName: 'Japan',
            coordinates: [139.6917, 35.6895],
        },
        us: {
            id: 'us',
            cityName: 'New York',
            countryName: 'United States',
            premiumOnly: true,
            coordinates: [-74.0059, 40.7128],
        },
    };
    return {
        ...data,
        ...exampleEndpoints,
    };
};

const getEndpoints = async () => {
    // const endpointsObj = await vpnApi.getEndpoints();
    // const { endpoints } = endpointsObj;
    // const normalizedEndpoints = endpoints.reduce((acc, endpoint) => {
    //     const {
    //         domain_name: domainName,
    //         premium_only: premiumOnly,
    //         city_name: cityName,
    //     } = endpoint;
    //     return {
    //         ...acc,
    //         [domainName]: {
    //             ...endpoint,
    //             id: domainName,
    //             premiumOnly,
    //             cityName,
    //         },
    //     };
    // }, {});
    const normalizedEndpoints = {};
    return addExampleEndpoints(normalizedEndpoints);
};

const getStats = () => vpnApi.getStats();

const provider = {
    getEndpoints,
    getStats,
};

export default provider;
