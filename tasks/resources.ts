import fs from 'fs';
import path from 'path';

import axios, { type AxiosRequestConfig } from 'axios';
import dotenv from 'dotenv';

import {
    type ExclusionServices,
    processExclusionServices,
    processExclusionServicesDomains,
} from '../src/common/data-processors';

dotenv.config();

const makeRequest = async (path: string, config: Partial<AxiosRequestConfig>, method = 'POST') => {
    const url = `https://${process.env.VPN_API_URL}/api/${path}`;

    const response = await axios({
        url,
        method,
        ...config,
    } as AxiosRequestConfig);

    return response.data;
};

const EXCLUSION_SERVICES = { path: 'v2/exclusion_services', method: 'GET' };

const getExclusionServicesFromServer = () => {
    const { path, method } = EXCLUSION_SERVICES;

    const params = {
        locale: 'en',
    };

    return makeRequest(path, { params }, method);
};

const EXCLUSION_SERVICE_DOMAINS = { path: 'v1/exclusion_services/domains', method: 'GET' };

const getExclusionServicesDomainsFromServer = (servicesIds: string[] = []) => {
    const { path, method } = EXCLUSION_SERVICE_DOMAINS;

    const params = {
        service_id: servicesIds.join(','),
    };

    return makeRequest(path, { params }, method);
};

const getExclusionsServicesFromServer = async () => {
    const rawExclusionServices = await getExclusionServicesFromServer();
    const rawServicesDomains = await getExclusionServicesDomainsFromServer();

    const servicesDomains = processExclusionServicesDomains(rawServicesDomains);
    const exclusionServices = processExclusionServices(rawExclusionServices, servicesDomains);

    return exclusionServices;
};

const saveExclusionServicesInFile = (services: ExclusionServices) => {
    const EXCLUSION_SERVICES_PATH = path.resolve(__dirname, '../src/assets/prebuild-data/');
    const EXCLUSION_SERVICES_FILE = 'exclusion-services.json';

    const exclusionServicesJson = JSON.stringify(services, null, 4);

    fs.mkdirSync(EXCLUSION_SERVICES_PATH, { recursive: true });

    fs.writeFileSync(
        path.join(EXCLUSION_SERVICES_PATH, EXCLUSION_SERVICES_FILE),
        exclusionServicesJson,
    );
};

const updateExclusionServices = async () => {
    const services = await getExclusionsServicesFromServer();
    saveExclusionServicesInFile(services);
};

const resources = async () => {
    try {
        updateExclusionServices();
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
        process.exit(1);
    }
};

resources();
