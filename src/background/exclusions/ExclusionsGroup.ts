import { nanoid } from 'nanoid';

import { Exclusion } from './Exclusion';

export interface ExclusionsGroupInterface {
    id: string;
    hostname: string;
    exclusions: Exclusion[];
}

export class ExclusionsGroup implements ExclusionsGroupInterface {
    id: string;

    hostname: string;

    exclusions: Exclusion[];

    constructor(hostname: string) {
        this.id = nanoid();
        this.hostname = this.prepareHostname(hostname);
        this.exclusions = [];
        this.addDefaultExclusions();
    }

    prepareHostname(hostname: string) {
        return hostname
            ?.trim()
            ?.toLowerCase()
            ?.replace(/http(s)?:\/\/(www\.)?/, '')
            ?.replace(/\/$/, '');
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
     * Adds subdomain to exclusions group
     */
    addSubdomain(name: string) {
        const subdomainUrl = `${name}.${this.hostname}`;

        // check if same domain exist in exclusions group already
        if (this.exclusions.some((exclusion) => exclusion.hostname === subdomainUrl)) {
            return;
        }

        const exclusion = new Exclusion(subdomainUrl);
        this.exclusions.push(exclusion);

        // disable subdomains pattern exclusion (*.domain.com)
        this.setSubdomainState(this.subdomainsPattern(this.hostname), false);
    }

    /**
     * Sets enabled state for provided subdomain
     */
    setSubdomainState(url: string, enabled: boolean) {
        this.exclusions.forEach((exclusion) => {
            if (exclusion.hostname === url) {
                // eslint-disable-next-line no-param-reassign
                exclusion.enabled = enabled;
            }
        });
    }
}
