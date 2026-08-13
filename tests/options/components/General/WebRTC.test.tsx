import React from 'react';

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
} from 'vitest';
import { render, fireEvent } from '@testing-library/react';

const mockPush = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
    useHistory: () => ({ push: mockPush }),
}));

/**
 * Mutable profiles array shared across tests.
 */
const mockProfiles: Array<{ id: string; name: string }> = [];

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

vi.mock('../../../../src/common/reactTranslator', () => ({
    reactTranslator: {
        getMessage: vi.fn((_key: string, params?: Record<string, unknown>) => {
            const profileName = (params as Record<string, string>)?.profile_name || '';
            return (
                <>
                    Applies to your
                    {' '}
                    <b>{profileName}</b>
                    {' '}
                    profile
                </>
            );
        }),
    },
}));

vi.mock('../../../../src/common/messenger', () => ({
    messenger: {
        setProfileWebRtc: vi.fn(),
    },
}));

vi.mock('../../../../src/common/logger', () => ({
    log: {
        error: vi.fn(),
    },
}));

vi.mock('../../../../src/options/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    const store = {
        profilesStore: {
            get profiles(): Array<{ id: string; name: string }> {
                return mockProfiles;
            },
            get activeProfileId(): string {
                return 'profile-2';
            },
            get webRtcCache(): Record<string, boolean> {
                return { 'profile-2': false };
            },
            getDisplayName: vi.fn((p: { id: string; name: string }) => p.name),
            updateWebRtcCache: vi.fn(),
        },
        telemetryStore: {
            sendCustomEvent: vi.fn(),
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

describe('WebRTC ProfileHint indicator', () => {
    beforeEach(() => {
        mockProfiles.length = 0;
        vi.clearAllMocks();
    });

    describe('visibility when isProfileContext=false (General settings)', () => {
        it('should render ProfileHint indicator when profiles > 1', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderWebRTC({ isProfileContext: false });
            const hint = container.querySelector('.profile-hint');
            expect(hint).not.toBeNull();
        });

        it('should not render ProfileHint indicator when profiles <= 1', () => {
            mockProfiles.push({ id: 'profile-1', name: 'Default' });
            const { container } = renderWebRTC({ isProfileContext: false });
            const hint = container.querySelector('.profile-hint');
            expect(hint).toBeNull();
        });

        it('should display the profile name in the indicator', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderWebRTC({
                profileId: 'profile-2',
                isProfileContext: false,
            });
            const hint = container.querySelector('.profile-hint');
            expect(hint).not.toBeNull();
            expect(hint!.textContent).toContain('Work');
        });
    });

    describe('visibility when isProfileContext=true (ProfileDetail)', () => {
        it('should not render ProfileHint indicator even with 2+ profiles', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderWebRTC({ isProfileContext: true });
            const hint = container.querySelector('.profile-hint');
            expect(hint).toBeNull();
        });
    });

    describe('navigation on click', () => {
        it('should navigate to the profile detail route on indicator click', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderWebRTC({
                profileId: 'profile-2',
                isProfileContext: false,
            });
            const hint = container.querySelector('.profile-hint');
            expect(hint).not.toBeNull();
            fireEvent.click(hint!);
            expect(mockPush).toHaveBeenCalledWith('/profiles/profile-2');
        });

        it('should use the profileId prop for navigation, not activeProfileId', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
                { id: 'profile-3', name: 'Home' },
            );
            const { container } = renderWebRTC({
                profileId: 'profile-3',
                isProfileContext: false,
            });
            const hint = container.querySelector('.profile-hint');
            expect(hint).not.toBeNull();
            fireEvent.click(hint!);
            expect(mockPush).toHaveBeenCalledWith('/profiles/profile-3');
        });
    });

    describe('original description content preserved', () => {
        it('should still render the description text', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderWebRTC({ isProfileContext: false });
            expect(container.textContent).toContain(
                'WebRTC can leak your IP address even when using a VPN.',
            );
        });

        it('should still render the warning text', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderWebRTC({ isProfileContext: false });
            expect(container.textContent).toContain('May break some websites');
        });
    });
});
