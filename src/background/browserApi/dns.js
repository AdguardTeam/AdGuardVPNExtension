class DNS {
    constructor() {
        this.DNS_ENABLED = false;
    }

    enableDNS = () => {
        // enable DNS
    };

    disableDNS = () => {
        // disable DNS
    };

    DNSHandling = (DNSEnabled, proxyEnabled) => {
        this.DNS_ENABLED = DNSEnabled;
        if (!DNSEnabled || !proxyEnabled) {
            this.disableDNS();
        } else if (DNSEnabled && proxyEnabled) {
            this.enableDNS();
        }
    };
}

const dns = new DNS();

export default dns;
