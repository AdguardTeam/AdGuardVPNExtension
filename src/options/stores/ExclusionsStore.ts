import punycode from 'punycode';

import {
    action,
    computed,
    observable,
    runInAction,
    toJS,
} from 'mobx';
import { isIP } from 'is-ip';
import { getDomain } from 'tldts';

import {
    type ExclusionDtoInterface,
    type ExclusionsData,
    ExclusionsMode,
    ExclusionState,
    ExclusionsType,
    type ServiceDto,
} from '../../common/exclusionsConstants';
import { messenger } from '../../common/messenger';
import { containsIgnoreCase } from '../../common/components/SearchHighlighter/helpers';
import type { ServiceCategory } from '../../background/schema';

import type { RootStore } from './RootStore';

export interface PreparedServiceCategory extends ServiceCategory {
    services: string[]
}

interface PreparedServiceCategories {
    [key: string]: PreparedServiceCategory
}

interface PreparedServices {
    [key: string]: ServiceDto
}

interface PreparedServicesData {
    categories: PreparedServiceCategories;
    services: PreparedServices;
}

export enum AddExclusionMode {
    Service = 'Service',
    Manual = 'Manual',
}

const DEFAULT_ADD_EXCLUSION_MODE = AddExclusionMode.Service;

const findExclusionById = (
    exclusionsTree: ExclusionDtoInterface,
    exclusionId: string,
): ExclusionDtoInterface | null => {
    if (exclusionsTree.id === exclusionId) {
        return exclusionsTree;
    }

    const { children } = exclusionsTree;

    for (let i = 0; i < children.length; i += 1) {
        const child = children[i];

        if (child.id === exclusionId) {
            return child;
        }

        const exclusion = findExclusionById(child, exclusionId);

        if (exclusion) {
            return exclusion;
        }
    }

    return null;
};

const convertExclusionsValuesToUnicode = (exclusionsTree: ExclusionDtoInterface): ExclusionDtoInterface => {
    const unicodeTree = { ...exclusionsTree };
    unicodeTree.hostname = punycode.toUnicode(unicodeTree.hostname);
    unicodeTree.children = unicodeTree.children.map((child) => {
        return convertExclusionsValuesToUnicode(child);
    });
    return unicodeTree;
};

export class ExclusionsStore {
    @observable exclusionsTree: ExclusionDtoInterface;

    @observable currentMode = ExclusionsMode.Regular;

    @observable servicesData: ServiceDto[] = [];

    @observable modeSelectorModalOpen = false;

    @observable addExclusionModalOpen = false;

    @observable addSubdomainModalOpen = false;

    @observable resetServiceModalOpen = false;

    @observable removeAllModalOpen = false;

    @observable selectListModalOpen = false;

    @observable confirmAddModalOpen = false;

    @observable urlToConfirm: string | undefined;

    @observable addExclusionMode = DEFAULT_ADD_EXCLUSION_MODE;

    @observable unfoldedServiceCategories: string[] = [];

    @observable unfoldAllServiceCategories: boolean = false;

    @observable selectedExclusionId: string | null = null;

    @observable exclusionsSearchValue: string = '';

    @observable servicesSearchValue: string = '';

    @observable servicesSearchResults: boolean[] = [];

    @observable importingExclusions: boolean = false;

    @observable isAllExclusionsListsEmpty: boolean;

    rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    /**
     * Temp list used to keep state of services to be enabled or disabled
     */
    @observable servicesToToggle: string[] = [];

    @action setServicesData = (servicesData: ServiceDto[]): void => {
        this.servicesData = servicesData;
    };

    updateSelectedExclusionOnTreeUpdate(): void {
        if (!this.selectedExclusionId) {
            return;
        }

        const selectedExclusion = findExclusionById(this.exclusionsTree, this.selectedExclusionId);

        if (!selectedExclusion) {
            this.setSelectedExclusionId(null);
            return;
        }

        if (selectedExclusion.children.length === 0) {
            this.setSelectedExclusionId(selectedExclusion?.parentId);
        }
    }

