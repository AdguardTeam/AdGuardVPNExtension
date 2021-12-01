import { action, computed, observable } from 'mobx';
import JSZip from 'jszip';
import format from 'date-fns/format';
import FileSaver from 'file-saver';

import { ExclusionsModes, ExclusionsTypes } from '../../common/exclusionsConstants';
import { containsIgnoreCase } from '../components/Exclusions/Search/SearchHighlighter/helpers';
import { Service, ServiceCategory, ServiceInterface } from '../../background/exclusions/Service';
import { ExclusionsGroup } from '../../background/exclusions/ExclusionsGroup';
import { Exclusion } from '../../background/exclusions/Exclusion';
// FIXME: convert to named export
import messenger from '../../lib/messenger';

export interface PreparedServiceCategory extends ServiceCategory {
    services: string[]
}

interface PreparedServiceCategories {
    [key: string]: PreparedServiceCategory
}

export interface PreparedService extends ServiceInterface {
    excluded: boolean
}

interface PreparedServices {
    [key: string]: PreparedService
}

export enum AddExclusionMode {
    SERVICE = 'SERVICE',
    MANUAL = 'MANUAL',
}

const DEFAULT_ADD_EXCLUSION_MODE = AddExclusionMode.MANUAL;

interface ExclusionModeInterface {
    excludedIps: Exclusion[];
    exclusionsGroups: ExclusionsGroup[];
    excludedServices: Service[];
}

interface ExclusionsInterface {
    [ExclusionsModes.Selective]: ExclusionModeInterface;
    [ExclusionsModes.Regular]: ExclusionModeInterface;
}

// FIXME unite with interface from background page
interface ExclusionsData extends ExclusionsInterface{
    currentMode: ExclusionsModes;
}

export class ExclusionsStore {
    @observable exclusions: ExclusionsInterface = {
        [ExclusionsModes.Selective]: {
            excludedIps: [],
            exclusionsGroups: [],
            excludedServices: [],
        },
        [ExclusionsModes.Regular]: {
            excludedIps: [],
            exclusionsGroups: [],
            excludedServices: [],
        },
    };

    @observable currentMode = ExclusionsModes.Regular;

    @observable servicesData: Service[] = [];

    @observable addExclusionModalOpen = false;

    @observable addSubdomainModalOpen = false;

    @observable removeAllModalOpen = false;

    @observable addExclusionMode = DEFAULT_ADD_EXCLUSION_MODE;

    @observable unfoldedServiceCategories: string[] = [];

    @observable unfoldAllServiceCategories: boolean = false;

    @observable exclusionIdToShowSettings: string | null = null;

    @observable exclusionsSearchValue: string = '';

    @observable servicesSearchValue: string = '';

    /**
     * Temp list used to keep state of services to be enabled or disabled
     */
    @observable servicesToToggle: string[] = [];

    @action setServicesData = (servicesData: Service[]) => {
        this.servicesData = servicesData;
    };

    @action setExclusionsData = (exclusionsData: ExclusionsData) => {
        this.exclusions = exclusionsData;
        this.currentMode = exclusionsData.currentMode;
    };

    @action updateExclusionsData = async () => {
        const exclusionsData = await messenger.getExclusionsData();
        this.setExclusionsData(exclusionsData);
    };

    get preparedExclusions() {
        const currentModeExclusions = this.exclusions[this.currentMode];

        const services = currentModeExclusions.excludedServices
            .map((service) => {
                return {
                    id: service.serviceId,
                    name: service.serviceName,
                    iconUrl: service.iconUrl,
                    state: service.state,
                    type: ExclusionsTypes.Service,
                };
            });

        const groups = currentModeExclusions.exclusionsGroups.map((group) => {
            return {
                id: group.id,
                name: group.hostname,
                iconUrl: '/assets/images/ip-icon.svg',
                state: group.state,
                type: ExclusionsTypes.Group,
            };
        });

        const excludedIps = currentModeExclusions.excludedIps.map((ip) => {
            return {
                id: ip.id,
                name: ip.hostname,
                iconUrl: '/assets/images/ip-icon.svg',
                state: ip.enabled,
                type: ExclusionsTypes.Ip,
            };
        });

        const allExclusions = [...services, ...groups, ...excludedIps];

        const filteredExclusions = allExclusions.filter((exclusion) => {
            if (this.exclusionsSearchValue.length === 0) {
                return true;
            }

            return containsIgnoreCase(exclusion.name, this.exclusionsSearchValue);
        });

        return filteredExclusions;
    }

    @action toggleInverted = async (mode: ExclusionsModes) => {
        this.currentMode = mode;
        await messenger.setExclusionsMode(mode);
    };

    @action openAddExclusionModal = () => {
        this.addExclusionModalOpen = true;
    };

