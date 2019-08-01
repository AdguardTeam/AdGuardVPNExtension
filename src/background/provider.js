import api from './api';

// TODO [maximtop] remove when will be added
const addExampleEndpoints = (data) => {
    const exampleEndpoints = {
        uk: {
            city: 'London',
        },
        ja: {
            city: 'Tokio',
        },
        us: {
            city: 'United States',
            premiumOnly: true,
        },
    };
    return {
        ...data,
        ...exampleEndpoints,
    };
};

const getEndpoints = async () => {
    const endpointsObj = await api.getEndpoints();
    const { endpoints } = endpointsObj;
    const normalizedEndpoints = endpoints.reduce((acc, endpoint) => {
        const {
            domain_name: domainName,
            premium_only: premiumOnly,
        } = endpoint;
        return {
            ...acc,
            [domainName]: {
                ...endpoint,
                id: domainName,
                premiumOnly,
            },
        };
    }, {});
    console.log(normalizedEndpoints);
    return addExampleEndpoints(normalizedEndpoints);
};

const provider = {
    getEndpoints,
};

export default provider;
