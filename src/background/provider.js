import { proxyApi } from './api';

// TODO [maximtop] remove when api will return data correctly
const addExampleEndpoints = (data) => {
    const exampleEndpoints = {
        uk: {
            id: 'uk',
            cityName: 'London',
        },
        ja: {
            id: 'ja',
            cityName: 'Tokio',
        },
        us: {
            id: 'us',
            cityName: 'United States',
            premiumOnly: true,
        },
    };
    return {
        ...data,
        ...exampleEndpoints,
    };
};

const getEndpoints = async () => {
    const endpointsObj = await proxyApi.getEndpoints();
    const { endpoints } = endpointsObj;
    const normalizedEndpoints = endpoints.reduce((acc, endpoint) => {
        const {
            domain_name: domainName,
            premium_only: premiumOnly,
            city_name: cityName,
        } = endpoint;
        return {
            ...acc,
            [domainName]: {
                ...endpoint,
                id: domainName,
                premiumOnly,
                cityName,
            },
        };
    }, {});
    return addExampleEndpoints(normalizedEndpoints);
};

const getStats = () => proxyApi.getStats();

const provider = {
    getEndpoints,
    getStats,
};

export default provider;
