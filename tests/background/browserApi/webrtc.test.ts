import {
    vi,
    describe,
    beforeEach,
    it,
    expect,
} from 'vitest';
import browser from 'webextension-polyfill';

import { webrtc } from '../../../src/background/browserApi/webrtc';

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

describe('WebRTC', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
