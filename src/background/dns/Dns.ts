import { notifier } from '../../common/notifier';
import { StorageKey, type DnsServerData, type ProfileSettings } from '../schema';
import { StateData } from '../stateStorage';
import { log } from '../../common/logger';
import { DEFAULT_DNS_SERVER, POPULAR_DNS_SERVERS } from '../../common/dnsConstants';
import { profilesService } from '../profiles';

/**
 * DNS service that manages per-profile DNS server selection and custom servers.
 *
 * All DNS data (selected server, custom servers) lives in profile settings.
 * The service uses session storage (`dnsState`) only to cache the active
 * profile's DNS for fast WebSocket recovery after service-worker restarts.
 */
export class Dns {
    /**
     * Dns service state data.
     * Used to save and retrieve dns state from session storage,
     * in order to persist it across service worker restarts.
     */
    private dnsState = new StateData(StorageKey.DnsState);

    /**
     * Initialises the DNS service by loading the active profile's DNS
     * settings into session storage and applying them to the VPN tunnel.
     */
    public init = async (): Promise<void> => {
        let { customDnsServers, selectedDnsServer } = await this.dnsState.get();

        let profileSettings: ProfileSettings | undefined;

        if (customDnsServers.length === 0) {
            profileSettings = profilesService.getActiveProfileSettings();
            customDnsServers = profileSettings.customDnsServers;
            await this.dnsState.update({ customDnsServers });
        }

        if (!selectedDnsServer) {
            profileSettings ??= profilesService.getActiveProfileSettings();
            selectedDnsServer = profileSettings.selectedDnsServer || DEFAULT_DNS_SERVER.id;
            // selectedDnsServer is not written to dnsState here directly —
            // the subsequent applyDnsServer call persists it as a side effect.
        }

        await this.applyDnsServer(selectedDnsServer);
    };

    /**
     * Re-initialises the DNS session cache from the given profile.
     * Called during profile switching to replace the cached DNS settings
     * with those of the target profile.
     *
     * @param profileId Profile to apply.
     */
    public applyActiveProfile = async (profileId: string): Promise<void> => {
        const profileSettings = profilesService.getProfileSettings(profileId);
        const { selectedDnsServer, customDnsServers } = profileSettings;
        const effectiveDnsServerId = selectedDnsServer || DEFAULT_DNS_SERVER.id;

        await this.dnsState.update({
            customDnsServers,
            selectedDnsServer: effectiveDnsServerId,
        });

        await this.applyDnsServer(effectiveDnsServerId);
    };

    /**
     * Selects a DNS server for the given profile.
     * If the profile is active, applies the change to the live VPN connection.
     *
     * @param profileId Profile ID.
     * @param dnsServerId DNS server ID to select.
     */
    public setDnsServer = async (profileId: string, dnsServerId: string): Promise<void> => {
        await profilesService.updateProfileSettings(
            profileId,
            { selectedDnsServer: dnsServerId },
            async () => {
                await this.applyDnsServer(dnsServerId);
            },
        );
    };

    /**
     * Retrieves the address of the currently selected DNS server.
     *
     * @returns DNS server address or empty string if not selected any.
     */
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

    /**
     * Updates the session cache with the given DNS server ID
     * and notifies the WebSocket layer about the change.
     *
     * @param dnsServerId DNS server ID to apply.
     */
    private applyDnsServer = async (dnsServerId: string): Promise<void> => {
        const { selectedDnsServer } = await this.dnsState.get();
        if (selectedDnsServer === dnsServerId) {
            return;
        }

        await this.dnsState.update({ selectedDnsServer: dnsServerId });
        await this.notifyDnsServerChanged();
    };

    /**
     * Notifies the WebSocket layer about the current DNS server address.
     * Use directly when the address changes without changing the server ID
     * (e.g. editing a custom DNS server).
     */
    private notifyDnsServerChanged = async (): Promise<void> => {
        notifier.notifyListeners(
            notifier.types.DNS_SERVER_SET,
            await this.getCurrentDnsServerAddress(),
        );
    };

    /**
     * Adds a custom DNS server to the given profile.
     * If the profile is active, syncs session storage cache.
     * Selection of the new server is handled by the UI store.
     *
     * @param profileId Profile ID.
     * @param dnsServerData Custom DNS server data.
     */
    public addCustomDnsServer = async (
        profileId: string,
        dnsServerData: DnsServerData,
    ): Promise<void> => {
        const profileSettings = profilesService.getProfileSettings(profileId);
        const updatedCustomServers = [...profileSettings.customDnsServers, dnsServerData];

        // updateProfileSettings runs this callback only for the active profile.
        // dnsState stores the applied DNS cache for the active profile only.
        await profilesService.updateProfileSettings(
            profileId,
            { customDnsServers: updatedCustomServers },
            async () => {
                await this.dnsState.update({ customDnsServers: updatedCustomServers });
            },
        );
    };