    @action setExclusionsData = (exclusionsData: ExclusionsData): void => {
        this.exclusionsTree = convertExclusionsValuesToUnicode(exclusionsData.exclusions);
        this.currentMode = exclusionsData.currentMode;

        this.updateSelectedExclusionOnTreeUpdate();
    };

    @action updateExclusionsData = async (): Promise<void> => {
        const {
            exclusionsData,
            services,
            isAllExclusionsListsEmpty,
        } = await messenger.getExclusionsData();
        this.setExclusionsData(exclusionsData);
        this.setServicesData(services);
        this.setIsAllExclusionsListsEmpty(isAllExclusionsListsEmpty);
    };

    @action setIsAllExclusionsListsEmpty = (value: boolean): void => {
        this.isAllExclusionsListsEmpty = value;
    };

    get preparedExclusions(): ExclusionDtoInterface[] {
        return this.exclusionsTree.children.filter((exclusion: ExclusionDtoInterface): boolean => {
            if (this.exclusionsSearchValue.length === 0) {
                return true;
            }
            return containsIgnoreCase(exclusion.hostname, this.exclusionsSearchValue);
        }).sort((a, b) => a.hostname.localeCompare(b.hostname)) ?? [];
    }

    @action setModeSelectorModalOpen = (value: boolean): void => {
        this.modeSelectorModalOpen = value;
    };

    @action setResetServiceModalOpen = (value: boolean): void => {
        this.resetServiceModalOpen = value;
    };

    @action setConfirmAddModalOpen = (value: boolean): void => {
        this.confirmAddModalOpen = value;
    };

    @action confirmUrlToAdd = (value: string): void => {
        this.urlToConfirm = value;
        this.setConfirmAddModalOpen(true);
    };

    @action setCurrentMode = async (mode: ExclusionsMode): Promise<void> => {
        await messenger.setExclusionsMode(mode);
        await this.updateExclusionsData();
        runInAction(() => {
            this.currentMode = mode;
        });
    };

    @action openAddExclusionModal = (): void => {
        this.addExclusionModalOpen = true;
    };

    @action closeAddExclusionModal = (): void => {
        this.addExclusionModalOpen = false;
        this.setServicesSearchValue('');
        this.servicesToToggle = [];
        this.unfoldedServiceCategories = [];
        this.setAddExclusionMode(DEFAULT_ADD_EXCLUSION_MODE);
    };

    @action setAddExclusionMode = (mode: AddExclusionMode): void => {
        this.addExclusionMode = mode;
    };

    @action openAddSubdomainModal = (): void => {
        this.addSubdomainModalOpen = true;
    };

    @action closeAddSubdomainModal = (): void => {
        this.addSubdomainModalOpen = false;
    };

    @action openRemoveAllModal = (): void => {
        this.removeAllModalOpen = true;
    };

    @action closeRemoveAllModal = (): void => {
        this.removeAllModalOpen = false;
    };

    @action openSelectListModal = (): void => {
        this.selectListModalOpen = true;
    };

    @action closeSelectListModal = (): void => {
        this.selectListModalOpen = false;
    };

    @computed
    get preparedServicesData(): PreparedServicesData {
        const categories = this.servicesData.reduce((acc: PreparedServiceCategories, serviceData) => {
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
        }, {});

        const services = this.servicesData.reduce((acc: PreparedServices, serviceData) => {
            const { serviceId } = serviceData;
            acc[serviceId] = serviceData;
            return acc;
        }, {});

        return {
            categories,
            services,
        };
    }

    @action
    toggleCategoryVisibility(id: string): void {
        const isUnfolded = this.unfoldedServiceCategories
            .some((categoryId) => categoryId === id);

        if (isUnfolded) {
            this.unfoldedServiceCategories = this.unfoldedServiceCategories
                .filter((categoryId): boolean => categoryId !== id);
        } else {
            this.unfoldedServiceCategories.push(id);
        }
    }

