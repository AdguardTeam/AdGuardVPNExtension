function proxyPacScript(proxy, exclusionsList, inverted) {
    return `function FindProxyForURL(url, host) {
                const DIRECT = "DIRECT";
                const PROXY = "HTTPS ${proxy}";

                if (isPlainHostName(host)
                    || shExpMatch(host, 'localhost')) {
                    return DIRECT;
                }

                const inverted = ${inverted};
                const list = [${exclusionsList.map(l => `"${l}"`).join(', ')}];

                if (list.some(el => shExpMatch(host, el))) {
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

const generate = (proxy, exclusionsList = [], inverted = false) => {
    if (!proxy) {
        return directPacScript();
    }

    return proxyPacScript(proxy, exclusionsList, inverted);
};

export default { generate };