    /**
     * Edits an existing custom DNS server in the given profile.
     * If the profile is active, syncs session storage cache.
     *
     * @param profileId Profile ID.
     * @param dnsServerData Updated DNS server data (matched by id).
     * @returns Updated custom DNS servers list.
     */
    public editCustomDnsServer = async (
        profileId: string,
        dnsServerData: DnsServerData,
    ): Promise<DnsServerData[]> => {
        const profileSettings = profilesService.getProfileSettings(profileId);
        const updatedCustomServers = profileSettings.customDnsServers.map((server) => {
            if (server.id === dnsServerData.id) {
                return {
                    id: server.id,
                    title: dnsServerData.title,
                    address: dnsServerData.address,
                };
            }
            return server;
        });

        // updateProfileSettings runs this callback only for the active profile.
        // dnsState stores the applied DNS cache for the active profile only.
        await profilesService.updateProfileSettings(
            profileId,
            { customDnsServers: updatedCustomServers },
            async () => {
                await this.dnsState.update({ customDnsServers: updatedCustomServers });
                const { selectedDnsServer } = await this.dnsState.get();
                if (selectedDnsServer === dnsServerData.id) {
                    await this.notifyDnsServerChanged();
                }
            },
        );

        return updatedCustomServers;
    };

    /**
     * Removes a custom DNS server from the given profile.
     * If the removed server was selected, resets to default.
     * If the profile is active, syncs session storage cache.
     *
     * @param profileId Profile ID.
     * @param dnsServerId ID of the DNS server to remove.
     */
    public removeCustomDnsServer = async (
        profileId: string,
        dnsServerId: string,
    ): Promise<void> => {
        const profileSettings = profilesService.getProfileSettings(profileId);
        const updatedCustomServers = profileSettings.customDnsServers.filter(
            (server) => server.id !== dnsServerId,
        );

        const patch: { customDnsServers: DnsServerData[]; selectedDnsServer?: string } = {
            customDnsServers: updatedCustomServers,
        };

        if (profileSettings.selectedDnsServer === dnsServerId) {
            patch.selectedDnsServer = DEFAULT_DNS_SERVER.id;
        }

        await profilesService.updateProfileSettings(
            profileId,
            patch,
            async () => {
                await this.dnsState.update({ customDnsServers: updatedCustomServers });
                if (patch.selectedDnsServer) {
                    await this.applyDnsServer(DEFAULT_DNS_SERVER.id);
                }
            },
        );

        await this.saveBackup(profileId, profileSettings.customDnsServers);
    };

    /**
     * Restores previously removed custom DNS servers from backup.
     * If the profile is active, syncs session storage cache.
     *
     * @param profileId Profile ID.
     * @returns Restored custom DNS servers list.
     */
    public restoreCustomDnsServersData = async (
        profileId: string,
    ): Promise<DnsServerData[]> => {
        const { backupDnsServersData } = await this.dnsState.get();
        const backup = backupDnsServersData[profileId] || [];

        await profilesService.updateProfileSettings(
            profileId,
            { customDnsServers: backup },
            async () => {
                await this.dnsState.update({ customDnsServers: backup });
            },
        );

        return backup;
    };

    /**
     * Removes the backup of custom DNS servers for a deleted profile.
     *
     * @param profileId Profile ID to remove from the backup.
     */
    public removeProfileBackup = async (profileId: string): Promise<void> => {
        const { backupDnsServersData } = await this.dnsState.get();
        if (profileId in backupDnsServersData) {
            const updated = { ...backupDnsServersData };
            delete updated[profileId];
            await this.dnsState.update({ backupDnsServersData: updated });
        }
    };

    /**
     * Saves a backup of custom DNS servers for the given profile
     * into session storage.
     *
     * @param profileId Profile ID.
     * @param servers Custom DNS servers list to back up.
     */
    private saveBackup = async (
        profileId: string,
        servers: DnsServerData[],
    ): Promise<void> => {
        const { backupDnsServersData } = await this.dnsState.get();
        await this.dnsState.update({
            backupDnsServersData: {
                ...backupDnsServersData,
                [profileId]: servers,
            },
        });
    };
}
