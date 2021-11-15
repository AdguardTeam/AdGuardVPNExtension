import {
    action,
    observable,
} from 'mobx';
import { EXCLUSIONS_MODES } from '../../common/exclusionsConstants';

export class ExclusionsStore {
    @observable exclusions = {
        [EXCLUSIONS_MODES.SELECTIVE]: {
            ips: [],
            exclusionsGroups: [],
            services: [],
        },
        [EXCLUSIONS_MODES.REGULAR]: {
            ips: [],
            exclusionsGroups: [],
            services: [],
        },
    };

    @observable servicesData;

    @action
    setServicesData = (servicesData) => {
        this.servicesData = servicesData;
    }
}
