import { DNS_SERVERS } from './dnsConstants';
import { notifier } from '../../lib/notifier';
import { settings } from '../settings';

interface DnsServerData {
    id: string;
    title: string;
    ip1: string;
}

interface DnsInterface {
    init(): void;
    getDnsServerIp(): string;
    setDnsServer(dnsServerId: string): void;
    addCustomDnsServer(dnsServerData: DnsServerData): void;
    editCustomDnsServer(dnsServerData: DnsServerData): void;
    removeCustomDnsServer(dnsServerId: string): void;
    restoreCustomDnsServersData(): DnsServerData[];
}

export class Dns implements DnsInterface {
    selectedDnsServer: string;

    customDnsServers: DnsServerData[];

    backupDnsServersData: DnsServerData[];

    init = (): void => {
        this.customDnsServers = settings.getCustomDnsServers();
        const selectedDnsServer = settings.getSelectedDnsServer();
        this.setDnsServer(selectedDnsServer);
    };

    /**
     * Returns ip address of current dns server
     */
    getDnsServerIp = (): string => {
        const currentDnsServerData = this.customDnsServers
            .find((server) => server.id === this.selectedDnsServer);
        if (currentDnsServerData?.ip1) {
            return currentDnsServerData.ip1;
        }

        return DNS_SERVERS[this.selectedDnsServer].ip1;
    };

    /**
     * Sets selected dns server
     * @param dnsServerId
     */
    setDnsServer = (dnsServerId: string): void => {
        if (this.selectedDnsServer === dnsServerId) {
            return;
        }
        this.selectedDnsServer = dnsServerId;
        notifier.notifyListeners(notifier.types.DNS_SERVER_SET, this.getDnsServerIp());
    };

    /**
     * Adds custom dns server
     * @param dnsServerData
     */
    addCustomDnsServer = (dnsServerData: DnsServerData): void => {
        this.customDnsServers.push(dnsServerData);
        settings.setCustomDnsServers(this.customDnsServers);
    };

    /**
     * Edit custom dns server
     * @param dnsServerData
     */
    editCustomDnsServer = (dnsServerData: DnsServerData): void => {
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

    /**
     * Removes custom dns server
     * @param dnsServerId
     */
    removeCustomDnsServer = (dnsServerId: string): void => {
        this.backupDnsServersData = this.customDnsServers;
        this.customDnsServers = this.customDnsServers.filter((server) => server.id !== dnsServerId);
        settings.setCustomDnsServers(this.customDnsServers);
    };

    restoreCustomDnsServersData = (): DnsServerData[] => {
        this.customDnsServers = this.backupDnsServersData;
        return this.customDnsServers;
    };
}
