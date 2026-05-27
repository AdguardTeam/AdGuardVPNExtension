import { action, computed, observable } from 'mobx';
import { nanoid } from 'nanoid';

import type { DnsServerData } from '../../background/schema';
import { DEFAULT_DNS_SERVER, POPULAR_DNS_SERVERS } from '../../common/dnsConstants';
import { log } from '../../common/logger';
import { messenger } from '../../common/messenger';
import { type ProfileDnsData } from '../../common/profiles';

import { type ProfilesStore } from './ProfilesStore';

/**
 * Per-profile DNS settings store.
 */
export class DnsStore {
    private profilesStore: ProfilesStore;

    /**
     * Profile ID this store currently operates on.
     * `undefined` means the active (default) profile.
     */
    @observable public profileId: string | undefined;

    /**
     * Whether the custom DNS server modal is open.
     */
    @observable public isCustomDnsModalOpen = false;

    /**
     * DNS server currently being edited in the modal.
     */
    @observable public dnsServerToEdit: DnsServerData | null = null;

    /**
     * Server name field value in the custom DNS modal.
     */
    @observable public dnsServerName = '';

    /**
     * Server address field value in the custom DNS modal.
     */
    @observable public dnsServerAddress = '';

    constructor(profilesStore: ProfilesStore) {
        this.profilesStore = profilesStore;
    }

    /**
     * Sets the profile ID for per-profile DNS operations.
     * Resets UI state to defaults.
     */
    @action
    public setProfileId = (id: string | undefined): void => {
        this.profileId = id;
        this.resetUiState();
    };

    /**
     * Resets all UI state to defaults.
     */
    @action
    public resetUiState = (): void => {
        this.isCustomDnsModalOpen = false;
        this.dnsServerToEdit = null;
        this.dnsServerName = '';
        this.dnsServerAddress = '';
    };

    /**
     * Opens the custom DNS server modal.
     */
    @action
    public openCustomDnsModal = (): void => {
        this.isCustomDnsModalOpen = true;
    };

    /**
     * Closes the custom DNS server modal.
     */
    @action
    public closeCustomDnsModal = (): void => {
        this.isCustomDnsModalOpen = false;
    };

    /**
     * Sets the DNS server to edit and populates form fields.
     */
    @action
    public setDnsServerToEdit = (value: DnsServerData | null): void => {
        if (value) {
            this.dnsServerName = value.title;
            this.dnsServerAddress = value.address;
        }

        this.dnsServerToEdit = value;
    };

    /**
     * Sets the server name field in the custom DNS modal.
     */
    @action
    public setDnsServerName = (name: string): void => {
        this.dnsServerName = name;
    };

    /**
     * Sets the server address field in the custom DNS modal.
     */
    @action
    public setDnsServerAddress = (address: string): void => {
        this.dnsServerAddress = address;
    };

    /**
     * Returns the effective profile ID — explicit profileId or the active profile.
     */
    @computed
    private get effectiveProfileId(): string {
        return this.profileId ?? this.profilesStore.activeProfileId;
    }

    /**
     * DNS data for the current profile from the profiles cache.
     */
    @computed
    private get profileDnsData(): ProfileDnsData | undefined {
        return this.profilesStore.dnsCache[this.effectiveProfileId];
    }

    /**
     * Currently selected DNS server ID.
     */
    @computed
    public get dnsServer(): string {
        return this.profileDnsData?.selectedDnsServer ?? DEFAULT_DNS_SERVER.id;
    }

    /**
     * User-added custom DNS servers.
     */
    @computed
    public get customDnsServers(): DnsServerData[] {
        return this.profileDnsData?.customDnsServers ?? [];
    }

    /**
     * Selects a DNS server for the current profile.
     */
    @action
    public setDnsServer = async (value: string): Promise<void> => {
        const profileId = this.effectiveProfileId;
        const dnsServerId = value || DEFAULT_DNS_SERVER.id;
        await messenger.setDnsServer(profileId, dnsServerId);
        this.profilesStore.updateDnsCache(profileId, {
            selectedDnsServer: dnsServerId,
            customDnsServers: this.customDnsServers,
        });
    };

