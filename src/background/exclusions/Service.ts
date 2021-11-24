import { ExclusionsGroup } from './ExclusionsGroup';
import { STATE } from '../../common/exclusionsConstants';

export interface ServiceInterface {
    serviceId: string;
    serviceName: string;
    iconUrl: string;
    categories: string[];
    modifiedTime: string;
    exclusionsGroups: ExclusionsGroup[];
    state: STATE;
}

export class Service implements ServiceInterface {
    serviceId: string;

    serviceName: string;

    iconUrl: string;

    categories: string[];

    modifiedTime: string;

    exclusionsGroups: ExclusionsGroup[];

    state: STATE;

    constructor(service: ServiceInterface) {
        this.serviceId = service.serviceId;
        this.serviceName = service.serviceName;
        this.iconUrl = service.iconUrl;
        this.categories = service.categories;
        this.modifiedTime = service.modifiedTime;
        this.exclusionsGroups = service.exclusionsGroups
            ?.map((group) => new ExclusionsGroup(group)) || [];
        this.state = service.state || STATE.Enabled;
    }

    /**
     * Adds new ExclusionsGroup
     */
    addExclusionsGroup(hostname: string) {
        // TODO check existing
        const exclusionsGroups = new ExclusionsGroup(hostname);
        this.exclusionsGroups.push(exclusionsGroups);
    }

    /**
     * Removes ExclusionsGroup by id
     */
    removeExclusionsGroup(id: string) {
        this.exclusionsGroups = this.exclusionsGroups.filter((group) => group.id !== id);
        this.updateServiceState();
    }

    /**
     * Toggles ExclusionsGroups state
     * @param id
     */
    toggleExclusionsGroupState = (id: string) => {
        this.exclusionsGroups.forEach((group: ExclusionsGroup) => {
            if (group.id === id) {
                group.toggleExclusionsGroupState();
            }
        });
        this.updateServiceState();
    };

    /**
     * Enables all ExclusionsGroups
     */
    enableExclusionsGroups() {
        this.exclusionsGroups.forEach((group: ExclusionsGroup) => {
            group.enableExclusionsGroup();
        });
    }

    /**
     * Disables all ExclusionsGroups
     */
    disableExclusionsGroups() {
        this.exclusionsGroups.forEach((group: ExclusionsGroup) => {
            group.disableExclusionsGroup();
        });
    }

    enableService() {
        this.state = STATE.Enabled;
        this.enableExclusionsGroups();
    }

    disableService() {
        this.state = STATE.Disabled;
        this.disableExclusionsGroups();
    }

    toggleServiceState = () => {
        if (this.state === STATE.Enabled || this.state === STATE.PartlyEnabled) {
            this.disableService();
        } else {
            this.enableService();
        }
    }

    /**
     * Sets Service state according to the states of ExclusionsGroups
     */
    updateServiceState() {
        const enabledGroups = this.exclusionsGroups
            .filter((exclusion: ExclusionsGroup) => exclusion.state === STATE.Enabled);

        const disabledGroups = this.exclusionsGroups
            .filter((exclusion: ExclusionsGroup) => exclusion.state === STATE.Disabled);

        if (enabledGroups.length === this.exclusionsGroups.length) {
            this.state = STATE.Enabled;
        } else if (disabledGroups.length === this.exclusionsGroups.length) {
            this.state = STATE.Disabled;
        } else {
            this.state = STATE.PartlyEnabled;
        }
    }
}
