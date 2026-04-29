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
    ExclusionsMode,
    ExclusionState,
    ExclusionsType,
    type ServiceDto,
} from '../../common/exclusionsConstants';
import { messenger } from '../../common/messenger';
import { containsIgnoreCase } from '../../common/components/SearchHighlighter/helpers';
import type { ServiceCategory } from '../../background/schema';

import type { ProfilesStore } from './ProfilesStore';

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

const EMPTY_EXCLUSIONS_TREE: ExclusionDtoInterface = {
    id: 'root',
    parentId: null,
    hostname: '',
    state: ExclusionState.Disabled,
    type: ExclusionsType.Group,
    children: [],
};

export class ExclusionsStore {
    private profilesStore: ProfilesStore;

    /**
     * Profile ID to scope exclusions to a specific profile.
     * When undefined, operates on the active profile.
     */
    @observable public profileId: string | undefined;

    constructor(profilesStore: ProfilesStore) {
        this.profilesStore = profilesStore;
    }

    /**
     * Resets all UI state fields to their defaults.
     */
    @action public resetUiState = (): void => {
        this.modeSelectorModalOpen = false;
        this.addExclusionModalOpen = false;
        this.addSubdomainModalOpen = false;
        this.resetServiceModalOpen = false;
        this.removeAllModalOpen = false;
        this.selectListModalOpen = false;
        this.confirmAddModalOpen = false;
        this.urlToConfirm = undefined;
        this.addExclusionMode = DEFAULT_ADD_EXCLUSION_MODE;
        this.unfoldedServiceCategories = [];
        this.unfoldAllServiceCategories = false;
        this.selectedExclusionId = null;
        this.exclusionsSearchValue = '';
        this.servicesSearchValue = '';
        this.servicesSearchResults = [];
        this.importingExclusions = false;
        this.servicesToToggle = [];
    };

    /**
     * Sets the profile ID and resets UI state for the new profile.
     */
    @action public setProfileId = (profileId: string | undefined): void => {
        this.profileId = profileId;
        this.resetUiState();
    };

    /**
     * Returns the effective profile ID — explicit profileId or the active profile.
     */
    @computed
    private get effectiveProfileId(): string {
        return this.profileId ?? this.profilesStore.activeProfileId;
    }

    /**
     * Exclusions tree for the current profile, read from ProfilesStore cache.
     */
    @computed
    public get exclusionsTree(): ExclusionDtoInterface {
        return this.profilesStore.exclusionsCache.get(this.effectiveProfileId)?.exclusionsTree
            ?? EMPTY_EXCLUSIONS_TREE;
    }

    /**
     * Current exclusions mode for the current profile.
     */
    @computed
    public get currentMode(): ExclusionsMode {
        return this.profilesStore.exclusionsCache.get(this.effectiveProfileId)?.currentMode
            ?? ExclusionsMode.Regular;
    }

    /**
     * Services data for the current profile.
     */
    @computed
    private get servicesData(): ServiceDto[] {
        return this.profilesStore.exclusionsCache.get(this.effectiveProfileId)?.services ?? [];
    }

    /**
     * Whether all exclusion lists are empty for the current profile.
     */
    @computed
    public get isAllExclusionsListsEmpty(): boolean {
        return this.profilesStore.exclusionsCache.get(this.effectiveProfileId)?.isAllExclusionsListsEmpty ?? true;
    }

    @observable public modeSelectorModalOpen = false;

    @observable public addExclusionModalOpen = false;

    @observable public addSubdomainModalOpen = false;

    @observable public resetServiceModalOpen = false;

    @observable public removeAllModalOpen = false;

    @observable public selectListModalOpen = false;

    @observable public confirmAddModalOpen = false;

    @observable public urlToConfirm: string | undefined;

    @observable public addExclusionMode = DEFAULT_ADD_EXCLUSION_MODE;

    @observable public unfoldedServiceCategories: string[] = [];

    @observable public unfoldAllServiceCategories: boolean = false;

    @observable private selectedExclusionId: string | null = null;

