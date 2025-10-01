import { notifier } from '../../common/notifier';
import { settings } from '../settings';
import { StorageKey, type DnsServerData } from '../schema';
import { StateData } from '../stateStorage';
import { log } from '../../common/logger';
import { DEFAULT_DNS_SERVER, POPULAR_DNS_SERVERS } from '../../common/dnsConstants';

interface DnsInterface {
    /**
     * Initializes the DNS service by loading settings.
     */
    init(): Promise<void>;

    /**
     * Retrieves the address of the currently selected DNS server.
     *
     * @returns DNS server address or empty string if not selected any.
     */
    getCurrentDnsServerAddress(): Promise<string>;

    /**
     * Selects a DNS server by its ID.
     *
     * @param dnsServerId The ID of the DNS server to select.
     */
    setDnsServer(dnsServerId: string): Promise<void>;

    /**
     * Adds a custom DNS server.
     *
     * @param dnsServerData The data of the custom DNS server to add.
     */
    addCustomDnsServer(dnsServerData: DnsServerData): Promise<void>;

    /**
     * Edits an existing custom DNS server.
     *
     * @param dnsServerData The data of the custom DNS server to edit.
     */
    editCustomDnsServer(dnsServerData: DnsServerData): Promise<void>;

    /**
     * Removes a custom DNS server by its ID.
     *
     * @param dnsServerId The ID of the DNS server to remove.
     */
    removeCustomDnsServer(dnsServerId: string): Promise<void>;

    /**
     * Restores previously removed custom DNS servers from backup.
     *
     * @returns The restored custom DNS servers list data.
     */
    restoreCustomDnsServersData(): Promise<DnsServerData[]>;
}

export class Dns implements DnsInterface {
    /**
     * Dns service state data.
     * Used to save and retrieve dns state from session storage,
     * in order to persist it across service worker restarts.
     */
    private dnsState = new StateData(StorageKey.DnsState);

    /** @inheritdoc */
    init = async (): Promise<void> => {
        let { customDnsServers, selectedDnsServer } = await this.dnsState.get();

        if (customDnsServers.length === 0) {
            customDnsServers = settings.getCustomDnsServers();
            await this.dnsState.update({ customDnsServers });
        }

        if (!selectedDnsServer) {
            selectedDnsServer = settings.getSelectedDnsServer() || DEFAULT_DNS_SERVER.id;
        }

        await this.setDnsServer(selectedDnsServer);
    };

    /** @inheritdoc */
    getCurrentDnsServerAddress = async (): Promise<string> => {
        const { selectedDnsServer, customDnsServers } = await this.dnsState.get();

        log.info(`Getting selected dns server address for id: "${selectedDnsServer}"`);

        const currentDnsServerData = [
            DEFAULT_DNS_SERVER,
            ...POPULAR_DNS_SERVERS,
            ...customDnsServers,
        ].find((server) => server.id === selectedDnsServer);

        if (currentDnsServerData?.address) {
            log.info(`Found address: "${currentDnsServerData.address}"`);
            return currentDnsServerData.address;
        }

        log.info('Address not found, using empty string for default dns server');
        return DEFAULT_DNS_SERVER.address;
    };

    /** @inheritdoc */
    setDnsServer = async (dnsServerId: string): Promise<void> => {
        const { selectedDnsServer } = await this.dnsState.get();
        if (selectedDnsServer === dnsServerId) {
            return;
        }

        await this.dnsState.update({ selectedDnsServer: dnsServerId });
        notifier.notifyListeners(notifier.types.DNS_SERVER_SET, await this.getCurrentDnsServerAddress());
    };

    /** @inheritdoc */
    addCustomDnsServer = async (dnsServerData: DnsServerData): Promise<void> => {
        const { customDnsServers } = await this.dnsState.get();

        customDnsServers.push(dnsServerData);

        await this.dnsState.update({ customDnsServers });
        settings.setCustomDnsServers(customDnsServers);
    };

    /** @inheritdoc */
    editCustomDnsServer = async (dnsServerData: DnsServerData): Promise<void> => {
        let { customDnsServers } = await this.dnsState.get();

        customDnsServers = customDnsServers.map((server) => {
            if (server.id === dnsServerData.id) {
                return {
                    id: server.id,
                    title: dnsServerData.title,
                    address: dnsServerData.address,
                };
            }
            return server;
        });

        await this.dnsState.update({ customDnsServers });
        settings.setCustomDnsServers(customDnsServers);
    };

    /** @inheritdoc */
    removeCustomDnsServer = async (dnsServerId: string): Promise<void> => {
        const { customDnsServers } = await this.dnsState.get();

        const newBackupServersData = customDnsServers;
        const newCustomDnsServers = customDnsServers.filter((server) => server.id !== dnsServerId);

        await this.dnsState.update({
            customDnsServers: newCustomDnsServers,
            backupDnsServersData: newBackupServersData,
        });

        settings.setCustomDnsServers(newCustomDnsServers);
    };

    /** @inheritdoc */
    restoreCustomDnsServersData = async (): Promise<DnsServerData[]> => {
        const { backupDnsServersData } = await this.dnsState.get();

        await this.dnsState.update({ customDnsServers: backupDnsServersData });
        settings.setCustomDnsServers(backupDnsServersData);

        return backupDnsServersData;
    };
}
