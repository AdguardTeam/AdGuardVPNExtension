import { AMO_EULA_URL, AMO_PRIVACY_URL, FORWARDER_URL_QUERIES } from '../background/config';

import { getForwarderUrl } from './helpers';
import { Prefs } from './prefs';

/**
 * Returns URLs for Privacy Policy and EULA based on the browser type.
 *
 * @param forwarderDomain Forwarder domain to use for generating URLs.
 *
 * @returns Privacy and EULA URLs.
 */
export const getPrivacyAndEulaUrls = (forwarderDomain: string) => {
    if (Prefs.isFirefox()) {
        return {
            privacyUrl: AMO_PRIVACY_URL,
            eulaUrl: AMO_EULA_URL,
        };
    }

    return {
        privacyUrl: getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.PRIVACY),
        eulaUrl: getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.EULA),
    };
};
