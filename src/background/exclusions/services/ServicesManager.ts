import browser from 'webextension-polyfill';
import axios from 'axios';

import { Service } from './Service';
import { vpnProvider } from '../../providers/vpnProvider';
import { browserApi } from '../../browserApi';
import { log } from '../../../lib/logger';
import { ServiceDto } from '../../../common/exclusionsConstants';
import { fetchConfig } from '../../../lib/constants';
import { sessionState } from '../../sessionStorage';
import {
    StorageKey,
    ServicesInterface,
    ServicesIndexType,
    ServicesManagerState,
} from '../../schema';

interface ServiceManagerInterface {
    init: () => Promise<void>;
    getServices: () => ServicesInterface;
}

export class ServicesManager implements ServiceManagerInterface {
    // Update once in 24 hours
    private UPDATE_TIMEOUT_MS = 1000 * 60 * 60 * 24;

    // Key constant for storage
    private EXCLUSION_SERVICES_STORAGE_KEY = 'exclusions_services';

    state: ServicesManagerState;

    public init = async () => {
        this.state = sessionState.getItem(StorageKey.ExclusionsServicesManagerState);

        const services = await this.getServicesFromStorage();
        if (services) {
            this.setServices(services);
            return;
        }

        await this.updateServices();
        if (this.services) {
            this.setServices(this.services);
        }
    };

    private saveServicesManagerState = () => {
        sessionState.setItem(StorageKey.ExclusionsServicesManagerState, this.state);
    };

    get services() {
        return this.state.services;
    }

    set services(services: ServicesInterface | null) {
        this.state.services = services;
        this.saveServicesManagerState();
    }

    private get servicesIndex(): ServicesIndexType {
        return this.state.servicesIndex;
    }

    private set servicesIndex(servicesIndex: ServicesIndexType) {
        this.state.servicesIndex = servicesIndex;
        this.saveServicesManagerState();
    }

    private get lastUpdateTimeMs(): number | null {
        return this.state.lastUpdateTimeMs;
    }

    private set lastUpdateTimeMs(lastUpdateTimeMs: number | null) {
        this.state.lastUpdateTimeMs = lastUpdateTimeMs;
        this.saveServicesManagerState();
    }

    /**
     * Returns services data
     */
    getServices() {
        this.updateServices();
        return this.services ?? {};
    }

    /**
     * Returns service by provided id
     */
    getService(id: string): Service | null {
        if (!this.services) {
            return null;
        }

        const service = this.services[id];

        if (!service) {
            return null;
        }

        return service;
    }

    /**
     * Returns services index
     */
    getIndexedServices(): ServicesIndexType {
        return this.servicesIndex;
    }

    /**
     * Returns map with services index by domain
     * @param services
     */
    public static getServicesIndex(services: ServicesInterface): ServicesIndexType {
        return Object.values(services).reduce((acc: ServicesIndexType, service) => {
            service.domains?.forEach((domain) => {
                acc[domain] = service.serviceId;
            });

            return acc;
        }, {});
    }

    /**
     * Returns services data for list
     */
    getServicesDto(): ServiceDto[] {
        this.updateServices();

        if (!this.services) {
            return [];
        }

        return Object.values(this.services).map((service) => {
            return {
                serviceId: service.serviceId,
                serviceName: service.serviceName,
                iconUrl: service.iconUrl,
                categories: service.categories,
                domains: service.domains,
            };
        });
    }

    /**
     * Sets service and services index
     */
    setServices(services: ServicesInterface) {
        this.services = services;
        this.servicesIndex = ServicesManager.getServicesIndex(services);
    }

    /**
     * Updates services
     */
    async updateServices() {
        const shouldUpdate = this.lastUpdateTimeMs === null
            || (Date.now() - this.lastUpdateTimeMs) > this.UPDATE_TIMEOUT_MS;

        if (!shouldUpdate) {
            return;
        }

        try {
            const services = await this.getServicesFromServer();
            await this.saveServicesInStorage(services);
            this.setServices(services);
            this.lastUpdateTimeMs = Date.now();
            log.info('Services data updated successfully');
        } catch (e) {
            log.error(new Error(`Was unable to get services due to: ${e.message}`));
        }
    }

    /**
     * Gets exclusions services from server
     */
    async getServicesFromServer(): Promise<ServicesInterface> {
        const services = await vpnProvider.getExclusionsServices();

        return services;
    }

    /**
     * Gets exclusion services from assets,
     * used in migration in the cases when services server is not working
     */
    async getServicesFromAssets(): Promise<ServicesInterface> {
        const path = browser.runtime.getURL('assets/prebuild-data/exclusion-services.json');
        const response = await axios.get(path, { ...fetchConfig });
        return response.data;
    }

    /**
     * Returns services data from server or from assets
     */
    async getServicesForMigration() {
        const SERVICES_RESPONSE_TIMEOUT_MS = 1000;
        let timeout: NodeJS.Timeout;
        const getFromAssetsWithTimeout = () => new Promise<ServicesInterface>((resolve) => {
            timeout = setTimeout(async () => {
                const services = await this.getServicesFromAssets();
                log.debug(`Did not get services from server in ${SERVICES_RESPONSE_TIMEOUT_MS}`);
                log.debug('Return services from assets');
                resolve(services);
            }, SERVICES_RESPONSE_TIMEOUT_MS);
        });

        const getServicesFromServer = async () => {
            const services = await this.getServicesFromServer();
            clearTimeout(timeout);
            return services;
        };

        const services = await Promise.race([
            getServicesFromServer(),
            getFromAssetsWithTimeout(),
        ]);

        return services;
    }

    /**
     * Saves provided services in storage
     * @param services
     */
    async saveServicesInStorage(services: ServicesInterface): Promise<void> {
        await browserApi.storage.set(this.EXCLUSION_SERVICES_STORAGE_KEY, services);
    }

    /**
     * Returns services data from storage
     */
    async getServicesFromStorage(): Promise<ServicesInterface | null> {
        const services = await browserApi.storage.get<ServicesInterface>(
            this.EXCLUSION_SERVICES_STORAGE_KEY,
        );

        return services || null;
    }
}

export const servicesManager = new ServicesManager();
