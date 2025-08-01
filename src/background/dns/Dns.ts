import { notifier } from '../../common/notifier';
import { settings } from '../settings';
import { StorageKey, type DnsServerData, type DnsState } from '../schema';
import { stateStorage } from '../stateStorage';
import { log } from '../../common/logger';
import { DEFAULT_DNS_SERVER, POPULAR_DNS_SERVERS } from '../../common/dnsConstants';

interface DnsInterface {
    init(): void;
    getCurrentDnsServerAddress(): string;
    setDnsServer(dnsServerId: string): void;
    addCustomDnsServer(dnsServerData: DnsServerData): void;
    editCustomDnsServer(dnsServerData: DnsServerData): void;
    removeCustomDnsServer(dnsServerId: string): void;
    restoreCustomDnsServersData(): DnsServerData[];
}

export class Dns implements DnsInterface {
    state: DnsState;

    private saveDnsState = () => {
        stateStorage.setItem(StorageKey.DnsState, this.state);
    };

    private get selectedDnsServer(): string | null {
        return this.state.selectedDnsServer;
    }

    private set selectedDnsServer(selectedDnsServer: string | null) {
        this.state.selectedDnsServer = selectedDnsServer;
        this.saveDnsState();
    }

    private get customDnsServers(): DnsServerData[] {
        return this.state.customDnsServers;
    }

    private set customDnsServers(customDnsServers: DnsServerData[]) {
        this.state.customDnsServers = customDnsServers;
        this.saveDnsState();
    }

    // backup data for customDnsServers
    // if user deleted custom dns server and canceled the operation, it will be used to restore data
    private get backupDnsServersData(): DnsServerData[] {
        return this.state.backupDnsServersData;
    }

    private set backupDnsServersData(backupDnsServersData: DnsServerData[]) {
        this.state.backupDnsServersData = backupDnsServersData;
        this.saveDnsState();
    }

    init = (): void => {
        this.state = stateStorage.getItem(StorageKey.DnsState);

        if (this.customDnsServers.length === 0) {
            this.customDnsServers = settings.getCustomDnsServers();
        }

        if (!this.selectedDnsServer) {
            this.selectedDnsServer = settings.getSelectedDnsServer();
            if (!this.selectedDnsServer) {
                this.setDnsServer(DEFAULT_DNS_SERVER.id);
                return;
            }
        }

        this.setDnsServer(this.selectedDnsServer);
    };

    /**
     * Returns address of current dns server
     */
    getCurrentDnsServerAddress = (): string => {
        log.info(`Getting selected dns server address for id: "${this.selectedDnsServer}"`);

        const currentDnsServerData = [
            DEFAULT_DNS_SERVER,
            ...POPULAR_DNS_SERVERS,
            ...this.customDnsServers,
        ].find((server) => server.id === this.selectedDnsServer);

        if (currentDnsServerData?.address) {
            log.info(`Found address: "${currentDnsServerData.address}"`);
            return currentDnsServerData.address;
        }

        log.info('Address not found, using empty string for default dns server');
        return DEFAULT_DNS_SERVER.address;
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
