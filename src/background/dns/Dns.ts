import { notifier } from '../../common/notifier';
import { settings } from '../settings';
import { StorageKey, type DnsServerData } from '../schema';
import { StateData } from '../stateStorage';
import { log } from '../../common/logger';
import { DEFAULT_DNS_SERVER, POPULAR_DNS_SERVERS } from '../../common/dnsConstants';
import { profilesService } from '../profiles';

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
     * Selects a DNS server for a specific profile.
     *
     * @param profileId Profile ID.
     * @param dnsServerId The ID of the DNS server to select.
     */
    setProfileDnsServer(profileId: string, dnsServerId: string): Promise<void>;

    /**
     * Adds a custom DNS server.
     *
     * @param dnsServerData The data of the custom DNS server to add.
     * @param profileId Optional profile ID for per-profile DNS.
     */
    addCustomDnsServer(dnsServerData: DnsServerData, profileId?: string): Promise<void>;

    /**
     * Edits an existing custom DNS server.
     *
     * @param dnsServerData The data of the custom DNS server to edit.
     * @param profileId Optional profile ID for per-profile DNS.
     * @returns Updated list of custom DNS servers.
     */
    editCustomDnsServer(dnsServerData: DnsServerData, profileId?: string): Promise<DnsServerData[]>;

    /**
     * Removes a custom DNS server by its ID.
     *
     * @param dnsServerId The ID of the DNS server to remove.
     * @param profileId Optional profile ID for per-profile DNS.
     */
    removeCustomDnsServer(dnsServerId: string, profileId?: string): Promise<void>;

    /**
     * Restores previously removed custom DNS servers from backup.
     *
     * @param profileId Optional profile ID for per-profile DNS.
     * @returns The restored custom DNS servers list data.
     */
    restoreCustomDnsServersData(profileId?: string): Promise<DnsServerData[]>;
}

export class Dns implements DnsInterface {
    /**
     * Dns service state data.
     * Used to save and retrieve dns state from session storage,
     * in order to persist it across service worker restarts.
     */
    private dnsState = new StateData(StorageKey.DnsState);

    /** @inheritdoc */
    public init = async (): Promise<void> => {
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
    public getCurrentDnsServerAddress = async (): Promise<string> => {
        const { selectedDnsServer, customDnsServers } = await this.dnsState.get();

        log.info(`[vpn.Dns]: Getting selected dns server address for id: "${selectedDnsServer}"`);

        const currentDnsServerData = [
            DEFAULT_DNS_SERVER,
            ...POPULAR_DNS_SERVERS,
            ...customDnsServers,
        ].find((server) => server.id === selectedDnsServer);

        if (currentDnsServerData?.address) {
            log.info(`[vpn.Dns]: Found address: "${currentDnsServerData.address}"`);
            return currentDnsServerData.address;
        }

        log.info('[vpn.Dns]: Address not found, using empty string for default dns server');
        return DEFAULT_DNS_SERVER.address;
    };

    /** @inheritdoc */
    public setDnsServer = async (dnsServerId: string): Promise<void> => {
        const { selectedDnsServer } = await this.dnsState.get();
        if (selectedDnsServer === dnsServerId) {
            return;
        }

        await this.dnsState.update({ selectedDnsServer: dnsServerId });
        notifier.notifyListeners(notifier.types.DNS_SERVER_SET, await this.getCurrentDnsServerAddress());
    };

    /** @inheritdoc */
    public setProfileDnsServer = async (profileId: string, dnsServerId: string): Promise<void> => {
        await profilesService.updateProfileSettings(profileId, {
            selectedDnsServer: dnsServerId,
        });
    };

    /** @inheritdoc */
    public addCustomDnsServer = async (
        dnsServerData: DnsServerData,
        profileId?: string,
    ): Promise<void> => {
        if (profileId) {
            const profileSettings = await profilesService.getProfileSettings(profileId);
            const updatedServers = [...profileSettings.customDnsServers, dnsServerData];
            await profilesService.updateProfileSettings(profileId, {
                customDnsServers: updatedServers,
                selectedDnsServer: dnsServerData.id,
            });
            return;
        }

        const { customDnsServers } = await this.dnsState.get();

        customDnsServers.push(dnsServerData);

        await this.dnsState.update({ customDnsServers });
        settings.setCustomDnsServers(customDnsServers);
    };

    /** @inheritdoc */
    public editCustomDnsServer = async (
        dnsServerData: DnsServerData,
        profileId?: string,
    ): Promise<DnsServerData[]> => {
        if (profileId) {
            const profileSettings = await profilesService.getProfileSettings(profileId);
            const updatedServers = profileSettings.customDnsServers.map((s) => {
                return s.id === dnsServerData.id ? dnsServerData : s;
            });
            await profilesService.updateProfileSettings(profileId, {
                customDnsServers: updatedServers,
            });
            return updatedServers;
        }

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
        return customDnsServers;
    };

    /** @inheritdoc */
    public removeCustomDnsServer = async (
        dnsServerId: string,
        profileId?: string,
    ): Promise<void> => {
        if (profileId) {
            const profileSettings = await profilesService.getProfileSettings(profileId);
            const updatedServers = profileSettings.customDnsServers
                .filter((s) => s.id !== dnsServerId);
            const selectedDnsServer = profileSettings.selectedDnsServer === dnsServerId
                ? DEFAULT_DNS_SERVER.id
                : profileSettings.selectedDnsServer;
            await profilesService.updateProfileSettings(profileId, {
                customDnsServers: updatedServers,
                backupDnsServersData: profileSettings.customDnsServers,
                selectedDnsServer,
            });
            return;
        }

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
    public restoreCustomDnsServersData = async (profileId?: string): Promise<DnsServerData[]> => {
        if (profileId) {
            const profileSettings = await profilesService.getProfileSettings(profileId);
            const { backupDnsServersData } = profileSettings;
            await profilesService.updateProfileSettings(profileId, {
                customDnsServers: backupDnsServersData,
            });
            return backupDnsServersData;
        }

        const { backupDnsServersData } = await this.dnsState.get();

        await this.dnsState.update({ customDnsServers: backupDnsServersData });
        settings.setCustomDnsServers(backupDnsServersData);

        return backupDnsServersData;
    };
}
