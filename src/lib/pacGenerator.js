import { convertCidrToNet } from '../background/routability/utils';
import { IPV4_REGEX } from '../background/routability/constants';

/**
 * Returns pac script text
 * We use pacScriptTimeToLiveMs in order to make pac script file inactive if
 * it remained in the proxy setting after browser restart
 * @param proxy
 * @param exclusionsList
 * @param inverted
 * @param defaultExclusions
 * @param nonRoutableNets
 * @returns {string}
 */
function proxyPacScript(proxy, exclusionsList, inverted, defaultExclusions, nonRoutableNets) {
    // Used to adjust pacscript after application or browser restart
    const pacScriptTimeToLiveMs = 200;
    // Used to adjust pacscript lifetime after internet reconnection
    // After this period of time pacscript is always considered activated
    const pacScriptActivationTimeoutMs = 2000;
    return `
            let active = false;
            const created = ${Date.now()};
            const started = Date.now();

            if (started < (created + ${pacScriptTimeToLiveMs})) {
              active = true;
            }

            function FindProxyForURL(url, host) {
                const DIRECT = "DIRECT";
                const PROXY = "HTTPS ${proxy}";

                if (!active && (Date.now() > started + ${pacScriptActivationTimeoutMs})) {
                    active = true;
                }

                if (!active) {
                    return DIRECT;
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
 * @param {string} proxy
 * @param {string[]} exclusionsList
 * @param {boolean} inverted
 * @param {string[]} defaultExclusions
 * @param {string[]} nonRoutableCidrNets
 * @return {string}
 */
const generate = (
    proxy,
    exclusionsList = [],
    inverted = false,
    defaultExclusions = [],
    nonRoutableCidrNets = [],
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
