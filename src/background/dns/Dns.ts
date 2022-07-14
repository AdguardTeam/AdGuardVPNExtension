import { DNS_SERVERS } from './dnsConstants';
import notifier from '../../lib/notifier';
import { settings } from '../settings';

interface DnsServerData {
    id: string;
    title: string;
    ip1: string;
}

export class Dns {
    dnsServer: DnsServerData | string;

    customDnsServers: DnsServerData[];

    init = () => {
        this.customDnsServers = settings.getCustomDnsServers();
        const selectedDnsServer = settings.getSelectedDnsServer();
        this.setDnsServer(selectedDnsServer);
    };

    getDnsServerIp = (): string => {
        // FIXME temp solution
        return this.dnsServer?.ip1 || DNS_SERVERS[this.dnsServer].ip1;
    };

    setDnsServer = (dnsServer: string): void => {
        if (this.dnsServer === dnsServer) {
            return;
        }
        this.dnsServer = dnsServer;
        notifier.notifyListeners(notifier.types.DNS_SERVER_SET, this.getDnsServerIp());
    };

    setCustomDnsServer = (dnsServerData: DnsServerData): void => {
        if (this.dnsServer === dnsServerData.id) {
            return;
        }
        // FIXME fix this.dnsServer type, it has to be string
        this.dnsServer = dnsServerData;
        notifier.notifyListeners(notifier.types.DNS_SERVER_SET, dnsServerData.ip1);
    };

    addCustomDnsServer = (dnsServerData: DnsServerData) => {
        this.customDnsServers.push(dnsServerData);
        settings.setCustomDnsServers(this.customDnsServers);
    };

    editCustomDnsServer = (dnsServerData: DnsServerData) => {
        this.customDnsServers = this.customDnsServers.map((server) => {
            if (server.id === dnsServerData.id) {
                return {
                    id: server.id,
                    title: dnsServerData.title,
                    ip1: dnsServerData.ip1,
                };
            }
            return server;
        });
        settings.setCustomDnsServers(this.customDnsServers);
    };

    removeCustomDnsServer = (dnsServerId: string) => {
        this.customDnsServers = this.customDnsServers.filter((server) => server.id !== dnsServerId);
        settings.setCustomDnsServers(this.customDnsServers);
    };
}
