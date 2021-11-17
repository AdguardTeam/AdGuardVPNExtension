import {nanoid} from 'nanoid';

import {Exclusion} from './Exclusion';
import {prepareUrl} from '../../lib/helpers';
import {STATE} from '../../common/exclusionsConstants';

export interface ExclusionsGroupInterface {
    id: string;
    hostname: string;
    exclusions: Exclusion[];
    state: STATE;
}

export class ExclusionsGroup implements ExclusionsGroupInterface {
    id: string;

    hostname: string;

    exclusions: Exclusion[];

    state: STATE;

    constructor(hostname: string) {
        this.id = nanoid();
        this.hostname = prepareUrl(hostname);
        this.exclusions = [];
        this.addDefaultExclusions();
        this.state = STATE.Enabled;
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
        this.exclusions.push(exclusion);

        // disable subdomains pattern exclusion (*.domain.com)
        this.setSubdomainStateByUrl(this.subdomainsPattern(this.hostname), false);
    }

    /**
     * Removes subdomain from ExclusionsGroup
     */
    removeSubdomain(id: string) {
        this.exclusions = this.exclusions.filter((exclusion) => exclusion.id !== id);
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
            this.state = STATE.Enabled;
        } else if (!enabledExclusions.length) {
            this.state = STATE.Disabled;
        } else {
            this.state = STATE.PartlyEnabled;
        }
    }

    /**
     * Toggles ExclusionsGroup state
     */
    toggleExclusionsGroupState() {
        if (this.state === STATE.Enabled || this.state === STATE.PartlyEnabled) {
            this.state = STATE.Disabled;
            this.setSubdomainsState(false);
        } else {
            this.state = STATE.Enabled;
            this.setSubdomainsState(true);
        }
    }

    /**
     * Enables ExclusionsGroup
     */
    enableExclusionsGroup() {
        this.state = STATE.Enabled;
        this.setSubdomainsState(true);
    }

    /**
     * Disables ExclusionsGroup
     */
    disableExclusionsGroup() {
        this.state = STATE.Disabled;
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