    /**
     * Adds URL to exclusions and updates exclusions if needed.
     *
     * @param url Url to add.
     *
     * @returns Count of added exclusions.
     */
    @action addUrlToExclusions = async (url: string): Promise<number> => {
        const addedExclusionsCount = await messenger.addUrlToExclusions(url);
        if (addedExclusionsCount) {
            await this.updateExclusionsData();
        }
        return addedExclusionsCount;
    };

    @action addSubdomainToExclusions = async (subdomain: string): Promise<number> => {
        if (!this.selectedExclusionId) {
            return 0;
        }

        const foundExclusion = findExclusionById(this.exclusionsTree, this.selectedExclusionId);

        if (!foundExclusion) {
            return 0;
        }

        const domain = foundExclusion.hostname;

        if (subdomain.includes(domain)) {
            const addedExclusionsCount = await messenger.addUrlToExclusions(subdomain);
            return addedExclusionsCount;
        }

        const domainToAdd = `${subdomain}.${domain}`;

        const addedExclusionsCount = await messenger.addUrlToExclusions(domainToAdd);
        if (addedExclusionsCount) {
            await this.updateExclusionsData();
        }
        return addedExclusionsCount;
    };

    /**
     * Goes one level up if selected exclusion doesn't have more exclusions
     * or if it was exclusion with base domain
     * @param exclusion
     */
    updateSelectedExclusionOnRemove(exclusion: ExclusionDtoInterface): void {
        if (!exclusion.parentId) {
            return;
        }

        const parent = findExclusionById(this.exclusionsTree, exclusion.parentId);
        if (!parent || !parent.parentId) {
            return;
        }

        if (parent.children.length <= 1 || exclusion.hostname === parent.hostname) {
            const parentParent = findExclusionById(this.exclusionsTree, parent.parentId);
            if (!parentParent) {
                return;
            }

            this.setSelectedExclusionId(parentParent.id);
        }
    }

    @action removeExclusion = async (exclusion: ExclusionDtoInterface): Promise<number> => {
        this.updateSelectedExclusionOnRemove(exclusion);

        const deletedExclusionsCount = await messenger.removeExclusion(exclusion.id);
        if (deletedExclusionsCount) {
            await this.updateExclusionsData();
        }
        return deletedExclusionsCount;
    };

    @action toggleExclusionState = async (id: string): Promise<void> => {
        await messenger.toggleExclusionState(id);
        await this.updateExclusionsData();
    };

    /**
     * Cancel exclusions remove
     */
    restoreExclusions = async (): Promise<void> => {
        await messenger.restoreExclusions();
        await this.updateExclusionsData();
    };

    @action addToServicesToToggle = (id: string): void => {
        if (this.servicesToToggle.includes(id)) {
            this.servicesToToggle = this.servicesToToggle
                .filter((serviceId) => serviceId !== id);
        } else {
            this.servicesToToggle.push(id);
        }
    };

    /**
     * Removes services from exclusions list if they were added otherwise adds them
     *
     * @returns Counts of added and deleted services.
     */
    @action toggleServices = async (): Promise<any> => {
        const toggleServicesResult = await messenger.toggleServices(toJS(this.servicesToToggle));
        runInAction(() => {
            this.servicesToToggle = [];
        });
        if (toggleServicesResult) {
            await this.updateExclusionsData();
        }
        return toggleServicesResult;
    };

    @action setSelectedExclusionId = (id: string | null): void => {
        this.selectedExclusionId = id;
    };

    getParentExclusion(exclusion: ExclusionDtoInterface): ExclusionDtoInterface | undefined {
        if (exclusion.type === ExclusionsType.Service) {
            return undefined;
        }

        return this.exclusionsTree.children.find((group) => {
            return group.children?.find(({ id }) => exclusion.id === id);
        });
    }

