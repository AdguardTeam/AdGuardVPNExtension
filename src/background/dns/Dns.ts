import { isIP } from 'is-ip';

import { DEFAULT_DNS_SERVER, POPULAR_DNS_SERVERS } from './dnsConstants';
import { notifier } from '../../lib/notifier';
import { settings } from '../settings';
import { DnsServerData, DnsState, StorageKey } from '../schema';
import { stateStorage } from '../stateStorage';
import { DnsOperationResult } from '../../lib/constants';
import { notifications } from '../notifications';
import { translator } from '../../common/translator';

interface DnsInterface {
    init(): void;
    getCurrentDnsServerAddress(): string;
    setDnsServer(dnsServerId: string): void;
    addCustomDnsServer(dnsServerData: DnsServerData): DnsOperationResult;
    editCustomDnsServer(dnsServerData: DnsServerData): DnsOperationResult;
    removeCustomDnsServer(dnsServerId: string): void;
    restoreCustomDnsServersData(): DnsServerData[];
}

const DOH_PREFIX = 'https://';
const DOT_PREFIX = 'tls://';

export class Dns implements DnsInterface {
    state: DnsState;

    private saveDnsState = () => {
        stateStorage.setItem(StorageKey.ProxyState, this.state);
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

        if (!this.customDnsServers) {
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
        const currentDnsServerData = [
            DEFAULT_DNS_SERVER,
            ...POPULAR_DNS_SERVERS,
            ...this.customDnsServers,
        ].find((server) => server.id === this.selectedDnsServer);
        if (currentDnsServerData?.address) {
            return currentDnsServerData.address;
        }
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

    validateDnsAddress = (dnsServerData: DnsServerData) => {
        // for the moment only plain dns and tls supported
        if (dnsServerData.address.startsWith(DOH_PREFIX) || !dnsServerData.address.includes('.')) {
            return DnsOperationResult.Invalid;
        }

        const dnsAddressToAdd = isIP(dnsServerData.address) || dnsServerData.address.startsWith(DOT_PREFIX)
            ? dnsServerData.address
            : `${DOT_PREFIX}${dnsServerData.address}`;

        // check existing custom dns addresses
        if (this.customDnsServers.some((server) => server.address === dnsAddressToAdd)) {
            return DnsOperationResult.Duplicate;
        }

        return null;
    };

    /**
     * Adds custom dns server
     * @param dnsServerData
     * @param notify
     */
    addCustomDnsServer = (dnsServerData: DnsServerData, notify: boolean = false): DnsOperationResult => {
        const error = this.validateDnsAddress(dnsServerData);
        if (error) {
            if (notify) {
                const errorMessageKey = error === DnsOperationResult.Invalid
                    ? 'settings_dns_add_custom_server_invalid_address'
                    : 'settings_dns_add_custom_server_duplicate_address';
                notifications.create({ message: translator.getMessage(errorMessageKey) });
            }
            return error;
        }

        this.customDnsServers.push(dnsServerData);
        settings.setCustomDnsServers(this.customDnsServers);

        if (notify) {
            notifications.create({ message: translator.getMessage('settings_dns_add_custom_server_notification_success') });
        }

        return DnsOperationResult.Success;
    };

    /**
     * Edit custom dns server
     * @param dnsServerNewData
     */
    editCustomDnsServer = (dnsServerNewData: DnsServerData): DnsOperationResult => {
        const dnsServerPreviousData = this.customDnsServers
            .find((server) => server.id === dnsServerNewData.id);

        // if dns address was edited, it has to be verified
        if (dnsServerNewData.address !== dnsServerPreviousData?.address) {
            const error = this.validateDnsAddress(dnsServerNewData);
            if (error) {
                return error;
            }
        }

        this.customDnsServers = this.customDnsServers.map((server) => {
            if (server.id === dnsServerNewData.id) {
                return {
                    id: server.id,
                    title: dnsServerNewData.title,
                    address: dnsServerNewData.address,
                };
            }
            return server;
        });
        settings.setCustomDnsServers(this.customDnsServers);

        return DnsOperationResult.Success;
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
