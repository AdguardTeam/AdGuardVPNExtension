import browser from 'webextension-polyfill';

import { profilesService } from '../profiles';
import { settings } from '../settings';

interface WebRTCInterface {
    init(): Promise<void>;
    blockWebRTC(): void;
    unblockWebRTC(force: boolean): void;
    setWebRTCHandlingAllowed(webRTCHandlingAllowed: boolean, proxyEnabled: boolean): void;
    setProfileWebRtc(profileId: string, enabled: boolean): Promise<void>;
    getProfileWebRtcDataMap(): Promise<Record<string, boolean>>;
}

class WebRTC implements WebRTCInterface {
    private WEB_RTC_HANDLING_ALLOWED: boolean;

    constructor() {
        this.WEB_RTC_HANDLING_ALLOWED = false;
    }

    /**
     * Initializes WebRTC handling from the active profile settings.
     */
    public init = async (): Promise<void> => {
        const profileSettings = await profilesService.getActiveProfileSettings();
        this.setWebRTCHandlingAllowed(
            profileSettings.handleWebRtcEnabled,
            settings.isProxyEnabled(),
        );
    };

    private handleBlockWebRTC = (webRTCDisabled: boolean): void => {
        // Edge doesn't support privacy api
        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/privacy
        if (!browser.privacy) {
            return;
        }

        // Since chromium 48
        if (typeof browser.privacy.network.webRTCIPHandlingPolicy === 'object') {
            if (webRTCDisabled) {
                browser.privacy.network.webRTCIPHandlingPolicy.set({
                    value: 'disable_non_proxied_udp',
                    scope: 'regular',
                });
            } else {
                browser.privacy.network.webRTCIPHandlingPolicy.clear({
                    scope: 'regular',
                });
            }
        }

        if (typeof browser.privacy.network.peerConnectionEnabled === 'object') {
            if (webRTCDisabled) {
                browser.privacy.network.peerConnectionEnabled.set({
                    value: false,
                    scope: 'regular',
                });
            } else {
                browser.privacy.network.peerConnectionEnabled.clear({
                    scope: 'regular',
                });
            }
        }
    };

    public blockWebRTC = (): void => {
        if (!this.WEB_RTC_HANDLING_ALLOWED) {
            return;
        }
        this.handleBlockWebRTC(true);
    };

    public unblockWebRTC = (force = false): void => {
        if (!this.WEB_RTC_HANDLING_ALLOWED && !force) {
            return;
        }
        this.handleBlockWebRTC(false);
    };

    public setWebRTCHandlingAllowed = (webRTCHandlingAllowed: boolean, proxyEnabled: boolean): void => {
        this.WEB_RTC_HANDLING_ALLOWED = webRTCHandlingAllowed;
        if (!webRTCHandlingAllowed || !proxyEnabled) {
            this.unblockWebRTC(true);
        } else if (webRTCHandlingAllowed && proxyEnabled) {
            this.blockWebRTC();
        }
    };

    /**
     * Persists the WebRTC setting for the given profile and applies it
     * if the profile is currently active.
     *
     * @param profileId Profile ID.
     * @param enabled Whether WebRTC protection should be enabled.
     */
    public setProfileWebRtc = async (profileId: string, enabled: boolean): Promise<void> => {
        await profilesService.updateProfileSettings(
            profileId,
            { handleWebRtcEnabled: enabled },
            async () => {
                this.setWebRTCHandlingAllowed(enabled, settings.isProxyEnabled());
            },
        );
    };

    /**
     * Returns per-profile WebRTC data as a map of profile ID → boolean.
     *
     * @returns Map of profile ID to WebRTC enabled state.
     */
    public getProfileWebRtcDataMap = async (): Promise<Record<string, boolean>> => {
        const state = await profilesService.getState();
        const result: Record<string, boolean> = {};
        state.profiles.forEach((p) => {
            result[p.id] = p.settings.handleWebRtcEnabled;
        });

        return result;
    };
}

export const webrtc = new WebRTC();
