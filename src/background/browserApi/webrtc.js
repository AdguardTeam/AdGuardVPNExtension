import browser from 'webextension-polyfill';

class WebRTC {
    constructor() {
        this.WEB_RTC_HANDLING_ALLOWED = false;
    }

    handleBlockWebRTC = (webRTCDisabled) => {
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

    blockWebRTC = () => {
        if (!this.WEB_RTC_HANDLING_ALLOWED) {
            return;
        }
        this.handleBlockWebRTC(true);
    };

    unblockWebRTC = (force = false) => {
        if (!this.WEB_RTC_HANDLING_ALLOWED && !force) {
            return;
        }
        this.handleBlockWebRTC(false);
    };

    setWebRTCHandlingAllowed = (webRTCHandlingAllowed, proxyEnabled) => {
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
