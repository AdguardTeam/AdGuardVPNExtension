import { DNS_SERVERS, DNS_DEFAULT } from './dnsConstants';
import notifier from '../../lib/notifier';

class Dns {
    constructor() {
        this.setDnsServer(DNS_DEFAULT);
    }

    getDnsServerIp = () => {
        return DNS_SERVERS[this.dnsServer].ip1;
    };

    setDnsServer = (dnsServer) => {
        if (this.dnsServer === dnsServer) {
            return;
        }
        this.dnsServer = dnsServer;
        notifier.notifyListeners(notifier.types.DNS_SERVER_SET, this.getDnsServerIp());
    };
}

const dns = new Dns();

export default dns;
