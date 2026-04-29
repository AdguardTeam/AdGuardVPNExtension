import {
    vi,
    describe,
    beforeEach,
    it,
    expect,
} from 'vitest';
import browser from 'webextension-polyfill';

import { DEFAULT_PROFILE_SETTINGS } from '../../../src/background/schema';
import { DEFAULT_PROFILE_ID } from '../../../src/common/profilesConstants';
import { webrtc } from '../../../src/background/browserApi/webrtc';

const mockProfilesService = {
    getActiveProfileSettings: vi.fn(),
    updateProfileSettings: vi.fn(),
    getState: vi.fn(),
};

const mockSettings = {
    isProxyEnabled: vi.fn(),
};

vi.mock('webextension-polyfill', () => ({
    default: {
        privacy: {
            network: {
                webRTCIPHandlingPolicy: {
                    set: vi.fn(),
                    clear: vi.fn(),
                },
                peerConnectionEnabled: {
                    set: vi.fn(),
                    clear: vi.fn(),
                },
            },
        },
    },
}));

vi.mock('../../../src/background/profiles', () => ({
    profilesService: mockProfilesService,
}));

vi.mock('../../../src/background/settings', () => ({
    settings: mockSettings,
}));

describe('WebRTC', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('init', () => {
        it('should read active profile settings and apply WebRTC handling', async () => {
            mockProfilesService.getActiveProfileSettings.mockResolvedValue({
                ...DEFAULT_PROFILE_SETTINGS,
                handleWebRtcEnabled: true,
            });
            mockSettings.isProxyEnabled.mockReturnValue(true);

            await webrtc.init();

            expect(mockProfilesService.getActiveProfileSettings).toHaveBeenCalledOnce();
            expect(mockSettings.isProxyEnabled).toHaveBeenCalledOnce();
            // When both enabled and proxy on, WebRTC should be blocked
            expect(browser.privacy.network.webRTCIPHandlingPolicy.set).toHaveBeenCalledWith({
                value: 'disable_non_proxied_udp',
                scope: 'regular',
            });
        });

        it('should unblock WebRTC when handling is disabled', async () => {
            mockProfilesService.getActiveProfileSettings.mockResolvedValue({
                ...DEFAULT_PROFILE_SETTINGS,
                handleWebRtcEnabled: false,
            });
            mockSettings.isProxyEnabled.mockReturnValue(true);

            await webrtc.init();

            expect(browser.privacy.network.webRTCIPHandlingPolicy.clear).toHaveBeenCalledWith({
                scope: 'regular',
            });
        });
    });

    describe('setProfileWebRtc', () => {
        it('should call updateProfileSettings with the correct patch', async () => {
            mockSettings.isProxyEnabled.mockReturnValue(true);
            mockProfilesService.updateProfileSettings.mockResolvedValue(undefined);

            await webrtc.setProfileWebRtc('profile-1', true);

            expect(mockProfilesService.updateProfileSettings).toHaveBeenCalledWith(
                'profile-1',
                { handleWebRtcEnabled: true },
                expect.any(Function),
            );
        });

        it('should pass an onApply callback that applies WebRTC handling', async () => {
            mockSettings.isProxyEnabled.mockReturnValue(true);
            mockProfilesService.updateProfileSettings.mockImplementation(
                async (_id: string, _patch: unknown, onApply?: () => Promise<void>) => {
                    if (onApply) {
                        await onApply();
                    }
                },
            );

            await webrtc.setProfileWebRtc('profile-1', true);

            // onApply was called, which triggers setWebRTCHandlingAllowed(true, true)
            // → blockWebRTC → handleBlockWebRTC(true)
            expect(browser.privacy.network.webRTCIPHandlingPolicy.set).toHaveBeenCalledWith({
                value: 'disable_non_proxied_udp',
                scope: 'regular',
            });
        });
    });

    describe('getProfileWebRtcDataMap', () => {
        it('should return a map of profile ID to WebRTC enabled state', async () => {
            mockProfilesService.getState.mockResolvedValue({
                activeProfileId: DEFAULT_PROFILE_ID,
                profiles: [
                    {
                        id: DEFAULT_PROFILE_ID,
                        name: '',
                        settings: { ...DEFAULT_PROFILE_SETTINGS, handleWebRtcEnabled: false },
                    },
                    {
                        id: 'work',
                        name: 'Work',
                        settings: { ...DEFAULT_PROFILE_SETTINGS, handleWebRtcEnabled: true },
                    },
                ],
            });

            const result = await webrtc.getProfileWebRtcDataMap();

            expect(result).toEqual({
                [DEFAULT_PROFILE_ID]: false,
                work: true,
            });
        });

        it('should return an empty map when there are no profiles', async () => {
            mockProfilesService.getState.mockResolvedValue({
                activeProfileId: DEFAULT_PROFILE_ID,
                profiles: [],
            });

            const result = await webrtc.getProfileWebRtcDataMap();

            expect(result).toEqual({});
        });
    });

    describe('setWebRTCHandlingAllowed', () => {
        it('should block WebRTC when allowed and proxy enabled', () => {
            webrtc.setWebRTCHandlingAllowed(true, true);

            expect(browser.privacy.network.webRTCIPHandlingPolicy.set).toHaveBeenCalledWith({
                value: 'disable_non_proxied_udp',
                scope: 'regular',
            });
        });

        it('should unblock WebRTC when not allowed', () => {
            webrtc.setWebRTCHandlingAllowed(false, true);

            expect(browser.privacy.network.webRTCIPHandlingPolicy.clear).toHaveBeenCalledWith({
                scope: 'regular',
            });
        });

        it('should unblock WebRTC when proxy is disabled', () => {
            webrtc.setWebRTCHandlingAllowed(true, false);

            expect(browser.privacy.network.webRTCIPHandlingPolicy.clear).toHaveBeenCalledWith({
                scope: 'regular',
            });
        });
    });
});
