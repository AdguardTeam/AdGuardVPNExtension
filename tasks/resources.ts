import { vpnApi } from '../src/background/api';
import browser from 'webextension-polyfill';
import axios from 'axios';
import CustomError from '../src/lib/CustomError';
import { ERROR_STATUSES } from '../src/lib/constants';

const makeRequest = async (path, config, method = 'POST') => {
    const url = `https://${await this.getBaseUrl()}/${path}`;
    try {
        const response = await axios({
            url,
            method,
            ...config,
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new CustomError(error.response.status, JSON.stringify(error.response.data));
        }
        throw new CustomError(ERROR_STATUSES.NETWORK_ERROR, `${url} | ${error.message || JSON.stringify(error)}`);
    }
}

const EXCLUSION_SERVICES = { path: 'v2/exclusion_services', method: 'GET' };

const getExclusionsServices = () => {
    const { path, method } = EXCLUSION_SERVICES;
    const language = browser.i18n.getUILanguage();

    const params = {
        locale: language,
    };

    return this.makeRequest(path, { params }, method);
};

export const getExclusionsServices = async () => {
    const exclusionsServices = await vpnApi.getExclusionsServices();

    const { categories = [], services = [] } = exclusionsServices;

    const processedCategories = categories.reduce((acc, category) => {
        acc[category.id] = category;
        return acc;
    }, {});

    const processedServices = services
        .map((exclusionService) => {
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
        })
        .reduce((acc, service) => {
            acc[service.serviceId] = service;
            return acc;
        }, {});

    const servicesResult = {};

    const servicesDomains = await getExclusionsServicesDomains([]);

    Object.values(processedServices).forEach((rawService) => {
        const categories = rawService.categories.map((categoryId) => {
            const category = processedCategories[categoryId];
            return category;
        });

        const { domains } = servicesDomains[rawService.serviceId];
        const service = { ...rawService, categories, domains };

        servicesResult[service.serviceId] = service;
    });

    return servicesResult;
};

const updateExclusionServices = async () => {
    const services = await getExclusionsServices();
    console.log(services);
};

const resources = async () => {
    try {
        updateExclusionServices();
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
};

resources();
