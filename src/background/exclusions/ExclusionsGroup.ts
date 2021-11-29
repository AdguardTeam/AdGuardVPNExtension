import { nanoid } from 'nanoid';

import { Exclusion } from './Exclusion';
import { prepareUrl } from '../../lib/helpers';
import { ExclusionStates } from '../../common/exclusionsConstants';

export interface ExclusionsGroupInterface {
    id: string;
    hostname: string;
    exclusions: Exclusion[];
    state: ExclusionStates;
}

export class ExclusionsGroup implements ExclusionsGroupInterface {
    id: string;

    hostname: string;

    exclusions: Exclusion[];

    state: ExclusionStates;

    constructor(exclusionsGroupData: ExclusionsGroupInterface | string) {
        if (typeof exclusionsGroupData === 'string') {
            this.id = nanoid();
            this.hostname = prepareUrl(exclusionsGroupData);
            this.exclusions = [];
            this.addDefaultExclusions();
            this.state = ExclusionStates.Enabled;
        } else {
            this.id = exclusionsGroupData.id;
            this.hostname = exclusionsGroupData.hostname;
            this.exclusions = exclusionsGroupData.exclusions
                ?.map((exclusion) => new Exclusion(exclusion));
            this.state = exclusionsGroupData.state;
        }
    }

    /**
     * Creates subdomain pattern from provided hostname: domain.com => *.domain.com
     */
    subdomainsPattern(hostname: string) {
        return `*.${hostname}`;
    }

    /**
     * Adds default exclusions to group: domain.com and *.domain.com
     */
    addDefaultExclusions() {
        const hostnameExclusion = new Exclusion(this.hostname);
        this.exclusions.push(hostnameExclusion);

        const subdomainsExclusion = new Exclusion(this.subdomainsPattern(this.hostname));
        this.exclusions.push(subdomainsExclusion);
    }

    /**
     * Adds subdomain to ExclusionsGroup
     */
    addSubdomain(name: string) {
        const subdomainUrl = `${name}.${this.hostname}`;

        // check if same domain exist in ExclusionsGroup already
        if (this.exclusions.some((exclusion) => exclusion.hostname === subdomainUrl)) {
            return;
        }

        const exclusion = new Exclusion(subdomainUrl);
        exclusion.enabled = false;
        this.exclusions.push(exclusion);
        this.updateExclusionsGroupState();
    }

    /**
     * Removes subdomain from ExclusionsGroup
     */
    removeSubdomain(id: string) {
        this.exclusions = this.exclusions.filter((exclusion) => exclusion.id !== id);
        this.updateExclusionsGroupState();
    }

    /**
     * Sets state for provided subdomain by url
     */
    setSubdomainStateByUrl(url: string, enabled: boolean) {
        this.exclusions.forEach((exclusion) => {
            if (exclusion.hostname === url) {
                // eslint-disable-next-line no-param-reassign
                exclusion.enabled = enabled;
            }
        });
        this.updateExclusionsGroupState();
    }

    /**
     * Sets state for provided subdomain by id
     */
    setSubdomainStateById(id: string, enabled: boolean) {
        this.exclusions.forEach((exclusion) => {
            if (exclusion.id === id) {
                // eslint-disable-next-line no-param-reassign
                exclusion.enabled = enabled;
            }
        });
        this.updateExclusionsGroupState();
    }

    /**
     * Toggles state of subdomain
     */
    toggleSubdomainState(id: string) {
        this.exclusions.forEach((exclusion: Exclusion) => {
            if (exclusion.id === id) {
                // eslint-disable-next-line no-param-reassign
                exclusion.enabled = !exclusion.enabled;
            }
        });
        this.updateExclusionsGroupState();
    }

    /**
     * Sets ExclusionsGroup state according to enabled/disabled subdomains
     */
    updateExclusionsGroupState() {
        const enabledExclusions = this.exclusions
            .filter((exclusion: Exclusion) => exclusion.enabled);

        if (enabledExclusions.length === this.exclusions.length) {
            this.state = ExclusionStates.Enabled;
        } else if (!enabledExclusions.length) {
            this.state = ExclusionStates.Disabled;
        } else {
            this.state = ExclusionStates.PartlyEnabled;
        }
    }

    /**
     * Toggles ExclusionsGroup state
     */
    toggleExclusionsGroupState = () => {
        if (this.state === ExclusionStates.Enabled || this.state === ExclusionStates.PartlyEnabled) {
            this.state = ExclusionStates.Disabled;
            this.setSubdomainsState(false);
        } else {
            this.state = ExclusionStates.Enabled;
            this.setSubdomainsState(true);
        }
    }

    /**
     * Enables ExclusionsGroup
     */
    enableExclusionsGroup() {
        this.state = ExclusionStates.Enabled;
        this.setSubdomainsState(true);
    }

    /**
     * Disables ExclusionsGroup
     */
    disableExclusionsGroup() {
        this.state = ExclusionStates.Disabled;
        this.setSubdomainsState(false);
    }

    /**
     * Sets provided state for all subdomains
     */
    setSubdomainsState(enabled: boolean) {
        this.exclusions.forEach((exclusion) => {
            // eslint-disable-next-line no-param-reassign
            exclusion.enabled = enabled;
        });
    }
}
