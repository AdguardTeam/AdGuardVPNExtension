import {
    action,
    computed,
    observable,
    runInAction,
    toJS,
} from 'mobx';
import punycode from 'punycode';
import { isIP } from 'is-ip';
import { getDomain } from 'tldts';

import {
    ExclusionDtoInterface,
    ExclusionsData,
    ExclusionsModes,
    ExclusionState,
    ExclusionsTypes,
    ServiceCategory,
    ServiceDto,
} from '../../common/exclusionsConstants';
import { messenger } from '../../lib/messenger';
import { containsIgnoreCase } from '../components/Exclusions/Search/SearchHighlighter/helpers';

export interface PreparedServiceCategory extends ServiceCategory {
    services: string[]
}

interface PreparedServiceCategories {
    [key: string]: PreparedServiceCategory
}

interface PreparedServices {
    [key: string]: ServiceDto
}

export enum AddExclusionMode {
    SERVICE = 'SERVICE',
    MANUAL = 'MANUAL',
}

const DEFAULT_ADD_EXCLUSION_MODE = AddExclusionMode.MANUAL;

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

const convertExclusionsValuesToUnicode = (exclusionsTree: ExclusionDtoInterface) => {
    const unicodeTree = { ...exclusionsTree };
    unicodeTree.hostname = punycode.toUnicode(unicodeTree.hostname);
    unicodeTree.children = unicodeTree.children.map((child) => {
        return convertExclusionsValuesToUnicode(child);
    });
    return unicodeTree;
};

export class ExclusionsStore {
    @observable exclusionsTree: ExclusionDtoInterface;

    @observable currentMode = ExclusionsModes.Regular;

    @observable servicesData: ServiceDto[] = [];

    @observable modeSelectorModalOpen = false;

    @observable addExclusionModalOpen = false;

    @observable addSubdomainModalOpen = false;

    @observable resetServiceModalOpen = false;

    @observable removeAllModalOpen = false;

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

    /**
     * Temp list used to keep state of services to be enabled or disabled
     */
    @observable servicesToToggle: string[] = [];

    @action setServicesData = (servicesData: ServiceDto[]) => {
        this.servicesData = servicesData;
    };

    updateSelectedExclusionOnTreeUpdate() {
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

    @action setExclusionsData = (exclusionsData: ExclusionsData) => {
        this.exclusionsTree = convertExclusionsValuesToUnicode(exclusionsData.exclusions);
        this.currentMode = exclusionsData.currentMode;

        this.updateSelectedExclusionOnTreeUpdate();
    };

    @action updateExclusionsData = async () => {
        const {
            exclusionsData,
            services,
            isAllExclusionsListsEmpty,
        } = await messenger.getExclusionsData();
        this.setExclusionsData(exclusionsData);
        this.setServicesData(services);
        this.setIsAllExclusionsListsEmpty(isAllExclusionsListsEmpty);
    };

    @action setIsAllExclusionsListsEmpty = (value: boolean) => {
        this.isAllExclusionsListsEmpty = value;
    };

    get preparedExclusions() {
        return this.exclusionsTree.children.filter((exclusion: ExclusionDtoInterface) => {
            if (this.exclusionsSearchValue.length === 0) {
                return true;
            }
            return containsIgnoreCase(exclusion.hostname, this.exclusionsSearchValue);
        }) ?? [];
    }

    @action setModeSelectorModalOpen = (value: boolean) => {
        this.modeSelectorModalOpen = value;
    };

    @action setResetServiceModalOpen = (value: boolean) => {
        this.resetServiceModalOpen = value;
    };

    @action setConfirmAddModalOpen = (value: boolean) => {
        this.confirmAddModalOpen = value;
    };

    @action confirmUrlToAdd = (value: string) => {
        this.urlToConfirm = value;
        this.setConfirmAddModalOpen(true);
    };

    @action setCurrentMode = async (mode: ExclusionsModes) => {
        this.currentMode = mode;
        await messenger.setExclusionsMode(mode);
    };

    @action openAddExclusionModal = () => {
        this.addExclusionModalOpen = true;
    };

    @action closeAddExclusionModal = () => {
        this.addExclusionModalOpen = false;
        this.setServicesSearchValue('');
        this.servicesToToggle = [];
        this.unfoldedServiceCategories = [];
        this.setAddExclusionMode(AddExclusionMode.MANUAL);
    };

    @action setAddExclusionMode = (mode: AddExclusionMode) => {
        this.addExclusionMode = mode;
    };

    @action openAddSubdomainModal = () => {
        this.addSubdomainModalOpen = true;
    };

    @action closeAddSubdomainModal = () => {
        this.addSubdomainModalOpen = false;
    };

    @action openRemoveAllModal = () => {
        this.removeAllModalOpen = true;
    };

    @action closeRemoveAllModal = () => {
        this.removeAllModalOpen = false;
    };

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
            acc[serviceId] = serviceData;
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
        const addedExclusionsCount = await messenger.addUrlToExclusions(url);
        return addedExclusionsCount;
    };

