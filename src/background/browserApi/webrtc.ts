import browser from 'webextension-polyfill';

interface WebRTCInterface {
    blockWebRTC(): void;
    unblockWebRTC(force: boolean): void;
    setWebRTCHandlingAllowed(webRTCHandlingAllowed: boolean, proxyEnabled: boolean): void;
}

class WebRTC implements WebRTCInterface {
    WEB_RTC_HANDLING_ALLOWED: boolean;

    constructor() {
        this.WEB_RTC_HANDLING_ALLOWED = false;
    }

    handleBlockWebRTC = (webRTCDisabled: boolean): void => {
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

        if (typeof browser.privacy.network.networkPredictionEnabled === 'object') {
            if (webRTCDisabled) {
                browser.privacy.network.networkPredictionEnabled.set({
                    value: false,
                    scope: 'regular',
                });
            } else {
                browser.privacy.network.networkPredictionEnabled.clear({
                    scope: 'regular',
                });
            }
        }
    };

    blockWebRTC = (): void => {
        if (!this.WEB_RTC_HANDLING_ALLOWED) {
            return;
        }
        this.handleBlockWebRTC(true);
    };

    unblockWebRTC = (force = false): void => {
        if (!this.WEB_RTC_HANDLING_ALLOWED && !force) {
            return;
        }
        this.handleBlockWebRTC(false);
    };

    setWebRTCHandlingAllowed = (webRTCHandlingAllowed: boolean, proxyEnabled: boolean): void => {
        this.WEB_RTC_HANDLING_ALLOWED = webRTCHandlingAllowed;
        if (!webRTCHandlingAllowed || !proxyEnabled) {
            this.unblockWebRTC(true);
        } else if (webRTCHandlingAllowed && proxyEnabled) {
            this.blockWebRTC();
        }
    };
}

const webrtc = new WebRTC();

export default webrtc;
