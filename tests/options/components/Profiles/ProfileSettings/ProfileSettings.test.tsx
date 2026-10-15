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

const mockPush = vi.hoisted(() => vi.fn());
const mockSendCustomEvent = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
    useHistory: () => ({ push: mockPush }),
    useLocation: () => ({ pathname: '/', search: '' }),
}));

vi.mock('../../../../../src/options/components/Profiles/ProfileSettings/ExclusionsButton', () => ({
    ExclusionsButton: ({ profileId, telemetryScreenName }: {
        profileId: string;
        telemetryScreenName: string;
    }) => <div data-testid="exclusions-row">{`${profileId}:${telemetryScreenName}`}</div>,
}));

vi.mock('../../../../../src/options/components/General/DnsSettings', () => ({
    DnsSettingsButton: ({ profileId, onClick }: { profileId: string; onClick: () => void }) => (
        <button type="button" data-testid="dns-row" onClick={onClick}>{profileId}</button>
    ),
}));

vi.mock('../../../../../src/options/components/Profiles/ProfileSettings/LocationButton', () => ({
    LocationButton: ({ profileId, onClick }: { profileId: string; onClick: () => void }) => (
        <button type="button" data-testid="location-row" onClick={onClick}>{profileId}</button>
    ),
}));

vi.mock('../../../../../src/options/components/General/WebRTC', () => ({
    WebRTC: ({ profileId, isProfileContext }: {
        profileId: string;
        isProfileContext: boolean;
    }) => <div data-testid="webrtc-row">{`${profileId}:${String(isProfileContext)}`}</div>,
}));

vi.mock('../../../../../src/options/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    const store = {
        telemetryStore: {
            sendCustomEvent: mockSendCustomEvent,
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import { ProfileSettings } from '../../../../../src/options/components/Profiles/ProfileSettings/ProfileSettings';

describe('ProfileSettings block', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('should render rows in the design order', () => {
        const { container } = render(<ProfileSettings profileId="profile-1" />);

        const rows = Array.from(container.querySelectorAll('[data-testid$="row"]'));

        expect(rows.map((row) => row.getAttribute('data-testid'))).toEqual([
            'exclusions-row',
            'dns-row',
            'location-row',
            'webrtc-row',
        ]);
    });

    it('should pass the profile id to every row', () => {
        const { container } = render(<ProfileSettings profileId="profile-1" />);

        expect(container.querySelector('[data-testid="exclusions-row"]')?.textContent)
            .toContain('profile-1');
        expect(container.querySelector('[data-testid="dns-row"]')?.textContent)
            .toBe('profile-1');
        expect(container.querySelector('[data-testid="location-row"]')?.textContent)
            .toBe('profile-1');
        expect(container.querySelector('[data-testid="webrtc-row"]')?.textContent)
            .toContain('profile-1');
    });

    it('should use the general settings screen name outside the profile context', () => {
        const { container } = render(<ProfileSettings profileId="profile-1" />);

        expect(container.querySelector('[data-testid="exclusions-row"]')?.textContent)
            .toBe('profile-1:general_settings_screen');
        expect(container.querySelector('[data-testid="webrtc-row"]')?.textContent)
            .toBe('profile-1:false');
    });

    it('should use the profile settings screen name inside the profile context', () => {
        const { container } = render(<ProfileSettings profileId="profile-1" isProfileContext />);

        expect(container.querySelector('[data-testid="exclusions-row"]')?.textContent)
            .toBe('profile-1:profile_settings_screen');
        expect(container.querySelector('[data-testid="webrtc-row"]')?.textContent)
            .toBe('profile-1:true');
    });

    it('should open the DNS settings of the profile on click', () => {
        const { container } = render(<ProfileSettings profileId="profile-1" />);

        fireEvent.click(container.querySelector('[data-testid="dns-row"]')!);

        expect(mockPush).toHaveBeenCalledWith('/profiles/profile-1/dns?from=%2F');
        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'dns_server_click',
            'general_settings_screen',
        );
    });

    it('should open the location settings of the profile on click', () => {
        const { container } = render(<ProfileSettings profileId="profile-1" />);

        fireEvent.click(container.querySelector('[data-testid="location-row"]')!);

        expect(mockPush).toHaveBeenCalledWith('/profiles/profile-1/location?from=%2F');
        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'quick_connect_click',
            'general_settings_screen',
        );
    });

    it('should send the quick connect telemetry inside the profile context', () => {
        const { container } = render(<ProfileSettings profileId="profile-1" isProfileContext />);

        fireEvent.click(container.querySelector('[data-testid="location-row"]')!);

        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'quick_connect_click',
            'profile_settings_screen',
        );
    });
});
