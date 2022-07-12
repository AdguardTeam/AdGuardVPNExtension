import { DNS_SERVERS, DNS_DEFAULT } from './dnsConstants';
import notifier from '../../lib/notifier';

class Dns {
    constructor() {
        this.setDnsServer(DNS_DEFAULT);
    }

    getDnsServerIp = () => {
        // FIXME temp solution
        return this.dnsServer?.ip1 || DNS_SERVERS[this.dnsServer].ip1;
    };

    setDnsServer = (dnsServer) => {
        if (this.dnsServer === dnsServer) {
            return;
        }
        this.dnsServer = dnsServer;
        notifier.notifyListeners(notifier.types.DNS_SERVER_SET, this.getDnsServerIp());
    };

    setCustomDnsServer = (dnsServerData) => {
        if (this.dnsServer === dnsServerData.id) {
            return;
        }
        // FIXME fix this.dnsServer type, it has to be string
        this.dnsServer = dnsServerData;
        notifier.notifyListeners(notifier.types.DNS_SERVER_SET, dnsServerData.ip1);
    };
}

const dns = new Dns();

export default dns;
