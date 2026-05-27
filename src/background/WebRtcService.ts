import { webrtc } from './browserApi/webrtc';
import { type ProfilesService } from './profiles/ProfilesService';
import { profilesService } from './profiles';
import { settings } from './settings';

/**
 * Bridges profile settings with the low-level WebRTC browser API.
 * Reads/writes WebRTC flags in profile storage and delegates
 * the actual browser-level toggling to the {@link webrtc} module.
 */
export class ProfileWebRtcService {
    /**
     * Profiles service instance used for reading/writing profile settings.
     */
    private profilesService: ProfilesService;

    constructor(profilesService: ProfilesService) {
        this.profilesService = profilesService;
    }

    /**
     * Initializes WebRTC handling from the given profile settings.
     *
     * @param profileId Profile to apply.
     */
    public async init(profileId: string): Promise<void> {
        const profileSettings = this.profilesService.getProfileSettings(profileId);
        webrtc.setWebRTCHandlingAllowed(
            profileSettings.handleWebRtcEnabled,
            settings.isProxyEnabled(),
        );
    }

    /**
     * Persists the WebRTC setting for the given profile and applies it
     * if the profile is currently active.
     *
     * @param profileId Profile ID.
     * @param enabled Whether WebRTC protection should be enabled.
     */
    public async setProfileWebRtc(profileId: string, enabled: boolean): Promise<void> {
        await this.profilesService.updateProfileSettings(
            profileId,
            { handleWebRtcEnabled: enabled },
            async () => {
                webrtc.setWebRTCHandlingAllowed(enabled, settings.isProxyEnabled());
            },
        );
    }
}

/**
 * Singleton instance of the profile WebRTC service.
 */
export const profileWebRtcService = new ProfileWebRtcService(profilesService);
