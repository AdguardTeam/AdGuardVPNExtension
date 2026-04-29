import { action, computed, observable } from 'mobx';
import { nanoid } from 'nanoid';

import { DEFAULT_DNS_SERVER, POPULAR_DNS_SERVERS } from '../../common/dnsConstants';
import { messenger } from '../../common/messenger';
import { log } from '../../common/logger';
import type { DnsServerData } from '../../background/schema';
import { type CustomDnsData } from '../hooks/useQueryStringData';

import type { ProfilesStore } from './ProfilesStore';

/**
 * Store for DNS settings management.
 * Always works through ProfilesStore.dnsCache — when profileId is set
 * explicitly, uses that profile; otherwise falls back to activeProfileId.
 */
export class DnsStore {
    private profilesStore: ProfilesStore;

    /**
     * Profile ID to scope DNS settings to a specific profile.
     * When undefined, falls back to activeProfileId.
     */
    @observable public profileId: string | undefined;

    @observable public dnsServerToEdit: DnsServerData | null = null;

    @observable public isCustomDnsModalOpen = false;

    @observable public showDnsSettings = false;

    @observable public dnsServerName = '';

    @observable public dnsServerAddress = '';

    constructor(profilesStore: ProfilesStore) {
        this.profilesStore = profilesStore;
    }

    /**
     * Returns the effective profile ID — explicit profileId or the active profile.
     */
    @computed
    private get effectiveProfileId(): string {
        return this.profileId ?? this.profilesStore.activeProfileId;
    }

    /**
     * Selected DNS server ID for the current context.
     */
    @computed
    public get dnsServer(): string {
        return this.profilesStore.dnsCache.get(this.effectiveProfileId)?.selectedDnsServer
            ?? DEFAULT_DNS_SERVER.id;
    }

    /**
     * Custom DNS servers list for the current context.
     */
    @computed
    public get customDnsServers(): DnsServerData[] {
        return this.profilesStore.dnsCache.get(this.effectiveProfileId)?.customDnsServers
            ?? [];
    }

    /**
     * Sets the profile ID and resets UI state for the new profile.
     */
    @action public setProfileId = (profileId: string | undefined): void => {
        this.profileId = profileId;
        this.dnsServerToEdit = null;
        this.isCustomDnsModalOpen = false;
        this.dnsServerName = '';
        this.dnsServerAddress = '';
    };

    @action public setDnsServer = async (value: string): Promise<void> => {
        const profileId = this.effectiveProfileId;

        if (!value) {
            this.profilesStore.updateDnsCache(profileId, {
                selectedDnsServer: DEFAULT_DNS_SERVER.id,
            });
            return;
        }

        await messenger.setProfileSetting(
            profileId,
            { selectedDnsServer: value },
        );
        this.profilesStore.updateDnsCache(profileId, {
            selectedDnsServer: value,
        });
    };

    @action public addCustomDnsServer = async (
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

        const updatedServers = [...this.customDnsServers, dnsServer];
        await messenger.addCustomDnsServer(dnsServer, profileId);
        this.profilesStore.updateDnsCache(profileId, {
            selectedDnsServer: dnsServer.id,
            customDnsServers: updatedServers,
        });
    };

    @action public editCustomDnsServer = async (
        dnsServerId: string,
        dnsServerName: string,
        dnsServerAddress: string,
    ): Promise<void> => {
        const profileId = this.effectiveProfileId;
        const dnsServerData = {
            id: dnsServerId,
            title: dnsServerName,
            address: dnsServerAddress,
        };

        const editedDnsServers = await messenger.editCustomDnsServer(
            dnsServerData,
            profileId,
        );
        this.profilesStore.updateDnsCache(profileId, {
            customDnsServers: editedDnsServers,
        });
        this.setDnsServerToEdit(null);
    };

    @action public removeCustomDnsServer = async (dnsServerId: string): Promise<void> => {
        const profileId = this.effectiveProfileId;
        const updatedServers = this.customDnsServers.filter((s) => s.id !== dnsServerId);
        const selectedDnsServer = this.dnsServer === dnsServerId
            ? DEFAULT_DNS_SERVER.id
            : this.dnsServer;

        await messenger.removeCustomDnsServer(dnsServerId, profileId);
        this.profilesStore.updateDnsCache(profileId, {
            selectedDnsServer,
            customDnsServers: updatedServers,
        });
    };

    @action public restoreCustomDnsServersData = async (): Promise<void> => {
        const profileId = this.effectiveProfileId;
        const restoredServers = await messenger.restoreCustomDnsServersData(profileId);
        this.profilesStore.updateDnsCache(profileId, {
            customDnsServers: restoredServers,
        });
    };

    @action public setDnsServerToEdit = (value: DnsServerData | null): void => {
        if (value) {
            this.dnsServerName = value.title;
            this.dnsServerAddress = value.address;
        }

        this.dnsServerToEdit = value;
    };

    @action public openCustomDnsModal = (): void => {
        this.isCustomDnsModalOpen = true;
    };

    @action public closeCustomDnsModal = (): void => {
        this.isCustomDnsModalOpen = false;
    };

    /**
     * Handles custom DNS data sent after user clicked a custom URL.
     */
    @action public handleCustomDnsData = ({ name, address }: CustomDnsData): void => {
        this.setShowDnsSettings(true);
        this.openCustomDnsModal();
        this.setDnsServerName(name);
        this.setDnsServerAddress(address);
    };

    @computed public get currentDnsServerName(): string | null {
        const currentDnsServer = [
            DEFAULT_DNS_SERVER,
            ...POPULAR_DNS_SERVERS,
            ...this.customDnsServers,
        ].find((server) => server.id === this.dnsServer);
        if (currentDnsServer) {
            return currentDnsServer.title;
        }
        return null;
    }

    @action public setShowDnsSettings = (value: boolean): void => {
        this.showDnsSettings = value;
    };

    @action public setDnsServerName = (name: string): void => {
        this.dnsServerName = name;
    };

    @action public setDnsServerAddress = (address: string): void => {
        this.dnsServerAddress = address;
    };
}