    @action closeAddExclusionModal = () => {
        this.addExclusionModalOpen = false;
        this.setServicesSearchValue('');
    };

    @action
        setAddExclusionMode = (mode: AddExclusionMode) => {
            this.addExclusionMode = mode;
        };

    @action
        openAddSubdomainModal = () => {
            this.addSubdomainModalOpen = true;
        };

    @action
        closeAddSubdomainModal = () => {
            this.addSubdomainModalOpen = false;
        };

    @action
        openRemoveAllModal = () => {
            this.removeAllModalOpen = true;
        };

    @action
        closeRemoveAllModal = () => {
            this.removeAllModalOpen = false;
        };

    isExcludedService = (serviceId: string) => {
        return this.exclusions[this.currentMode].excludedServices
            .some((service) => service.serviceId === serviceId);
    };

    @computed
    get excludedServices() {
        return this.exclusions[this.currentMode].excludedServices;
    }

    @computed
    get preparedServicesData() {
        const categories = this.servicesData.reduce((acc, serviceData) => {
            const { categories, serviceId } = serviceData;

            categories.forEach((category) => {
                const foundCategory = acc[category.id];
                if (!foundCategory) {
                    acc[category.id] = {
                        id: category.id,
                        name: category.name,
                        services: [serviceId],
                    };
                } else {
                    foundCategory.services.push(serviceId);
                }
            });
            return acc;
        }, {} as PreparedServiceCategories);

        const services = this.servicesData.reduce((acc, serviceData) => {
            const { serviceId } = serviceData;
            acc[serviceId] = {
                ...serviceData,
                excluded: this.isExcludedService(serviceId),
            };
            return acc;
        }, {} as PreparedServices);

        return {
            categories,
            services,
        };
    }

    @action
    toggleCategoryVisibility(id: string) {
        const isUnfolded = this.unfoldedServiceCategories
            .some((categoryId) => categoryId === id);

        if (isUnfolded) {
            this.unfoldedServiceCategories = this.unfoldedServiceCategories
                .filter((categoryId) => categoryId !== id);
        } else {
            this.unfoldedServiceCategories.push(id);
        }
    }

    @action addUrlToExclusions = async (url: string) => {
        await messenger.addUrlToExclusions(url);
        await this.updateExclusionsData();
    };

    @action removeExclusion = async (id: string, type: ExclusionsTypes) => {
        await messenger.removeExclusion(id, type);
        await this.updateExclusionsData();
    };

    @action toggleExclusionState = async (id: string, type: ExclusionsTypes) => {
        await messenger.toggleExclusionState(id, type);
        await this.updateExclusionsData();
    };

    @action addService = async (id: string) => {
        await messenger.addService(id);
        await this.updateExclusionsData();
    };

    @action addToServicesToToggle = (id: string) => {
        if (this.servicesToToggle.includes(id)) {
            this.servicesToToggle = this.servicesToToggle
                .filter((serviceId) => serviceId !== id);
        } else {
            this.servicesToToggle.push(id);
        }
    };

    @action saveServicesToToggle = async () => {
        this.servicesToToggle.forEach((serviceId) => {
            this.addService(serviceId);
        });
        this.servicesToToggle = [];
        await this.updateExclusionsData();
    };

    @action setExclusionIdToShowSettings = (id: string | null) => {
        this.exclusionIdToShowSettings = id;
    };

    @action toggleSubdomainStateInExclusionsGroup = async (
        exclusionsGroupId: string,
        subdomainId: string,
    ) => {
        await messenger.toggleSubdomainStateInExclusionsGroup(exclusionsGroupId, subdomainId);
        await this.updateExclusionsData();
    };

    @action removeSubdomainFromExclusionsGroup = async (
        exclusionsGroupId: string,
        subdomainId: string,
    ) => {
        this.exclusions[this.currentMode].exclusionsGroups.forEach((group) => {
            if (group.id === exclusionsGroupId && group.exclusions[0].id === subdomainId) {
                // show exclusions list if main domain was removed
                this.exclusionIdToShowSettings = null;
            }
        });
        await messenger.removeSubdomainFromExclusionsGroup(exclusionsGroupId, subdomainId);
        await this.updateExclusionsData();
    };

    @action addSubdomainToExclusionsGroup = async (
        exclusionsGroupId: string,
        subdomain: string,
    ) => {
        await messenger.addSubdomainToExclusionsGroup(exclusionsGroupId, subdomain);
        await this.updateExclusionsData();
    };

    @action toggleExclusionsGroupStateInService = async (
        serviceId: string,
        exclusionsGroupId: string,
    ) => {
        await messenger.toggleExclusionsGroupStateInService(serviceId, exclusionsGroupId);
        await this.updateExclusionsData();
    };