    @action addSubdomainToExclusions = async (subdomain: string) => {
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
        return addedExclusionsCount;
    };

    /**
     * Goes one level up if selected exclusion doesn't have more exclusions
     * or if it was exclusion with base domain
     * @param exclusion
     */
    updateSelectedExclusionOnRemove(exclusion: ExclusionDtoInterface) {
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

    @action removeExclusion = async (exclusion: ExclusionDtoInterface) => {
        this.updateSelectedExclusionOnRemove(exclusion);

        const deletedExclusionsCount = await messenger.removeExclusion(exclusion.id);

        return deletedExclusionsCount;
    };

    @action toggleExclusionState = async (id: string) => {
        await messenger.toggleExclusionState(id);
    };

    /**
     * Cancel exclusions remove
     */
    restoreExclusions = async () => {
        await messenger.restoreExclusions();
    };

    @action addToServicesToToggle = (id: string) => {
        if (this.servicesToToggle.includes(id)) {
            this.servicesToToggle = this.servicesToToggle
                .filter((serviceId) => serviceId !== id);
        } else {
            this.servicesToToggle.push(id);
        }
    };

    /**
     * Removes services from exclusions list if they were added otherwise adds them
     */
    @action toggleServices = async () => {
        const toggleServicesResult = await messenger.toggleServices(toJS(this.servicesToToggle));
        runInAction(() => {
            this.servicesToToggle = [];
        });

        return toggleServicesResult;
    };

    @action setSelectedExclusionId = (id: string | null) => {
        this.selectedExclusionId = id;
    };

    getParentExclusion(exclusion: ExclusionDtoInterface): ExclusionDtoInterface | undefined {
        if (exclusion.type === ExclusionsTypes.Service) {
            return undefined;
        }

        return this.exclusionsTree.children.find((group) => {
            return group.children?.find(({ id }) => exclusion.id === id);
        });
    }

    @action goBackHandler = () => {
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
    };

    get sortedExclusions() {
        const { selectedExclusion } = this;

        if (!selectedExclusion) {
            return null;
        }

        if (selectedExclusion.type === ExclusionsTypes.Group) {
            return selectedExclusion.children
                .sort((a, b) => {
                    return a.hostname === selectedExclusion.hostname
                        || (a.hostname === `*.${selectedExclusion.hostname}`
                            && b.hostname !== selectedExclusion.hostname) ? -1 : 1;
                });
        }

        return selectedExclusion.children.sort((a, b) => {
            return a.hostname > b.hostname ? 1 : -1;
        });
    }

    /**
     * Checks is services is in default state:
     * 1. all exclusions groups are presented in service
     * 2. domain and subdomain pattern exclusions are presented and enabled
     * @param id
     */
    isServiceDefaultState = (id: string) => {
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

        return isFullChildrenList && isDefaultDomainsState;
    };

    /**
     * Checks if provided url is valid domain
     * @param url
     */
    validateUrl = (url: string): boolean => {
        const isValidDomain = !!getDomain(url);
        const isValidIp = isIP(url);

        return isValidDomain || isValidIp;
    };

    @action setImportingExclusions = (value: boolean) => {
        this.importingExclusions = value;
    };

    @computed
    get isCurrentModeExclusionsListEmpty() {
        return !this.exclusionsTree.children.length;
    }

    @computed
    get isServicesSearchEmpty() {
        if (this.servicesSearchValue) {
            return !this.servicesData.some((service) => {
                return containsIgnoreCase(service.serviceName, this.servicesSearchValue);
            });
        }
        return false;
    }
}
