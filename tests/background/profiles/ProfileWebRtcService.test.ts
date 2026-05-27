import {
    vi,
    describe,
    beforeEach,
    it,
    expect,
} from 'vitest';

import { DEFAULT_PROFILE_SETTINGS } from '../../../src/background/schema';
import { DEFAULT_PROFILE_ID } from '../../../src/common/profiles';
import { ProfileWebRtcService } from '../../../src/background/WebRtcService';

const { mockWebrtc, mockSettings } = vi.hoisted(() => ({
    mockWebrtc: {
        setWebRTCHandlingAllowed: vi.fn(),
    },
    mockSettings: {
        isProxyEnabled: vi.fn(),
    },
}));

vi.mock('../../../src/background/browserApi/webrtc', () => ({
    webrtc: mockWebrtc,
}));

vi.mock('../../../src/background/settings', () => ({
    settings: mockSettings,
}));

const mockProfilesService = {
    resolveProfileId: vi.fn(),
    getProfileSettings: vi.fn(),
    getActiveProfileSettings: vi.fn(),
    updateProfileSettings: vi.fn(),
    getProfilesData: vi.fn(),
};

describe('ProfileWebRtcService', () => {
    // @ts-expect-error partial mock of ProfilesService
    const service = new ProfileWebRtcService(mockProfilesService);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('init', () => {
        it('should read active profile settings and apply WebRTC handling', async () => {
            mockProfilesService.getProfileSettings.mockReturnValue({
                ...DEFAULT_PROFILE_SETTINGS,
                handleWebRtcEnabled: true,
            });
            mockSettings.isProxyEnabled.mockReturnValue(true);

            await service.init(DEFAULT_PROFILE_ID);

            expect(mockProfilesService.getProfileSettings).toHaveBeenCalledWith(DEFAULT_PROFILE_ID);
            expect(mockSettings.isProxyEnabled).toHaveBeenCalledOnce();
            expect(mockWebrtc.setWebRTCHandlingAllowed).toHaveBeenCalledWith(true, true);
        });

        it('should pass disabled flag when handling is disabled', async () => {
            mockProfilesService.getProfileSettings.mockReturnValue({
                ...DEFAULT_PROFILE_SETTINGS,
                handleWebRtcEnabled: false,
            });
            mockSettings.isProxyEnabled.mockReturnValue(true);

            await service.init(DEFAULT_PROFILE_ID);

            expect(mockWebrtc.setWebRTCHandlingAllowed).toHaveBeenCalledWith(false, true);
        });
    });

    describe('setProfileWebRtc', () => {
        it('should call updateProfileSettings with the correct patch', async () => {
            mockSettings.isProxyEnabled.mockReturnValue(true);
            mockProfilesService.updateProfileSettings.mockResolvedValue(undefined);

            await service.setProfileWebRtc('profile-1', true);

            expect(mockProfilesService.updateProfileSettings).toHaveBeenCalledWith(
                'profile-1',
                { handleWebRtcEnabled: true },
                expect.any(Function),
            );
        });

        it('should pass an onApply callback that applies WebRTC handling', async () => {
            mockSettings.isProxyEnabled.mockReturnValue(true);
            mockProfilesService.updateProfileSettings.mockImplementation(
                async (_id: string, _patch: unknown, onApply?: () => void) => {
                    if (onApply) {
                        onApply();
                    }
                },
            );

            await service.setProfileWebRtc('profile-1', true);

            expect(mockWebrtc.setWebRTCHandlingAllowed).toHaveBeenCalledWith(true, true);
        });
    });
});
