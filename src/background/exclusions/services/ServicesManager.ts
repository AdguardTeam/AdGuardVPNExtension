import browser from 'webextension-polyfill';
import axios from 'axios';
import isEqual from 'lodash/isEqual';

import { vpnProvider } from '../../providers/vpnProvider';
import { browserApi } from '../../browserApi';
import { i18n } from '../../../common/i18n';
import { normalizeLanguage } from '../../../common/utils/promo';
import { log } from '../../../common/logger';
import { type ServiceDto } from '../../../common/exclusionsConstants';
import { fetchConfig } from '../../../common/fetch-config';
import { PromiseQueue } from '../../../common/promiseQueue';
import { StateData } from '../../stateStorage';
import { StorageKey, type ServicesInterface, type ServicesIndexType } from '../../schema';

import { type Service } from './Service';

const { decorator: serialized } = new PromiseQueue();

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
     *
     * @param force If true, skips the update timeout check and fetches from server.
     * @param locale Locale to record after a successful fetch. Defaults to the current app locale.
     * @returns True if the services were fetched from the server; false if the
     * update was skipped (update timeout has not expired yet) or the fetch failed.
     */
    updateServices(force?: boolean, locale?: string): Promise<boolean>;

    /**
     * Retrieves the locale for which the services were last successfully fetched.
     *
     * @returns Locale code or null if services have never been fetched.
     */
    getLastUpdateLocale(): Promise<string | null>;

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

            const locale = i18n.getUILanguage();
            const lastUpdateLocale = await this.getLastUpdateLocale();
            if (lastUpdateLocale !== locale) {
                await this.updateServices(true, locale);
            }

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
    @serialized
    public async updateServices(force = false, locale = i18n.getUILanguage()): Promise<boolean> {
        const { lastUpdateTimeMs, services: currentServices } = await this.servicesManagerState.get();
        const normalizedLocale = normalizeLanguage(locale) ?? locale;

        const shouldUpdate = force
            || lastUpdateTimeMs === null
            || (Date.now() - lastUpdateTimeMs) > this.UPDATE_TIMEOUT_MS;

        if (!shouldUpdate) {
            return false;
        }

        try {
            const services = await this.getServicesFromServer();
            const servicesChanged = !isEqual(currentServices, services);
            if (servicesChanged) {
                await this.saveServicesInStorage(services);
                await this.setServices(services);
            }

            await this.servicesManagerState.update({
                lastUpdateTimeMs: Date.now(),
                lastUpdateLocale: normalizedLocale,
            });
            log.info('[vpn.ServicesManager.updateServices]: Services data updated successfully');
            return true;
        } catch (e) {
            log.error('[vpn.ServicesManager.updateServices]: ', new Error(`Was unable to get services due to: ${e.message}`));
            return false;
        }
    }

    /** @inheritdoc */
    public async getLastUpdateLocale(): Promise<string | null> {
        const { lastUpdateLocale } = await this.servicesManagerState.get();
        return lastUpdateLocale;
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
                log.debug(`[vpn.ServicesManager.getServicesForMigration]: Did not get services from server in ${SERVICES_RESPONSE_TIMEOUT_MS}`);
                log.debug('[vpn.ServicesManager.getServicesForMigration]: Return services from assets');
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