    /**
     * Adds a custom DNS server and selects it.
     */
    @action
    public addCustomDnsServer = async (
        dnsServerName: string,
        dnsServerAddress: string,
    ): Promise<void> => {
        log.info(`[vpn.DnsStore]: Adding DNS server: ${dnsServerName} with address: ${dnsServerAddress}`);
        const profileId = this.effectiveProfileId;
        const dnsServer = {
            id: nanoid(),
            title: dnsServerName,
            address: dnsServerAddress,
        };
        await messenger.addCustomDnsServer(profileId, dnsServer);
        this.profilesStore.updateDnsCache(profileId, {
            selectedDnsServer: this.dnsServer,
            customDnsServers: [...this.customDnsServers, dnsServer],
        });
        await this.setDnsServer(dnsServer.id);
    };

    /**
     * Edits an existing custom DNS server.
     */
    @action
    public editCustomDnsServer = async (
        dnsServerId: string,
        dnsServerName: string,
        dnsServerAddress: string,
    ): Promise<void> => {
        const profileId = this.effectiveProfileId;
        const editedDnsServers = await messenger.editCustomDnsServer(
            profileId,
            {
                id: dnsServerId,
                title: dnsServerName,
                address: dnsServerAddress,
            },
        );

        this.profilesStore.updateDnsCache(profileId, {
            selectedDnsServer: this.dnsServer,
            customDnsServers: editedDnsServers,
        });
        this.setDnsServerToEdit(null);
    };

    /**
     * Removes a custom DNS server. Resets to default if currently selected.
     */
    @action
    public removeCustomDnsServer = async (dnsServerId: string): Promise<void> => {
        const profileId = this.effectiveProfileId;
        await messenger.removeCustomDnsServer(profileId, dnsServerId);
        const updatedServers = this.customDnsServers.filter((server) => server.id !== dnsServerId);
        this.profilesStore.updateDnsCache(profileId, {
            selectedDnsServer: this.dnsServer === dnsServerId ? DEFAULT_DNS_SERVER.id : this.dnsServer,
            customDnsServers: updatedServers,
        });
    };

    /**
     * Restores previously removed custom DNS servers from backup.
     */
    @action
    public restoreCustomDnsServersData = async (): Promise<void> => {
        const profileId = this.effectiveProfileId;
        const customDnsServersData = await messenger.restoreCustomDnsServersData(profileId);
        this.profilesStore.updateDnsCache(profileId, {
            selectedDnsServer: this.dnsServer,
            customDnsServers: customDnsServersData,
        });
    };

    /**
     * Resolved name of the currently selected DNS server.
     */
    @computed
    public get currentDnsServerName(): string {
        const currentDnsServer = [
            DEFAULT_DNS_SERVER,
            ...POPULAR_DNS_SERVERS,
            ...this.customDnsServers,
        ].find((server) => server.id === this.dnsServer);
        return currentDnsServer?.title ?? DEFAULT_DNS_SERVER.title;
    }

    /**
     * Returns the resolved DNS server name for a given profile.
     * Reads directly from profilesStore.dnsCache.
     *
     * @param profileId Profile ID to look up.
     * @returns DNS server title or default server title.
     */
    public getProfileDnsServerName(profileId: string): string {
        const cacheEntry = this.profilesStore.dnsCache[profileId];
        const selectedId = cacheEntry?.selectedDnsServer ?? DEFAULT_DNS_SERVER.id;
        const customServers = cacheEntry?.customDnsServers ?? [];
        const server = [
            DEFAULT_DNS_SERVER,
            ...POPULAR_DNS_SERVERS,
            ...customServers,
        ].find((s) => s.id === selectedId);
        return server?.title ?? DEFAULT_DNS_SERVER.title;
    }
}
