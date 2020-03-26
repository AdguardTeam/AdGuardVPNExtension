import { DNS_DEFAULT } from './dnsConsts';
import log from '../../lib/logger';
import connectivity from '../connectivity';

class Dns {
    constructor() {
        this.dnsServer = DNS_DEFAULT;
    }

    setDns = (dnsServer, proxyEnabled) => {
        if (this.dnsServer !== dnsServer) {
            this.turnOffDns();
        }
        this.dnsServer = dnsServer;
        if (proxyEnabled && this.dnsServer !== DNS_DEFAULT) {
            this.turnOnDns();
        } else {
            this.turnOffDns();
        }
    };

    turnOnDns = () => {
        connectivity.endpointConnectivity.sendDnsSettings(this.dnsServer);
        log.info(`DNS "${this.dnsServer}" enabled`);
    };

    turnOffDns = () => {
        connectivity.endpointConnectivity.sendDnsSettings('');
        log.info('DNS disabled');
    };
}

const dns = new Dns();

export default dns;
