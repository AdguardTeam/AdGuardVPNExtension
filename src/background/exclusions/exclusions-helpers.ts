import { nanoid } from 'nanoid';
import { isIP } from 'is-ip';

import { getETld, getSubdomain, isWildcard } from '../../common/utils/url';
import { log } from '../../common/logger';
import { ExclusionState } from '../../common/exclusionsConstants';
import type { ServicesInterface, ExclusionInterface } from '../schema';

interface ExclusionGroup {
    [key: string]: ExclusionInterface;
}

interface IndexedExclusionsMap {
    [key: string]: ExclusionGroup;
}

interface ServicesIndex {
    [domain: string]: string;
}

const generateExclusions = (exclusion: ExclusionInterface): ExclusionInterface[] => {
    const { hostname } = exclusion;

    const eTld = getETld(hostname);

    if (!eTld) {
        log.error(`All hostnames should have eTld ${hostname}`);
        return [exclusion];
    }

    if (isIP(hostname)) {
        return [exclusion];
    }

    const subdomain = getSubdomain(hostname, eTld);

    if (subdomain) {
        if (isWildcard(subdomain)) {
            return [
                exclusion,
                { id: nanoid(), hostname: eTld, state: ExclusionState.Disabled },
            ];
        }
        return [
            exclusion,
            { id: nanoid(), hostname: eTld, state: ExclusionState.Disabled },
            { id: nanoid(), hostname: `*.${eTld}`, state: ExclusionState.Disabled },
        ];
    }

    return [
        exclusion,
        { id: nanoid(), hostname: `*.${eTld}`, state: ExclusionState.Disabled },
    ];
};

/**
 * Complements an exclusions group with a new exclusion.
 *
 * @param exclusionsTargetGroup The target exclusions group to complement.
 * @param exclusion The exclusion to add to the group.
 *
 * @returns The complemented exclusions group.
 */
const complementExclusionsGroup = (
    exclusionsTargetGroup: ExclusionGroup,
    exclusion: ExclusionInterface,
): ExclusionGroup => {
    const resultGroup = { ...exclusionsTargetGroup };
    const foundExclusion = exclusionsTargetGroup[exclusion.hostname];

    if (foundExclusion) {
        resultGroup[exclusion.hostname] = { ...foundExclusion, state: exclusion.state };
    } else {
        const generatedExclusions = generateExclusions(exclusion);
        generatedExclusions.forEach((exclusion) => {
            resultGroup[exclusion.hostname] = exclusion;
        });
    }

    return resultGroup;
};

/**
 * Complements exclusions by scheme
 * if founds eTLD exclusion, adds disabled wildcard exclusion
 * if founds wildcard exclusion, adds eTLD disabled exclusion
 * if founds subdomain exclusion, adds disabled wildcard and eTLD exclusions
 *
 * @returns Complemented exclusions list.
 */
export const complementExclusions = (exclusions: ExclusionInterface[]): ExclusionInterface[] => {
    const complementedExclusions = exclusions.reduce((acc: IndexedExclusionsMap, exclusion) => {
        const eTld = getETld(exclusion.hostname);

        if (!eTld) {
            log.debug(`Exclusion hostname ${exclusion} doesn't have eTld`);
            return acc;
        }

        const exclusionsGroup = acc[eTld];

        if (exclusionsGroup) {
            acc[eTld] = complementExclusionsGroup(exclusionsGroup, exclusion);
        } else {
            acc[eTld] = complementExclusionsGroup({}, exclusion);
        }

        return acc;
    }, {});

    return Object.values(complementedExclusions).flatMap((group) => Object.values(group));
};

const createServicesIndex = (services: ServicesInterface): ServicesIndex => {
    return Object.values(services).reduce((acc: ServicesIndex, service) => {
        service.domains.forEach((domain) => {
            acc[domain] = service.serviceId;
        });

        return acc;
    }, {});
};

const generateExclusionsFromDomains = (domains: string[]): ExclusionInterface[] => {
    return domains.flatMap((domain) => {
        return [
            { id: nanoid(), hostname: domain, state: ExclusionState.Disabled },
            { id: nanoid(), hostname: `*.${domain}`, state: ExclusionState.Disabled },
        ];
    });
};

/**
 * Complements an exclusions group with generated exclusions from domains.
 *
 * @param exclusionGroup The exclusions group to complement.
 * @param exclusion The exclusion to process.
 * @param domain The domain to generate exclusions from.
 *
 * @returns The complemented exclusions group.
 */
const complementExclusionsGroupWithDomains = (
    exclusionGroup: ExclusionGroup,
    exclusion: ExclusionInterface,
    domain: string,
): ExclusionGroup => {
    const resultGroup = { ...exclusionGroup };

    const generatedExclusions = generateExclusionsFromDomains([domain]);
    generatedExclusions.forEach((exclusion) => {
        if (resultGroup[exclusion.hostname]) {
            return;
        }
        resultGroup[exclusion.hostname] = exclusion;
    });

    const foundExclusion = resultGroup[exclusion.hostname];
    if (foundExclusion) {
        // after exclusions added from domains, update state for existing exclusion
        resultGroup[exclusion.hostname] = { ...foundExclusion, state: exclusion.state };
    }

    return resultGroup;
};

const complementExclusionsMapWithServiceDomains = (
    map: IndexedExclusionsMap,
    exclusion: ExclusionInterface,
    domains: string[],
): IndexedExclusionsMap => {
    const resultMap = { ...map };

    domains.forEach((domain) => {
        const exclusionsGroup = resultMap[domain];

        if (exclusionsGroup) {
            resultMap[domain] = complementExclusionsGroupWithDomains(
                exclusionsGroup,
                exclusion,
                domain,
            );
        } else {
            resultMap[domain] = complementExclusionsGroupWithDomains(
                {},
                exclusion,
                domain,
            );
        }
    });

    return resultMap;
};

export const complementedExclusionsWithServices = (
    exclusions: ExclusionInterface[],
    services: ServicesInterface,
): ExclusionInterface[] => {
    const servicesIndex = createServicesIndex(services);

    const complementedExclusions = exclusions.reduce((acc: IndexedExclusionsMap, exclusion) => {
        const eTld = getETld(exclusion.hostname);

        if (!eTld) {
            log.debug(`Exclusion hostname ${exclusion} doesn't have eTld`);
            return acc;
        }

        const service = services[servicesIndex[eTld]];

        if (service) {
            return complementExclusionsMapWithServiceDomains(acc, exclusion, service.domains);
        }

        const foundGroup = acc[eTld];

        if (foundGroup) {
            foundGroup[exclusion.hostname] = exclusion;
        } else {
            acc[eTld] = { [exclusion.hostname]: exclusion };
        }

        return acc;
    }, {});

    return Object.values(complementedExclusions).flatMap((group) => Object.values(group));
};
