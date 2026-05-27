import {
    vi,
    describe,
    beforeEach,
    it,
    expect,
} from 'vitest';
import { observable, runInAction } from 'mobx';

import { DEFAULT_DNS_SERVER, POPULAR_DNS_SERVERS } from '../../../src/common/dnsConstants';
import { DEFAULT_PROFILE_ID, type ProfileDnsData } from '../../../src/common/profiles';
import { DnsStore } from '../../../src/options/stores/DnsStore';
import { type ProfilesStore } from '../../../src/options/stores/ProfilesStore';

const mockMessenger = vi.hoisted(() => ({
    setDnsServer: vi.fn(),
    addCustomDnsServer: vi.fn(),
    editCustomDnsServer: vi.fn(),
    removeCustomDnsServer: vi.fn(),
    restoreCustomDnsServersData: vi.fn(),
}));

vi.mock('../../../src/common/messenger', () => ({
    messenger: mockMessenger,
}));

vi.mock('../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => key),
    },
}));

const CUSTOM_SERVER_A = {
    id: 'custom-a',
    title: 'Custom A',
    address: '1.2.3.4',
};

const CUSTOM_SERVER_B = {
    id: 'custom-b',
    title: 'Custom B',
    address: '5.6.7.8',
};

describe('DnsStore', () => {
    let profilesStore: ProfilesStore;
    let dnsStore: DnsStore;

    beforeEach(() => {
        vi.clearAllMocks();

        profilesStore = observable.object({
            dnsCache: observable.map(),
            profiles: [
                { id: DEFAULT_PROFILE_ID, name: '' },
                { id: 'work', name: 'Work' },
            ],
            activeProfileId: DEFAULT_PROFILE_ID,
            updateDnsCache: vi.fn((profileId: string, data: ProfileDnsData) => {
                profilesStore.dnsCache[profileId] = data;
            }),
        }) as unknown as ProfilesStore;

        dnsStore = new DnsStore(profilesStore);

        runInAction(() => {
            profilesStore.dnsCache[DEFAULT_PROFILE_ID] = {
                selectedDnsServer: DEFAULT_DNS_SERVER.id,
                customDnsServers: [],
            };
            profilesStore.dnsCache.work = {
                selectedDnsServer: POPULAR_DNS_SERVERS[0].id,
                customDnsServers: [CUSTOM_SERVER_A],
            };
        });
    });

    describe('profileId', () => {
        it('should default to undefined', () => {
            expect(dnsStore.profileId).toBeUndefined();
        });

        it('should be settable via setProfileId', () => {
            dnsStore.setProfileId('work');
            expect(dnsStore.profileId).toBe('work');
        });

        it('should reset UI state when profileId changes', () => {
            dnsStore.openCustomDnsModal();
            dnsStore.setDnsServerName('test');
            dnsStore.setDnsServerAddress('1.1.1.1');

            dnsStore.setProfileId('work');

            expect(dnsStore.isCustomDnsModalOpen).toBe(false);
            expect(dnsStore.dnsServerName).toBe('');
            expect(dnsStore.dnsServerAddress).toBe('');
            expect(dnsStore.dnsServerToEdit).toBeNull();
        });
    });

    describe('effectiveProfileId-based computed properties', () => {
        it('should read dnsServer from active profile when profileId is undefined', () => {
            expect(dnsStore.dnsServer).toBe(DEFAULT_DNS_SERVER.id);
        });

        it('should read dnsServer from specific profile when profileId is set', () => {
            dnsStore.setProfileId('work');
            expect(dnsStore.dnsServer).toBe(POPULAR_DNS_SERVERS[0].id);
        });

        it('should read customDnsServers from active profile when profileId is undefined', () => {
            expect(dnsStore.customDnsServers).toEqual([]);
        });

        it('should read customDnsServers from specific profile when profileId is set', () => {
            dnsStore.setProfileId('work');
            expect(dnsStore.customDnsServers).toEqual([CUSTOM_SERVER_A]);
        });
    });

    describe('fallback when cache is empty', () => {
        it('should return default dns server when profile has no cache entry', () => {
            dnsStore.setProfileId('nonexistent');
            expect(dnsStore.dnsServer).toBe(DEFAULT_DNS_SERVER.id);
        });

        it('should return empty custom servers when profile has no cache entry', () => {
            dnsStore.setProfileId('nonexistent');
            expect(dnsStore.customDnsServers).toEqual([]);
        });
    });

    describe('UI state actions', () => {
        it('should open custom DNS modal', () => {
            dnsStore.openCustomDnsModal();
            expect(dnsStore.isCustomDnsModalOpen).toBe(true);
        });

        it('should close custom DNS modal', () => {
            dnsStore.openCustomDnsModal();
            dnsStore.closeCustomDnsModal();
            expect(dnsStore.isCustomDnsModalOpen).toBe(false);
        });

        it('should set dns server name', () => {
            dnsStore.setDnsServerName('My DNS');
            expect(dnsStore.dnsServerName).toBe('My DNS');
        });

        it('should set dns server address', () => {
            dnsStore.setDnsServerAddress('8.8.4.4');
            expect(dnsStore.dnsServerAddress).toBe('8.8.4.4');
        });

        it('should set dns server to edit and populate form fields', () => {
            dnsStore.setDnsServerToEdit(CUSTOM_SERVER_A);
            expect(dnsStore.dnsServerToEdit).toEqual(CUSTOM_SERVER_A);
            expect(dnsStore.dnsServerName).toBe(CUSTOM_SERVER_A.title);
            expect(dnsStore.dnsServerAddress).toBe(CUSTOM_SERVER_A.address);
        });

        it('should clear dns server to edit without changing form fields', () => {
            dnsStore.setDnsServerName('keep');
            dnsStore.setDnsServerAddress('keep');
            dnsStore.setDnsServerToEdit(null);
            expect(dnsStore.dnsServerToEdit).toBeNull();
            expect(dnsStore.dnsServerName).toBe('keep');
            expect(dnsStore.dnsServerAddress).toBe('keep');
        });
    });

    describe('resetUiState', () => {
        it('should reset all UI state to defaults', () => {
            dnsStore.openCustomDnsModal();
            dnsStore.setDnsServerToEdit(CUSTOM_SERVER_A);
            dnsStore.setDnsServerName('test');
            dnsStore.setDnsServerAddress('1.2.3.4');

            dnsStore.resetUiState();

            expect(dnsStore.isCustomDnsModalOpen).toBe(false);
            expect(dnsStore.dnsServerToEdit).toBeNull();
            expect(dnsStore.dnsServerName).toBe('');
            expect(dnsStore.dnsServerAddress).toBe('');
        });
    });

    describe('currentDnsServerName', () => {
        it('should return default DNS server name when default is selected', () => {
            expect(dnsStore.currentDnsServerName).toBe(DEFAULT_DNS_SERVER.title);
        });

        it('should return popular DNS server name when one is selected', () => {
            dnsStore.setProfileId('work');
            expect(dnsStore.currentDnsServerName).toBe(POPULAR_DNS_SERVERS[0].title);
        });

        it('should return custom DNS server name when one is selected', () => {
            runInAction(() => {
                profilesStore.dnsCache[DEFAULT_PROFILE_ID] = {
                    selectedDnsServer: CUSTOM_SERVER_A.id,
                    customDnsServers: [CUSTOM_SERVER_A],
                };
            });
            expect(dnsStore.currentDnsServerName).toBe(CUSTOM_SERVER_A.title);
        });

        it('should return default server name when selected server is not found', () => {
            runInAction(() => {
                profilesStore.dnsCache[DEFAULT_PROFILE_ID] = {
                    selectedDnsServer: 'unknown-id',
                    customDnsServers: [],
                };
            });
            expect(dnsStore.currentDnsServerName).toBe(DEFAULT_DNS_SERVER.title);
        });
    });

    describe('setDnsServer', () => {
        it('should call messenger and update cache with given value', async () => {
            const serverId = POPULAR_DNS_SERVERS[0].id;
            await dnsStore.setDnsServer(serverId);

            expect(mockMessenger.setDnsServer).toHaveBeenCalledWith(
                DEFAULT_PROFILE_ID,
                serverId,
            );
            expect(profilesStore.updateDnsCache).toHaveBeenCalledWith(
                DEFAULT_PROFILE_ID,
                {
                    selectedDnsServer: serverId,
                    customDnsServers: [],
                },
            );
        });

        it('should persist default via messenger when value is empty', async () => {
            await dnsStore.setDnsServer('');

            expect(mockMessenger.setDnsServer).toHaveBeenCalledWith(
                DEFAULT_PROFILE_ID,
                DEFAULT_DNS_SERVER.id,
            );
            expect(profilesStore.updateDnsCache).toHaveBeenCalledWith(
                DEFAULT_PROFILE_ID,
                {
                    selectedDnsServer: DEFAULT_DNS_SERVER.id,
                    customDnsServers: [],
                },
            );
        });

        it('should use effectiveProfileId when profileId is set', async () => {
            dnsStore.setProfileId('work');
            const serverId = DEFAULT_DNS_SERVER.id;
            await dnsStore.setDnsServer(serverId);

            expect(mockMessenger.setDnsServer).toHaveBeenCalledWith('work', serverId);
            expect(profilesStore.updateDnsCache).toHaveBeenCalledWith(
                'work',
                expect.objectContaining({ selectedDnsServer: serverId }),
            );
        });
    });

    describe('addCustomDnsServer', () => {
        it('should call messenger, update cache, and select the new server', async () => {
            mockMessenger.setDnsServer.mockResolvedValue(undefined);
            mockMessenger.addCustomDnsServer.mockResolvedValue(undefined);

            await dnsStore.addCustomDnsServer('New DNS', '9.9.9.9');

            expect(mockMessenger.addCustomDnsServer).toHaveBeenCalledWith(
                DEFAULT_PROFILE_ID,
                expect.objectContaining({
                    title: 'New DNS',
                    address: '9.9.9.9',
                }),
            );

            // First updateDnsCache — adds the server to the list
            const firstCall = (profilesStore.updateDnsCache as ReturnType<typeof vi.fn>).mock.calls[0];
            expect(firstCall[0]).toBe(DEFAULT_PROFILE_ID);
            expect(firstCall[1].customDnsServers).toHaveLength(1);
            expect(firstCall[1].customDnsServers[0].title).toBe('New DNS');
            expect(firstCall[1].customDnsServers[0].address).toBe('9.9.9.9');

            // setDnsServer should have been called to select the new server
            expect(mockMessenger.setDnsServer).toHaveBeenCalled();
        });
    });

    describe('editCustomDnsServer', () => {
        it('should call messenger and update cache with edited servers', async () => {
            dnsStore.setProfileId('work');

            const editedServers = [{ ...CUSTOM_SERVER_A, title: 'Edited' }];
            mockMessenger.editCustomDnsServer.mockResolvedValue(editedServers);

            await dnsStore.editCustomDnsServer(
                CUSTOM_SERVER_A.id,
                'Edited',
                CUSTOM_SERVER_A.address,
            );

            expect(mockMessenger.editCustomDnsServer).toHaveBeenCalledWith(
                'work',
                {
                    id: CUSTOM_SERVER_A.id,
                    title: 'Edited',
                    address: CUSTOM_SERVER_A.address,
                },
            );
            expect(profilesStore.updateDnsCache).toHaveBeenCalledWith(
                'work',
                {
                    selectedDnsServer: POPULAR_DNS_SERVERS[0].id,
                    customDnsServers: editedServers,
                },
            );
            expect(dnsStore.dnsServerToEdit).toBeNull();
        });
    });

    describe('removeCustomDnsServer', () => {
        it('should call messenger and update cache with filtered servers', async () => {
            dnsStore.setProfileId('work');
            mockMessenger.removeCustomDnsServer.mockResolvedValue(undefined);

            await dnsStore.removeCustomDnsServer(CUSTOM_SERVER_A.id);

            expect(mockMessenger.removeCustomDnsServer).toHaveBeenCalledWith(
                'work',
                CUSTOM_SERVER_A.id,
            );
            expect(profilesStore.updateDnsCache).toHaveBeenCalledWith(
                'work',
                expect.objectContaining({ customDnsServers: [] }),
            );
        });

        it('should set selectedDnsServer to default if removed server was selected', async () => {
            runInAction(() => {
                profilesStore.dnsCache[DEFAULT_PROFILE_ID] = {
                    selectedDnsServer: CUSTOM_SERVER_A.id,
                    customDnsServers: [CUSTOM_SERVER_A],
                };
            });

            mockMessenger.removeCustomDnsServer.mockResolvedValue(undefined);

            await dnsStore.removeCustomDnsServer(CUSTOM_SERVER_A.id);

            expect(profilesStore.updateDnsCache).toHaveBeenCalledWith(
                DEFAULT_PROFILE_ID,
                {
                    selectedDnsServer: DEFAULT_DNS_SERVER.id,
                    customDnsServers: [],
                },
            );
            // Backend handles the reset — no extra setDnsServer message
            expect(mockMessenger.setDnsServer).not.toHaveBeenCalled();
        });

        it('should keep selectedDnsServer if removed server was not selected', async () => {
            runInAction(() => {
                profilesStore.dnsCache[DEFAULT_PROFILE_ID] = {
                    selectedDnsServer: DEFAULT_DNS_SERVER.id,
                    customDnsServers: [CUSTOM_SERVER_A, CUSTOM_SERVER_B],
                };
            });

            mockMessenger.removeCustomDnsServer.mockResolvedValue(undefined);

            await dnsStore.removeCustomDnsServer(CUSTOM_SERVER_B.id);

            expect(profilesStore.updateDnsCache).toHaveBeenCalledWith(
                DEFAULT_PROFILE_ID,
                {
                    selectedDnsServer: DEFAULT_DNS_SERVER.id,
                    customDnsServers: [CUSTOM_SERVER_A],
                },
            );
            expect(mockMessenger.setDnsServer).not.toHaveBeenCalled();
        });
    });

    describe('restoreCustomDnsServersData', () => {
        it('should call messenger and update cache with restored servers', async () => {
            const restoredServers = [CUSTOM_SERVER_A, CUSTOM_SERVER_B];
            mockMessenger.restoreCustomDnsServersData.mockResolvedValue(restoredServers);

            await dnsStore.restoreCustomDnsServersData();

            expect(mockMessenger.restoreCustomDnsServersData).toHaveBeenCalledWith(
                DEFAULT_PROFILE_ID,
            );
            expect(profilesStore.updateDnsCache).toHaveBeenCalledWith(
                DEFAULT_PROFILE_ID,
                {
                    selectedDnsServer: DEFAULT_DNS_SERVER.id,
                    customDnsServers: restoredServers,
                },
            );
        });

        it('should use effectiveProfileId when profileId is set', async () => {
            dnsStore.setProfileId('work');
            mockMessenger.restoreCustomDnsServersData.mockResolvedValue([]);

            await dnsStore.restoreCustomDnsServersData();

            expect(mockMessenger.restoreCustomDnsServersData).toHaveBeenCalledWith('work');
        });
    });
});
