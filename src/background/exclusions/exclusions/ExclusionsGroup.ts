import { nanoid } from 'nanoid';

import { Exclusion } from './Exclusion';
import { prepareUrl } from '../../../lib/helpers';
import { ExclusionStates } from '../../../common/exclusionsConstants';

const SUBDOMAIN_NAME_REGEX = /^\w+$/;

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
            const hostname = prepareUrl(exclusionsGroupData);
            if (!hostname) {
                throw new Error('Unable to create ExclusionsGroup: invalid url');
            }
            this.id = nanoid();
            this.hostname = hostname;
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
     * Returns subdomain url
     */
    resolveSubdomainUrl(name: string) {
        if (SUBDOMAIN_NAME_REGEX.test(name)) {
            return `${name}.${this.hostname}`;
        }
        const subdomainUrl = prepareUrl(name);
        if (!subdomainUrl) {
            // TODO handle errors of ExclusionsGroup
            throw new Error('Unable to create ExclusionsGroup: invalid subdomain');
        }
        if (subdomainUrl.endsWith(this.hostname)) {
            return subdomainUrl;
        }
        return `${subdomainUrl}.${this.hostname}`;
    }

    /**
     * Adds subdomain to ExclusionsGroup
     */
    addSubdomain(name: string) {
        const subdomainUrl = this.resolveSubdomainUrl(name);

        // check if same domain exist in ExclusionsGroup already
        if (this.exclusions.some((exclusion) => exclusion.hostname === subdomainUrl)) {
            return;
        }

        const exclusion = new Exclusion(subdomainUrl);
        exclusion.enabled = ExclusionStates.Enabled;
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
    setSubdomainStateByUrl(url: string, enabled: ExclusionStates) {
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
    setSubdomainStateById(id: string, enabled: ExclusionStates) {
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
                exclusion.enabled = exclusion.enabled === ExclusionStates.Enabled
                    ? ExclusionStates.Disabled
                    : ExclusionStates.Enabled;
            }
        });
        this.updateExclusionsGroupState();
    }

    /**
     * Sets ExclusionsGroup state according to enabled/disabled subdomains
     */
    updateExclusionsGroupState() {
        const enabledExclusions = this.exclusions
            .filter((exclusion: Exclusion) => exclusion.enabled === ExclusionStates.Enabled);

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
        if (this.state === ExclusionStates.Enabled
            || this.state === ExclusionStates.PartlyEnabled) {
            this.state = ExclusionStates.Disabled;
            this.setSubdomainsState(ExclusionStates.Disabled);
        } else {
            this.state = ExclusionStates.Enabled;
            this.setSubdomainsState(ExclusionStates.Enabled);
        }
    };

    /**
     * Enables ExclusionsGroup
     */
    setExclusionsGroupState(enabled: ExclusionStates) {
        this.state = enabled;
        this.setSubdomainsState(enabled);
    }

    /**
     * Enables ExclusionsGroup
     */
    enableExclusionsGroup() {
        this.setExclusionsGroupState(ExclusionStates.Enabled);
    }

    /**
     * Disables ExclusionsGroup
     */
    disableExclusionsGroup() {
        this.setExclusionsGroupState(ExclusionStates.Disabled);
    }

    /**
     * Sets provided state for all subdomains
     */
    setSubdomainsState(enabled: ExclusionStates) {
        this.exclusions.forEach((exclusion) => {
            // eslint-disable-next-line no-param-reassign
            exclusion.enabled = enabled;
        });
    }
}