    @observable public exclusionsSearchValue: string = '';

    @observable public servicesSearchValue: string = '';

    @observable private servicesSearchResults: boolean[] = [];

    @observable public importingExclusions: boolean = false;

    /**
     * Temp list used to keep state of services to be enabled or disabled.
     */
    @observable public servicesToToggle: string[] = [];

    private updateSelectedExclusionOnTreeUpdate(): void {
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

    /**
     * Fetches exclusions data from the backend and updates the ProfilesStore cache.
     */
    public updateExclusionsData = async (): Promise<void> => {
        const result = await messenger.getExclusionsData(this.profileId);
        this.profilesStore.updateExclusionsCache(
            this.effectiveProfileId,
            result.exclusionsData,
            result.services,
            result.isAllExclusionsListsEmpty,
        );
        this.updateSelectedExclusionOnTreeUpdate();
    };

    public get preparedExclusions(): ExclusionDtoInterface[] {
        return this.exclusionsTree.children.filter((exclusion: ExclusionDtoInterface): boolean => {
            if (this.exclusionsSearchValue.length === 0) {
                return true;
            }
            return containsIgnoreCase(exclusion.hostname, this.exclusionsSearchValue);
        }).sort((a, b) => a.hostname.localeCompare(b.hostname)) ?? [];
    }

    @action public setModeSelectorModalOpen = (value: boolean): void => {
        this.modeSelectorModalOpen = value;
    };

    @action public setResetServiceModalOpen = (value: boolean): void => {
        this.resetServiceModalOpen = value;
    };

    @action public setConfirmAddModalOpen = (value: boolean): void => {
        this.confirmAddModalOpen = value;
    };

    @action public confirmUrlToAdd = (value: string): void => {
        this.urlToConfirm = value;
        this.setConfirmAddModalOpen(true);
    };

    public setCurrentMode = async (mode: ExclusionsMode): Promise<void> => {
        await messenger.setExclusionsMode(mode, this.profileId);
        await this.updateExclusionsData();
    };

    @action public openAddExclusionModal = (): void => {
        this.addExclusionModalOpen = true;
    };

    @action public closeAddExclusionModal = (): void => {
        this.addExclusionModalOpen = false;
        this.setServicesSearchValue('');
        this.servicesToToggle = [];
        this.unfoldedServiceCategories = [];
        this.setAddExclusionMode(DEFAULT_ADD_EXCLUSION_MODE);
    };

    @action public setAddExclusionMode = (mode: AddExclusionMode): void => {
        this.addExclusionMode = mode;
    };

    @action public openAddSubdomainModal = (): void => {
        this.addSubdomainModalOpen = true;
    };

    @action public closeAddSubdomainModal = (): void => {
        this.addSubdomainModalOpen = false;
    };

    @action public openRemoveAllModal = (): void => {
        this.removeAllModalOpen = true;
    };

    @action public closeRemoveAllModal = (): void => {
        this.removeAllModalOpen = false;
    };

    @action public openSelectListModal = (): void => {
        this.selectListModalOpen = true;
    };

    @action public closeSelectListModal = (): void => {
        this.selectListModalOpen = false;
    };

    @computed
    public get preparedServicesData(): PreparedServicesData {
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
    public toggleCategoryVisibility(id: string): void {
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
    @action public addUrlToExclusions = async (url: string): Promise<number> => {
        const addedExclusionsCount = await messenger.addUrlToExclusions(url, this.profileId);
        if (addedExclusionsCount) {
            await this.updateExclusionsData();
        }
        return addedExclusionsCount;
    };

    @action public addSubdomainToExclusions = async (subdomain: string): Promise<number> => {
        if (!this.selectedExclusionId) {
            return 0;
        }

        const foundExclusion = findExclusionById(this.exclusionsTree, this.selectedExclusionId);

        if (!foundExclusion) {
            return 0;
        }

        const domain = foundExclusion.hostname;

        if (subdomain.includes(domain)) {
            const addedExclusionsCount = await messenger.addUrlToExclusions(subdomain, this.profileId);
            return addedExclusionsCount;
        }

        const domainToAdd = `${subdomain}.${domain}`;

        const addedExclusionsCount = await messenger.addUrlToExclusions(domainToAdd, this.profileId);
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
    private updateSelectedExclusionOnRemove(exclusion: ExclusionDtoInterface): void {
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

    @action public removeExclusion = async (exclusion: ExclusionDtoInterface): Promise<number> => {
        this.updateSelectedExclusionOnRemove(exclusion);

        const deletedExclusionsCount = await messenger.removeExclusion(exclusion.id, this.profileId);
        if (deletedExclusionsCount) {
            await this.updateExclusionsData();
        }
        return deletedExclusionsCount;
    };

    @action public toggleExclusionState = async (id: string): Promise<void> => {
        await messenger.toggleExclusionState(id, this.profileId);
        await this.updateExclusionsData();
    };

    /**
     * Cancel exclusions remove
     */
    public restoreExclusions = async (): Promise<void> => {
        await messenger.restoreExclusions(this.profileId);
        await this.updateExclusionsData();
    };

    @action public addToServicesToToggle = (id: string): void => {
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
    @action public toggleServices = async (): Promise<any> => {
        const toggleServicesResult = await messenger.toggleServices(toJS(this.servicesToToggle), this.profileId);
        runInAction(() => {
            this.servicesToToggle = [];
        });
        if (toggleServicesResult) {
            await this.updateExclusionsData();
        }
        return toggleServicesResult;
    };

    @action public setSelectedExclusionId = (id: string | null): void => {
        this.selectedExclusionId = id;
    };

    private getParentExclusion(exclusion: ExclusionDtoInterface): ExclusionDtoInterface | undefined {
        if (exclusion.type === ExclusionsType.Service) {
            return undefined;
        }

        return this.exclusionsTree.children.find((group) => {
            return group.children?.find(({ id }) => exclusion.id === id);
        });
    }

    @action public goBackHandler = (): void => {
        if (this.selectedExclusion) {
            const parentExclusion = this.getParentExclusion(this.selectedExclusion);
            this.selectedExclusionId = parentExclusion?.id || null;
        }
    };

    @computed
    public get selectedExclusion(): ExclusionDtoInterface | null {
        if (!this.selectedExclusionId || this.selectedExclusionId === 'root') {
            return null;
        }

        return findExclusionById(this.exclusionsTree, this.selectedExclusionId);
    }

    @action public setExclusionsSearchValue = (value: string): void => {
        this.exclusionsSearchValue = value;
    };

    @action private setUnfoldAllServiceCategories = (unfold: boolean): void => {
        this.unfoldAllServiceCategories = unfold;
    };

    @action public setServicesSearchValue = (value: string): void => {
        this.servicesSearchValue = value;

        this.setUnfoldAllServiceCategories(this.servicesSearchValue.length > 0);
    };

    @action public resetServiceData = async (serviceId: string): Promise<void> => {
        await messenger.resetServiceData(serviceId, this.profileId);
        await this.updateExclusionsData();
    };

    @action public clearExclusionsList = async (): Promise<void> => {
        await messenger.clearExclusionsList(this.profileId);
        await this.updateExclusionsData();
    };

    public get sortedExclusions(): ExclusionDtoInterface[] | null {
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
    public isServiceDefaultState = (id: string): boolean => {
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
    public validateUrl = (url: string): boolean => {
        const isValidDomain = !!getDomain(url);
        const isValidIp = isIP(url);

        return isValidDomain || isValidIp;
    };

    @action public setImportingExclusions = (value: boolean): void => {
        this.importingExclusions = value;
    };

    @computed
    public get isCurrentModeExclusionsListEmpty(): boolean {
        return !this.exclusionsTree.children.length;
    }

    @computed
    public get isServicesSearchEmpty(): boolean {
        if (this.servicesSearchValue) {
            return !this.servicesData.some((service) => {
                return containsIgnoreCase(service.serviceName, this.servicesSearchValue);
            });
        }
        return false;
    }
}
