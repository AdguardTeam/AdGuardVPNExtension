class AbstractProxyAuthTrigger {
    async run() {
        throw new Error('Not implemented');
    }
}

export const proxyAuthTrigger = new AbstractProxyAuthTrigger();
