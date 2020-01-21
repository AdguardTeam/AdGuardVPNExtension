/**
 * Returns pac script text
 * We use pacScriptTimeToLiveMs in order to make pac script file inactive if
 * it remained in the proxy setting after browser restart
 * @param proxy
 * @param exclusionsList
 * @param inverted
 * @param defaultExclusions
 * @returns {string}
 */
function proxyPacScript(proxy, exclusionsList, inverted, defaultExclusions) {
    const pacScriptTimeToLiveMs = 1000;
    return `
            let active = false;
            const created = ${Date.now()};
            const started = Date.now();

            if ((started - ${pacScriptTimeToLiveMs}) < created) {
              active = true;
            }

            function FindProxyForURL(url, host) {
                const DIRECT = "DIRECT";
                const PROXY = "HTTPS ${proxy}";

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

                const defaultExclusions = [${defaultExclusions.map(l => `"${l}"`).join(', ')}];
                if (defaultExclusions.some(el => (areHostnamesEqual(host, el) || shExpMatch(host, el)))) {
                    return DIRECT;
                }

                const inverted = ${inverted};
                const list = [${exclusionsList.map(l => `"${l}"`).join(', ')}];

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

const generate = (proxy, exclusionsList = [], inverted = false, defaultExclusions = []) => {
    if (!proxy) {
        return directPacScript();
    }

    return proxyPacScript(proxy, exclusionsList, inverted, defaultExclusions);
};

export default { generate };
