import {
    action,
    observable,
} from 'mobx';
import { EXCLUSIONS_MODES } from '../../common/exclusionsConstants';
import messenger from '../../lib/messenger';

export class ExclusionsStore {
    @observable exclusions = {
        [EXCLUSIONS_MODES.SELECTIVE]: {
            excludedIps: [],
            exclusionsGroups: [],
            excludedServices: [],
        },
        [EXCLUSIONS_MODES.REGULAR]: {
            excludedIps: [],
            exclusionsGroups: [],
            excludedServices: [],
        },
    };

    @observable currentMode;

    @observable servicesData;

    @action
    setServicesData = (servicesData) => {
        this.servicesData = servicesData;
    }

    @action
    setExclusionsData = (exclusionsData) => {
        this.exclusions = exclusionsData;
        this.currentMode = exclusionsData.currentMode;
    }

    @action
    getExcludedServicesList = (mode) => {
        return this.exclusions[mode].excludedServices.map((service) => service.serviceName);
    }

    @action
    getExclusionsGroupsList = (mode) => {
        return this.exclusions[mode].exclusionsGroups.map((group) => group.hostname);
    }

    @action
    getExcludedIpsList = (mode) => {
        return this.exclusions[mode].excludedIps.map((ip) => ip.hostname);
    }

    @action
    toggleInverted = async (mode) => {
        this.currentMode = mode;
        await messenger.setExclusionsMode(mode);
    };
}