    @action removeExclusionsGroupFromService = async (
        serviceId: string,
        exclusionsGroupId: string,
    ) => {
        await messenger.removeExclusionsGroupFromService(serviceId, exclusionsGroupId);
        await this.updateExclusionsData();
    };

    @action removeSubdomainFromExclusionsGroupInService = async (
        serviceId: string,
        exclusionsGroupId:string,
        subdomainId: string,
    ) => {
        const excludedService = this.exclusions[this.currentMode].excludedServices
            .find((service) => service.serviceId === serviceId);
        if (!excludedService) {
            throw new Error('Service should be found');
        }

        const exclusionsGroupToRemove = excludedService.exclusionsGroups
            .find((group) => group.id === exclusionsGroupId);
        if (!exclusionsGroupToRemove) {
            throw new Error('Group should be found');
        }

        if (exclusionsGroupToRemove.exclusions[0].id === subdomainId) {
            // show service screen if main domain was removed
            this.exclusionIdToShowSettings = serviceId;
        }

        await messenger.removeSubdomainFromExclusionsGroupInService(
            serviceId,
            exclusionsGroupId,
            subdomainId,
        );
        await this.updateExclusionsData();
    };

    @action toggleSubdomainStateInExclusionsGroupInService = async (
        serviceId: string,
        exclusionsGroupId:string,
        subdomainId: string,
    ) => {
        await messenger.toggleSubdomainStateInExclusionsGroupInService(
            serviceId,
            exclusionsGroupId,
            subdomainId,
        );
        await this.updateExclusionsData();
    };

    @action addSubdomainToExclusionsGroupInService = async (
        serviceId: string,
        exclusionsGroupId:string,
        subdomainId: string,
    ) => {
        await messenger.addSubdomainToExclusionsGroupInService(
            serviceId,
            exclusionsGroupId,
            subdomainId,
        );
        await this.updateExclusionsData();
    };

    @computed
    get exclusionDataToShow() {
        if (!this.exclusionIdToShowSettings) {
            return null;
        }

        const serviceData = this.exclusions[this.currentMode].excludedServices
            .find(({ serviceId }) => serviceId === this.exclusionIdToShowSettings);

        const servicesGroupData = this.exclusions[this.currentMode].excludedServices
            .map(({ exclusionsGroups }) => exclusionsGroups)
            .flat()
            .find(({ id }) => id === this.exclusionIdToShowSettings);

        const groupData = this.exclusions[this.currentMode].exclusionsGroups
            .find(({ id }) => id === this.exclusionIdToShowSettings);

        return serviceData || servicesGroupData || groupData || null;
    }

    /**
     * Checks if ExclusionsGroup is inside Service and returns Service id or null
     * @param exclusionsGroupId
     */
    @action isExclusionsGroupInsideService = (exclusionsGroupId: string) => {
        const service = this.exclusions[this.currentMode].excludedServices
            .find((service) => service.exclusionsGroups
                .find(({ id }) => id === exclusionsGroupId));
        return service ? service.serviceId : null;
    };

    @action setExclusionsSearchValue = (value: string) => {
        this.exclusionsSearchValue = value;
    };

    @action setUnfoldAllServiceCategories = (unfold: boolean) => {
        this.unfoldAllServiceCategories = unfold;
    };

    @action setServicesSearchValue = (value: string) => {
        this.servicesSearchValue = value;

        this.setUnfoldAllServiceCategories(this.servicesSearchValue.length > 0);
    };

    @action resetServiceData = async (serviceId: string) => {
        await messenger.resetServiceData(serviceId);
        await this.updateExclusionsData();
    };

    @action clearExclusionsList = async () => {
        await messenger.clearExclusionsList();
        await this.updateExclusionsData();
    };

    exportExclusions = async () => {
        const nowFormatted = format(Date.now(), 'yyyy_MM_dd-HH_mm_ss');
        const ZIP_FILENAME = `exclusions-${nowFormatted}.zip`;

        const EXCLUSION_FILES_EXTENSIONS = {
            REGULAR: '.regular.txt',
            SELECTIVE: '.selective.txt',
        };

        const zip = new JSZip();
        zip.file(`${nowFormatted}${EXCLUSION_FILES_EXTENSIONS.REGULAR}`, JSON.stringify(this.exclusions[ExclusionsModes.Regular], null, 4));
        zip.file(`${nowFormatted}${EXCLUSION_FILES_EXTENSIONS.SELECTIVE}`, JSON.stringify(this.exclusions[ExclusionsModes.Selective], null, 4));

        const zipContent = await zip.generateAsync({ type: 'blob' });
        FileSaver.saveAs(zipContent, ZIP_FILENAME);
    };

    // FIXME remove @ts-ignore
    // @ts-ignore
    @action importExclusions = async (exclusionsData) => {
        await messenger.importExclusionsData(exclusionsData);
        await this.updateExclusionsData();
    };
}
