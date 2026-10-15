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

const mockState = vi.hoisted(() => ({
    showDnsSettings: false,
    activeProfileId: 'profile-1' as string | null,
}));

const mockSendCustomEvent = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => {
    const React = require('react'); // eslint-disable-line global-require

    return {
        Link: ({ to, children, onClick }: {
            to: string;
            children: React.ReactNode;
            onClick?: () => void;
        }) => (
            React.createElement('a', { href: to, onClick }, children)
        ),
    };
});

vi.mock('../../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => key),
    },
}));

vi.mock('../../../../src/common/reactTranslator', () => ({
    reactTranslator: {
        getMessage: vi.fn((key: string, params?: Record<string, unknown>) => {
            const profileName = (params?.profile_name as string) || '';
            const renderBold = params?.b as ((chunks: string) => React.ReactNode) | undefined;

            return (
                <span>
                    {key}
                    {renderBold ? renderBold(profileName) : <b>{profileName}</b>}
                </span>
            );
        }),
    },
}));

vi.mock('../../../../src/common/telemetry/useTelemetryPageViewEvent', () => ({
    useTelemetryPageViewEvent: vi.fn(),
}));

vi.mock('../../../../src/options/components/ui/Title', () => ({
    Title: ({ title, subtitle }: { title: React.ReactNode; subtitle?: React.ReactNode }) => (
        <div>
            <h1>{title}</h1>
            {subtitle && <div>{subtitle}</div>}
        </div>
    ),
}));

vi.mock('../../../../src/options/components/Profiles/ProfileSettings', () => ({
    ProfileSettings: ({ profileId }: { profileId: string }) => (
        <div data-testid="profile-settings">{profileId}</div>
    ),
}));

vi.mock('../../../../src/options/components/General/Theme', () => ({
    Theme: () => <div data-testid="theme" />,
}));

vi.mock('../../../../src/options/components/General/Language', () => ({
    Language: () => <div data-testid="language" />,
}));

vi.mock('../../../../src/options/components/General/ContextMenus', () => ({
    ContextMenus: () => <div data-testid="context-menus" />,
}));

vi.mock('../../../../src/options/components/General/HelpUsImprove', () => ({
    HelpUsImprove: () => <div data-testid="help-us-improve" />,
}));

vi.mock('../../../../src/options/components/General/DnsSettings', () => ({
    DnsSettings: () => <div data-testid="dns-settings" />,
}));

vi.mock('../../../../src/options/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    const store = {
        settingsStore: {
            get showDnsSettings(): boolean {
                return mockState.showDnsSettings;
            },
            isHelpUsImproveModalOpen: false,
        },
        telemetryStore: {
            sendCustomEvent: mockSendCustomEvent,
        },
        profilesStore: {
            get activeProfile(): { id: string; name: string } | null {
                return mockState.activeProfileId
                    ? { id: mockState.activeProfileId, name: 'Default' }
                    : null;
            },
            getDisplayName: (profile: { name: string }): string => profile.name,
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import { General } from '../../../../src/options/components/General/General';
// eslint-disable-next-line import/first
import { PROFILES_PATH } from '../../../../src/options/components/Profiles/profileRoutes';

describe('Settings screen (General component)', () => {
    beforeEach(() => {
        mockState.showDnsSettings = false;
        mockState.activeProfileId = 'profile-1';
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('should render the screen title', () => {
        const { container } = render(<General />);

        expect(container.querySelector('h1')?.textContent).toBe('settings_title');
    });

    it('should render the active profile block', () => {
        const { container } = render(<General />);

        expect(container.textContent).toContain('settings_current_profile');
        expect(container.textContent).toContain('Default');
        expect(container.textContent).toContain('settings_current_profile_description');
    });

    it('should render the profile block above the general settings section', () => {
        const { container } = render(<General />);

        const text = container.textContent ?? '';

        expect(text.indexOf('settings_current_profile'))
            .toBeLessThan(text.indexOf('settings_general_title'));
    });

    it('should render the profile settings block for the active profile', () => {
        const { container } = render(<General />);

        expect(container.querySelector('[data-testid="profile-settings"]')?.textContent)
            .toBe('profile-1');
    });

    it('should link the profile name to the profiles screen', () => {
        const { getByRole } = render(<General />);

        // The name is a link, not a button: an inline element wraps the long
        // names across lines instead of moving to its own line.
        const link = getByRole('link', { name: 'Default' });
        expect(link.getAttribute('href')).toBe(PROFILES_PATH);

        fireEvent.click(link);

        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'applies_to_profile_click',
            'general_settings_screen',
        );
    });

    it('should render the general settings section and its rows', () => {
        const { container } = render(<General />);

        expect(container.textContent).toContain('settings_general_title');
        expect(container.textContent).toContain('settings_general_description');
        expect(container.querySelector('[data-testid="theme"]')).not.toBeNull();
        expect(container.querySelector('[data-testid="language"]')).not.toBeNull();
        expect(container.querySelector('[data-testid="context-menus"]')).not.toBeNull();
        expect(container.querySelector('[data-testid="help-us-improve"]')).not.toBeNull();
    });

    it('should not render the profile block when there is no active profile', () => {
        mockState.activeProfileId = null;

        const { container } = render(<General />);

        expect(container.querySelector('[data-testid="profile-settings"]')).toBeNull();
        expect(container.textContent).not.toContain('settings_current_profile');
        expect(container.textContent).toContain('settings_general_title');
    });

    it('should render DNS settings instead of the screen when they are opened on top', () => {
        mockState.showDnsSettings = true;

        const { container } = render(<General />);

        expect(container.querySelector('[data-testid="dns-settings"]')).not.toBeNull();
        expect(container.querySelector('[data-testid="profile-settings"]')).toBeNull();
    });
});
