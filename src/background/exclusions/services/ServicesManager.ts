import browser from 'webextension-polyfill';
import axios from 'axios';

import { vpnProvider } from '../../providers/vpnProvider';
import { browserApi } from '../../browserApi';
import { log } from '../../../common/logger';
import { type ServiceDto } from '../../../common/exclusionsConstants';
import { fetchConfig } from '../../../common/fetch-config';
import { StateData } from '../../stateStorage';
import { StorageKey, type ServicesInterface, type ServicesIndexType } from '../../schema';

import { type Service } from './Service';

interface ServiceManagerInterface {
    /**
     * Initializes service manager.
     */
    init(): Promise<void>;

    /**
     * Retrieves services.
     *
     * @returns Services data.
     */
    getServices(): Promise<ServicesInterface>;

    /**
     * Retrieves service by id.
     *
     * @param id Service id.
     *
     * @returns Service data or null if service with provided id does not exist.
     */
    getService(id: string): Promise<Service | null>;

    /**
     * Retrieves indexed services.
     *
     * @return Indexed services.
     */
    getIndexedServices(): Promise<ServicesIndexType>;

    /**
     * Retrieves services data as list.
     *
     * @return List of services.
     */
    getServicesDto(): Promise<ServiceDto[]>;

    /**
     * Sets services data.
     *
     * @param services Services data.
     */
    setServices(services: ServicesInterface): Promise<void>;

    /**
     * Updates services data from server if needed.
     */
    updateServices(): Promise<void>;

    /**
     * Gets exclusions services from server.
     *
     * @returns Services data from server.
     */
    getServicesFromServer(): Promise<ServicesInterface>;

    /**
     * Retrieves services data from server or from assets.
     *
     * @returns Services data from server or assets.
     */
    getServicesForMigration(): Promise<ServicesInterface>;

    /**
     * Saves provided services in storage.
     *
     * @param services Services data.
     */
    saveServicesInStorage(services: ServicesInterface): Promise<void>;

    /**
     * Retrieves services data from storage.
     *
     * @returns Services data from storage or null if not found.
     */
    getServicesFromStorage(): Promise<ServicesInterface | null>
}

export class ServicesManager implements ServiceManagerInterface {
    /**
     * Update once in 24 hours.
     */
    private UPDATE_TIMEOUT_MS = 1000 * 60 * 60 * 24;

    /**
     * Key constant for storage.
     */
    private EXCLUSION_SERVICES_STORAGE_KEY = 'exclusions_services';

    /**
     * Services manager service state data.
     * Used to save and retrieve services manager state from session storage,
     * in order to persist it across service worker restarts.
     */
    private servicesManagerState = new StateData(StorageKey.ExclusionsServicesManagerState);

    /** @inheritdoc */
    public async init(): Promise<void> {
        const persistentServices = await this.getServicesFromStorage();
        if (persistentServices) {
            await this.setServices(persistentServices);
            return;
        }

        await this.updateServices();
        const { services } = await this.servicesManagerState.get();
        if (services) {
            await this.setServices(services);
        }
    }

    /** @inheritdoc */
    public async getServices(): Promise<ServicesInterface> {
        await this.updateServices();

        const { services } = await this.servicesManagerState.get();

        return services ?? {};
    }

    /** @inheritdoc */
    public async getService(id: string): Promise<Service | null> {
        const { services } = await this.servicesManagerState.get();
        const service = services?.[id] ?? null;
        return service;
    }

    /** @inheritdoc */
    public async getIndexedServices(): Promise<ServicesIndexType> {
        const { servicesIndex } = await this.servicesManagerState.get();
        return servicesIndex;
    }

    /**
     * Returns map with services index by domain.
     *
     * @param services Services data.
     *
     * @return Services index by domain.
     */
    public static getServicesIndex(services: ServicesInterface): ServicesIndexType {
        return Object.values(services).reduce((acc: ServicesIndexType, service) => {
            service.domains?.forEach((domain) => {
                acc[domain] = service.serviceId;
            });

            return acc;
        }, {});
    }

    /** @inheritdoc */
    public async getServicesDto(): Promise<ServiceDto[]> {
        await this.updateServices();

        const { services } = await this.servicesManagerState.get();
        if (!services) {
            return [];
        }

        return Object.values(services).map((service) => {
            return {
                serviceId: service.serviceId,
                serviceName: service.serviceName,
                iconUrl: service.iconUrl,
                categories: service.categories,
                domains: service.domains,
            };
        });
    }

    /** @inheritdoc */
    public async setServices(services: ServicesInterface): Promise<void> {
        await this.servicesManagerState.update({
            services,
            servicesIndex: ServicesManager.getServicesIndex(services),
        });
    }

    /** @inheritdoc */
    public async updateServices(): Promise<void> {
        const { lastUpdateTimeMs } = await this.servicesManagerState.get();

        const shouldUpdate = lastUpdateTimeMs === null
            || (Date.now() - lastUpdateTimeMs) > this.UPDATE_TIMEOUT_MS;

        if (!shouldUpdate) {
            return;
        }

        try {
            const services = await this.getServicesFromServer();
            await this.saveServicesInStorage(services);
            await this.setServices(services);
            await this.servicesManagerState.update({ lastUpdateTimeMs: Date.now() });
            log.info('Services data updated successfully');
        } catch (e) {
            log.error(new Error(`Was unable to get services due to: ${e.message}`));
        }
    }

    /** @inheritdoc */
    public async getServicesFromServer(): Promise<ServicesInterface> {
        const services = await vpnProvider.getExclusionsServices();
        return services;
    }

    /**
     * Gets exclusion services from assets,
     * used in migration in the cases when services server is not working.
     *
     * @returns Services data from assets.
     */
    private async getServicesFromAssets(): Promise<ServicesInterface> {
        const path = browser.runtime.getURL('assets/prebuild-data/exclusion-services.json');
        const response = await axios.get(path, { ...fetchConfig });
        return response.data;
    }

    /** @inheritdoc */
    public async getServicesForMigration(): Promise<ServicesInterface> {
        const SERVICES_RESPONSE_TIMEOUT_MS = 1000;
        let timeout: NodeJS.Timeout;
        const getFromAssetsWithTimeout = (): Promise<ServicesInterface> => new Promise<ServicesInterface>((resolve) => {
            timeout = setTimeout(async () => {
                const services = await this.getServicesFromAssets();
                log.debug(`Did not get services from server in ${SERVICES_RESPONSE_TIMEOUT_MS}`);
                log.debug('Return services from assets');
                resolve(services);
            }, SERVICES_RESPONSE_TIMEOUT_MS);
        });

        const getServicesFromServer = async (): Promise<ServicesInterface> => {
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

    /** @inheritdoc */
    public async saveServicesInStorage(services: ServicesInterface): Promise<void> {
        await browserApi.storage.set(this.EXCLUSION_SERVICES_STORAGE_KEY, services);
    }

    /** @inheritdoc */
    public async getServicesFromStorage(): Promise<ServicesInterface | null> {
        const services = await browserApi.storage.get<ServicesInterface>(
            this.EXCLUSION_SERVICES_STORAGE_KEY,
        );

        return services || null;
    }
}

export const servicesManager = new ServicesManager();
