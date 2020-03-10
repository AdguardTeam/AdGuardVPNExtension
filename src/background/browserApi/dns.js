class DNS {
    constructor() {
        this.DNS_ENABLED = false;
    }

    // eslint-disable-next-line no-unused-vars
    enableDNS = (DNSType) => {
        // enable DNS
    };

    disableDNS = () => {
        // disable DNS
    };

    DNSHandling = (DNSEnabled, DNSType) => {
        // eslint-disable-next-line no-unused-expressions
        this.DNS_ENABLED ? this.enableDNS(DNSType) : this.disableDNS();
    }
}

const dns = new DNS();

export default dns;
