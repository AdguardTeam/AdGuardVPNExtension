import {
    action,
    computed,
    observable,
    runInAction,
} from 'mobx';
import JSZip from 'jszip';
import format from 'date-fns/format';
import FileSaver from 'file-saver';

import {
    ExclusionDtoInterface,
    ExclusionsData,
    ExclusionsModes,
    ExclusionsTypes,
} from '../../common/exclusionsConstants';
import { Service, ServiceCategory, ServiceInterface } from '../../background/exclusions/services/Service';
import { messenger } from '../../lib/messenger';
import { containsIgnoreCase } from '../components/Exclusions/Search/SearchHighlighter/helpers';

export interface PreparedServiceCategory extends ServiceCategory {
    services: string[]
}

interface PreparedServiceCategories {
    [key: string]: PreparedServiceCategory
}

interface PreparedServices {
    [key: string]: ServiceInterface
}

export enum AddExclusionMode {
    SERVICE = 'SERVICE',
    MANUAL = 'MANUAL',
}

const DEFAULT_ADD_EXCLUSION_MODE = AddExclusionMode.MANUAL;

// FIXME move to helpers
const findExclusionById = (
    exclusions: ExclusionDtoInterface[],
    id: string,
): ExclusionDtoInterface | null => {
    for (let i = 0; i < exclusions.length; i += 1) {
        let exclusion: ExclusionDtoInterface | null = exclusions[i];
        if (exclusion.id === id) {
            return exclusion;
        }

        exclusion = findExclusionById(exclusion.children, id);

        if (exclusion) {
            return exclusion;
        }
    }

    return null;
};

export class ExclusionsStore {
    @observable exclusions: ExclusionDtoInterface[];

    @observable currentMode = ExclusionsModes.Regular;

    @observable servicesData: Service[] = [];

    @observable addExclusionModalOpen = false;

    @observable addSubdomainModalOpen = false;

    @observable removeAllModalOpen = false;

    @observable addExclusionMode = DEFAULT_ADD_EXCLUSION_MODE;

    @observable unfoldedServiceCategories: string[] = [];

    @observable unfoldAllServiceCategories: boolean = false;

    @observable selectedExclusionId: string | null = null;

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
        this.exclusions = exclusionsData.exclusions;
        this.currentMode = exclusionsData.currentMode;
    };

    @action updateExclusionsData = async () => {
        const exclusionsData = await messenger.getExclusionsData();
        this.setExclusionsData(exclusionsData);
    };

    get preparedExclusions() {
        const filteredExclusions: ExclusionDtoInterface[] = this.exclusions
            .filter((exclusion: ExclusionDtoInterface) => {
                if (this.exclusionsSearchValue.length === 0) {
                    return true;
                }
                return containsIgnoreCase(exclusion.value, this.exclusionsSearchValue);
            });

        const sortedExclusions = filteredExclusions
            .sort((a: ExclusionDtoInterface, b: ExclusionDtoInterface) => {
                return a.value > b.value ? 1 : -1;
            });

        return sortedExclusions;
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
        this.servicesToToggle = [];
        this.unfoldedServiceCategories = [];
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
        const urlToAdd = url.replace('www.', '');
        await messenger.addUrlToExclusions(urlToAdd);
    };

    @action addSubdomainToExclusions = async (subdomain: string) => {
        if (!this.selectedExclusionId) {
            return;
        }

        const foundExclusion = findExclusionById(
            this.exclusions,
            this.selectedExclusionId,
        );

        if (!foundExclusion) {
            return;
        }

        const domain = foundExclusion.value;

        if (subdomain.includes(domain)) {
            const domainToAdd = subdomain.replace('www.', '');
            await messenger.addUrlToExclusions(domainToAdd);
            return;
        }

        const domainToAdd = `${subdomain}.${domain}`;

        await messenger.addUrlToExclusions(domainToAdd);
    };

    @action removeExclusion = async (id: string) => {
        await messenger.removeExclusion(id);
    };

    @action toggleExclusionState = async (id: string) => {
        await messenger.toggleExclusionState(id);
    };

    @action addService = async (id: string) => {
        await messenger.addService(id);
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
        await messenger.toggleServices(this.servicesToToggle);
        runInAction(() => {
            this.servicesToToggle = [];
        });
    };

    @action setSelectedExclusionId = (id: string | null) => {
        this.selectedExclusionId = id;
    };

    getParentExclusion(exclusion: ExclusionDtoInterface): ExclusionDtoInterface | undefined {
        if (exclusion.type === ExclusionsTypes.Service) {
            return undefined;
        }

        return this.exclusions.find((group) => {
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
        if (!this.selectedExclusionId) {
            return null;
        }

        const foundExclusion = findExclusionById(
            this.exclusions,
            this.selectedExclusionId,
        );

        if (!foundExclusion) {
            return null;
        }

        return foundExclusion;
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

    exportExclusions = async () => {
        const nowFormatted = format(Date.now(), 'yyyy_MM_dd-HH_mm_ss');
        const ZIP_FILENAME = `exclusions-${nowFormatted}.zip`;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const EXCLUSION_FILES_EXTENSIONS = {
            REGULAR: '.regular.txt',
            SELECTIVE: '.selective.txt',
        };

        const zip = new JSZip();

        const regularExclusions = await messenger.getRegularExclusions();
        const selectiveExclusions = await messenger.getSelectiveExclusions();

        console.log(regularExclusions);
        console.log(selectiveExclusions);

        zip.file(`${nowFormatted}${EXCLUSION_FILES_EXTENSIONS.REGULAR}`, regularExclusions);
        zip.file(`${nowFormatted}${EXCLUSION_FILES_EXTENSIONS.SELECTIVE}`, selectiveExclusions);

        const zipContent = await zip.generateAsync({ type: 'blob' });
        FileSaver.saveAs(zipContent, ZIP_FILENAME);
    };

    // FIXME
    // @action importExclusions = async (exclusionsData: ExclusionsDataToImport[]) => {
    //     await messenger.importExclusionsData(exclusionsData);
    // };

    get sortedExclusions() {
        const { selectedExclusion } = this;
        if (this.selectedExclusion && selectedExclusion?.type === ExclusionsTypes.Group) {
            const domainExclusion = selectedExclusion.children
                .find(({ value }) => value === selectedExclusion.value) || null;

            const allSubdomainsExclusion = selectedExclusion.children
                .find(({ value }) => value.startsWith('*.')) || null;

            const subdomainsExclusions = selectedExclusion.children
                .filter(({ value }) => value !== domainExclusion?.value
                    && value !== allSubdomainsExclusion?.value);

            return [domainExclusion, allSubdomainsExclusion, ...subdomainsExclusions]
                .filter((exclusion) => exclusion);
        }
        return selectedExclusion?.children
            ?.sort((a, b) => {
                return a.value > b.value ? 1 : -1;
            });
    }
}