    @action goBackHandler = (): void => {
        if (this.selectedExclusion) {
            const parentExclusion = this.getParentExclusion(this.selectedExclusion);
            this.selectedExclusionId = parentExclusion?.id || null;
        }
    };

    @computed
    get selectedExclusion(): ExclusionDtoInterface | null {
        if (!this.selectedExclusionId || this.selectedExclusionId === 'root') {
            return null;
        }

        return findExclusionById(this.exclusionsTree, this.selectedExclusionId);
    }

    @action setExclusionsSearchValue = (value: string): void => {
        this.exclusionsSearchValue = value;
    };

    @action setUnfoldAllServiceCategories = (unfold: boolean): void => {
        this.unfoldAllServiceCategories = unfold;
    };

    @action setServicesSearchValue = (value: string): void => {
        this.servicesSearchValue = value;

        this.setUnfoldAllServiceCategories(this.servicesSearchValue.length > 0);
    };

    @action resetServiceData = async (serviceId: string): Promise<void> => {
        await messenger.resetServiceData(serviceId);
        await this.updateExclusionsData();
    };

    @action clearExclusionsList = async (): Promise<void> => {
        await messenger.clearExclusionsList();
        await this.updateExclusionsData();
    };

    get sortedExclusions(): ExclusionDtoInterface[] | null {
        const { selectedExclusion } = this;

        if (!selectedExclusion) {
            return null;
        }

        if (selectedExclusion.type === ExclusionsType.Group) {
            return selectedExclusion.children
                // slice() is needed to suppress the mobx warning about observableArray.sort()
                .slice()
                .sort((a, b) => {
                    return a.hostname === selectedExclusion.hostname
                        || (a.hostname === `*.${selectedExclusion.hostname}`
                            && b.hostname !== selectedExclusion.hostname) ? -1 : 1;
                });
        }

        return selectedExclusion.children.slice().sort((a, b) => {
            return a.hostname > b.hostname ? 1 : -1;
        });
    }

    /**
     * Checks is services is in default state:
     * 1. all exclusions groups are presented in service
     * 2. domain and subdomain pattern exclusions are presented and enabled
     *
     * @param id
     *
     * @returns True if service is in default state, false otherwise.
     */
    isServiceDefaultState = (id: string): boolean => {
        const defaultServiceData = this.preparedServicesData.services[id];

        const isFullChildrenList = (
            this.selectedExclusion?.children?.length === defaultServiceData?.domains.length
        );

        const isDefaultDomainsState = this.selectedExclusion?.children.every((child) => {
            const defaultDomainExclusion = child.children
                .find((exclusion) => exclusion.hostname === child.hostname
                    && exclusion.state === ExclusionState.Enabled);

            const defaultAllSubdomainExclusion = child.children
                .find((exclusion) => exclusion.hostname === `*.${child.hostname}`
                    && exclusion.state === ExclusionState.Enabled);

            return defaultDomainExclusion && defaultAllSubdomainExclusion;
        });

        return isFullChildrenList && !!isDefaultDomainsState;
    };

    /**
     * Checks if provided url is valid domain.
     *
     * @param url
     *
     * @returns True if domain is valid, false otherwise.
     */
    validateUrl = (url: string): boolean => {
        const isValidDomain = !!getDomain(url);
        const isValidIp = isIP(url);

        return isValidDomain || isValidIp;
    };

    @action setImportingExclusions = (value: boolean): void => {
        this.importingExclusions = value;
    };

    @computed
    get isCurrentModeExclusionsListEmpty(): boolean {
        return !this.exclusionsTree.children.length;
    }

    @computed
    get isServicesSearchEmpty(): boolean {
        if (this.servicesSearchValue) {
            return !this.servicesData.some((service) => {
                return containsIgnoreCase(service.serviceName, this.servicesSearchValue);
            });
        }
        return false;
    }
}
