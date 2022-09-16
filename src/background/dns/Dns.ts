import { DEFAULT_DNS_SERVER, POPULAR_DNS_SERVERS } from './dnsConstants';
import { notifier } from '../../lib/notifier';
import { settings } from '../settings';
import { DnsServerData } from '../../common/components/constants';

interface DnsInterface {
    init(): void;
    getCurrentDnsServerAddress(): string | null;
    setDnsServer(dnsServerId: string): void;
    addCustomDnsServer(dnsServerData: DnsServerData): void;
    editCustomDnsServer(dnsServerData: DnsServerData): void;
    removeCustomDnsServer(dnsServerId: string): void;
    restoreCustomDnsServersData(): DnsServerData[];
}

export class Dns implements DnsInterface {
    selectedDnsServer: string;

    customDnsServers: DnsServerData[];

    // backup data for customDnsServers
    // if user deleted custom dns server and canceled the operation, it will be used to restore data
    backupDnsServersData: DnsServerData[];

    init = (): void => {
        this.customDnsServers = settings.getCustomDnsServers();
        const selectedDnsServer = settings.getSelectedDnsServer();
        if (!selectedDnsServer) {
            this.setDnsServer(DEFAULT_DNS_SERVER.id);
            return;
        }
        this.setDnsServer(selectedDnsServer);
    };

    /**
     * Returns address of current dns server
     */
    getCurrentDnsServerAddress = (): string | null => {
        const currentDnsServerData = [
            DEFAULT_DNS_SERVER,
            ...POPULAR_DNS_SERVERS,
            ...this.customDnsServers,
        ].find((server) => server.id === this.selectedDnsServer);
        if (currentDnsServerData?.address) {
            return currentDnsServerData.address;
        }
        return null;
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
        notifier.notifyListeners(notifier.types.DNS_SERVER_SET, this.getCurrentDnsServerAddress());
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
                    address: dnsServerData.address,
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
        settings.setCustomDnsServers(this.customDnsServers);
        return this.customDnsServers;
    };
}
