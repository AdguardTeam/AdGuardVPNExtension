import React from 'react';

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    afterEach,
} from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';

const mockSendCustomEvent = vi.hoisted(() => vi.fn());
const mockSetProfileWebRtc = vi.hoisted(() => vi.fn(() => Promise.resolve()));
const mockUpdateWebRtcCache = vi.hoisted(() => vi.fn());
const mockLogError = vi.hoisted(() => vi.fn());

const mockState = vi.hoisted(() => ({
    webRtcCache: { 'profile-2': false } as Record<string, boolean>,
}));

vi.mock('../../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => {
            if (key === 'settings_webrtc_label') {
                return 'Block WebRTC';
            }
            if (key === 'settings_webrtc_desc') {
                return 'WebRTC can leak your IP address even when using a VPN.';
            }
            if (key === 'settings_webrtc_warning') {
                return 'May break some websites';
            }
            return key;
        }),
    },
}));

vi.mock('../../../../src/common/messenger', () => ({
    messenger: {
        setProfileWebRtc: mockSetProfileWebRtc,
    },
}));

vi.mock('../../../../src/common/logger', () => ({
    log: {
        error: mockLogError,
    },
}));

vi.mock('../../../../src/options/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    const store = {
        profilesStore: {
            get webRtcCache(): Record<string, boolean> {
                return mockState.webRtcCache;
            },
            updateWebRtcCache: mockUpdateWebRtcCache,
        },
        telemetryStore: {
            sendCustomEvent: mockSendCustomEvent,
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import { WebRTC } from '../../../../src/options/components/General/WebRTC';

/**
 * Renders WebRTC with given props and returns the container for querying.
 */
function renderWebRTC(props: { profileId?: string; isProfileContext?: boolean } = {}): {
    container: HTMLElement;
} {
    const { container } = render(
        <WebRTC
            profileId={props.profileId ?? 'profile-2'}
            isProfileContext={props.isProfileContext ?? false}
        />,
    );
    return { container };
}

describe('WebRTC', () => {
    beforeEach(() => {
        mockState.webRtcCache = { 'profile-2': false };
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('should render the description and the warning', () => {
        const { container } = renderWebRTC();

        expect(container.textContent).toContain(
            'WebRTC can leak your IP address even when using a VPN.',
        );
        expect(container.textContent).toContain('May break some websites');
    });

    it('should not render the ProfileHint indicator', () => {
        const { container } = renderWebRTC();

        expect(container.querySelector('.profile-hint')).toBeNull();
    });

    it('should enable WebRTC for the given profile on toggle', async () => {
        const { container } = renderWebRTC();

        fireEvent.click(container.querySelector('.switch')!);

        await vi.waitFor(() => {
            expect(mockUpdateWebRtcCache).toHaveBeenCalledWith('profile-2', true);
        });
        expect(mockSetProfileWebRtc).toHaveBeenCalledTimes(1);
        expect(mockSetProfileWebRtc).toHaveBeenCalledWith('profile-2', true);
        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'enable_webrtc_click',
            'general_settings_screen',
        );
    });

    it('should disable WebRTC and send telemetry in the profile context', async () => {
        mockState.webRtcCache = { 'profile-2': true };

        const { container } = renderWebRTC({ isProfileContext: true });

        fireEvent.click(container.querySelector('.switch')!);

        expect(mockSetProfileWebRtc).toHaveBeenCalledWith('profile-2', false);
        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'disable_webrtc_click',
            'profile_settings_screen',
        );
    });

    it('should send disable telemetry on the Settings screen outside the profile context', async () => {
        mockState.webRtcCache = { 'profile-2': true };

        const { container } = renderWebRTC({ isProfileContext: false });

        fireEvent.click(container.querySelector('.switch')!);

        expect(mockSetProfileWebRtc).toHaveBeenCalledWith('profile-2', false);
        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'disable_webrtc_click',
            'general_settings_screen',
        );
    });

    it('should send enable telemetry with the profile settings screen inside the profile context', async () => {
        const { container } = renderWebRTC({ isProfileContext: true });

        fireEvent.click(container.querySelector('.switch')!);

        await vi.waitFor(() => {
            expect(mockUpdateWebRtcCache).toHaveBeenCalledWith('profile-2', true);
        });
        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'enable_webrtc_click',
            'profile_settings_screen',
        );
    });

    it('should log an error when the toggle request fails', async () => {
        mockSetProfileWebRtc.mockRejectedValueOnce(new Error('failed'));

        const { container } = renderWebRTC();

        fireEvent.click(container.querySelector('.switch')!);

        await vi.waitFor(() => {
            expect(mockLogError).toHaveBeenCalled();
        });
        expect(mockUpdateWebRtcCache).not.toHaveBeenCalled();
    });
});
