import ipaddr from 'ipaddr.js';
import { nanoid } from 'nanoid';
import { ExclusionInterface } from './exclusions/exclusionsTypes';
import { getETld, getSubdomain } from '../../common/url-utils';
import { log } from '../../lib/logger';
import { isWildcard } from './ExclusionsService';
import { ExclusionState } from '../../common/exclusionsConstants';

interface ExclusionGroup {
    [key: string]: ExclusionInterface;
}

interface IndexedExclusionsMap {
    [key: string]: ExclusionGroup;
}

const generateExclusions = (exclusion: ExclusionInterface): ExclusionInterface[] => {
    const { hostname } = exclusion;

    const eTld = getETld(hostname);

    if (!eTld) {
        log.error(`All hostnames should have eTld ${hostname}`);
        return [exclusion];
    }

    if (ipaddr.isValid(hostname)) {
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

const complementExclusionsGroup = (
    exclusionsTargetGroup: ExclusionGroup,
    exclusion: ExclusionInterface,
) => {
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
 */
export const complementExclusions = (exclusions: ExclusionInterface[]) => {
    const complementedExclusions = exclusions.reduce((acc, exclusion) => {
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
    }, {} as IndexedExclusionsMap);

    return Object.values(complementedExclusions).flatMap((group) => Object.values(group));
};
