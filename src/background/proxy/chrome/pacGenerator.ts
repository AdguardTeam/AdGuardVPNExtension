import { convertCidrToNet } from '../../routability/utils';
import { IPV4_REGEX } from '../../routability/constants';
import { PAC_SCRIPT_CHECK_URL } from '../proxyConsts';

/**
 * Generates PAC script for proxy considering exclusions list
 * @param proxy
 * @param exclusionsList
 * @param inverted
 * @param defaultExclusions
 * @param nonRoutableNets
 */
function proxyPacScript(
    proxy: string,
    exclusionsList: string[],
    inverted: boolean,
    defaultExclusions: string[],
    nonRoutableNets: string[][],
): string {
    return `
            function FindProxyForURL(url, host) {
                const DIRECT = "DIRECT";
                const PROXY = "HTTPS ${proxy}";

                // It is important for us that request to PAC_SCRIPT_CHECK_URL went through the proxy, because we need
                // onAuthRequired event to be triggered
                if (host.endsWith('.' + '${PAC_SCRIPT_CHECK_URL}')) {
                    return PROXY;
                }

                const areHostnamesEqual = (hostnameA, hostnameB) => {
                    const wwwRegex = /^www\\./;
                    const oldHostnameWithoutWww = hostnameA.replace(wwwRegex, '');
                    const newHostnameWithoutWww = hostnameB.replace(wwwRegex, '');
                    return oldHostnameWithoutWww === newHostnameWithoutWww;
                };

                if (isPlainHostName(host)
                    || shExpMatch(host, 'localhost')) {
                    return DIRECT;
                }

                const ipv4Regex = new RegExp(${IPV4_REGEX});
                const nonRoutableNets = ${JSON.stringify(nonRoutableNets)};
                if (ipv4Regex.test(host) && nonRoutableNets.some(([pattern, mask]) => isInNet(host, pattern, mask))) {
                    return DIRECT;
                }

                const defaultExclusions = ${JSON.stringify(defaultExclusions)};
                if (defaultExclusions.some(el => (areHostnamesEqual(host, el) || shExpMatch(host, el)))) {
                    return DIRECT;
                }

                const inverted = ${inverted};
                const list = ${JSON.stringify(exclusionsList)};

                if (list.some(el => (areHostnamesEqual(host, el) || shExpMatch(host, el)))) {
                    if (inverted) {
                        return PROXY;
                    } else {
                        return DIRECT;
                    }
                }

                return inverted ? DIRECT : PROXY;
            }`;
}

function directPacScript() {
    return `function FindProxyForURL() {
        return 'DIRECT';
    }`;
}

/**
 *
 * @param proxy
 * @param exclusionsList
 * @param inverted
 * @param defaultExclusions
 * @param nonRoutableCidrNets
 */
const generate = (
    proxy: string,
    exclusionsList: string[] = [],
    inverted = false,
    defaultExclusions: string[] = [],
    nonRoutableCidrNets: string[] = [],
) => {
    if (!proxy) {
        return directPacScript();
    }

    const nonRoutableNets = nonRoutableCidrNets.map((net) => {
        return convertCidrToNet(net);
    });

    return proxyPacScript(proxy, exclusionsList, inverted, defaultExclusions, nonRoutableNets);
};

export default { generate };
