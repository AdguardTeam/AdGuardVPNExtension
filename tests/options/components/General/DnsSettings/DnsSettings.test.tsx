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

// Mock child components to render nothing, focusing test on ProfileHint behavior
vi.mock('../../../../../src/options/components/General/DnsSettings/DnsSettingsServer', () => ({
    DnsSettingsServer: () => null,
}));

vi.mock(
    '../../../../../src/options/components/General/DnsSettings/DnsSettingsServerModalAdd',
    () => ({
        DnsSettingsServerModalAdd: () => null,
    }),
);

vi.mock(
    '../../../../../src/options/components/General/DnsSettings/DnsSettingsServerModalEdit',
    () => ({
        DnsSettingsServerModalEdit: () => null,
    }),
);

vi.mock('../../../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => {
            if (key === 'settings_dns_label') {
                return 'DNS server';
            }
            if (key === 'settings_dns_popular_servers') {
                return 'Popular DNS servers';
            }
            if (key === 'settings_dns_custom_servers') {
                return 'Custom DNS servers';
            }
            if (key === 'settings_dns_add_custom_server') {
                return 'Add custom DNS server';
            }
            return key;
        }),
    },
}));

vi.mock('../../../../../src/common/reactTranslator', () => ({
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

vi.mock('../../../../../src/common/telemetry/useTelemetryPageViewEvent', () => ({
    useTelemetryPageViewEvent: vi.fn(),
}));

vi.mock('../../../../../src/options/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    const store = {
        settingsStore: {
            setShowDnsSettings: vi.fn(),
        },
        dnsStore: {
            dnsServer: 'adguard-dns',
            customDnsServers: [],
            isCustomDnsModalOpen: false,
            setDnsServer: vi.fn(),
            openCustomDnsModal: vi.fn(),
            setDnsServerToEdit: vi.fn(),
            removeCustomDnsServer: vi.fn(),
            restoreCustomDnsServersData: vi.fn(),
        },
        notificationsStore: {
            notifySuccess: vi.fn(),
        },
        telemetryStore: {
            sendCustomEvent: vi.fn(),
        },
        profilesStore: {
            get profiles(): Array<{ id: string; name: string }> {
                return mockProfiles;
            },
            get activeProfileId(): string {
                return 'profile-2';
            },
            getDisplayName: vi.fn((p: { id: string; name: string }) => p.name),
        },
    };

    return { rootStore: React.createContext(store) };
});

// Mock constants used by DnsSettings
vi.mock('../../../../../src/common/dnsConstants', () => ({
    DEFAULT_DNS_SERVER: { id: 'default', name: 'Default' },
    POPULAR_DNS_SERVERS: [],
    ADGUARD_DNS_ID: 'adguard-dns',
    ADGUARD_NON_FILTERING_DNS_ID: 'adguard-non-filtering',
    ADGUARD_FAMILY_DNS_ID: 'adguard-family',
    GOOGLE_DNS_ID: 'google-dns',
    CLOUDFLARE_DNS_ID: 'cloudflare-dns',
    CISCO_DNS_ID: 'cisco-dns',
    QUAD9_DNS_ID: 'quad9-dns',
}));

// eslint-disable-next-line import/first
import { DnsSettings } from '../../../../../src/options/components/General/DnsSettings/DnsSettings';

/**
 * Renders DnsSettings with given props and returns the container for querying.
 */
function renderDnsSettings(props: { profileId?: string; onBack?: () => void } = {}): {
    container: HTMLElement;
} {
    const { container } = render(
        <DnsSettings profileId={props.profileId} onBack={props.onBack} />,
    );
    return { container };
}

describe('DnsSettings ProfileHint indicator', () => {
    beforeEach(() => {
        mockProfiles.length = 0;
        vi.clearAllMocks();
    });

    describe('visibility when profileId is undefined (General settings)', () => {
        it('should render ProfileHint in title subtitle when profiles > 1', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderDnsSettings();
            const hint = container.querySelector('.profile-hint');
            expect(hint).not.toBeNull();
        });

        it('should not render ProfileHint in title subtitle when profiles <= 1', () => {
            mockProfiles.push({ id: 'profile-1', name: 'Default' });
            const { container } = renderDnsSettings();
            // ProfileHint returns null when profiles <= 1, so no .profile-hint element exists
            const hint = container.querySelector('.profile-hint');
            expect(hint).toBeNull();
        });

        it('should not render ProfileHint in title subtitle when no profiles exist', () => {
            const { container } = renderDnsSettings();
            const hint = container.querySelector('.profile-hint');
            expect(hint).toBeNull();
        });

        it('should display the active profile name in the subtitle', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderDnsSettings();
            const hint = container.querySelector('.profile-hint');
            expect(hint).not.toBeNull();
            expect(hint!.textContent).toContain('Work');
        });
    });

    describe('visibility when profileId is provided (ProfileDnsSettings)', () => {
        it('should not render ProfileHint in title subtitle even with 2+ profiles', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderDnsSettings({ profileId: 'profile-2' });
            const hint = container.querySelector('.profile-hint');
            expect(hint).toBeNull();
        });
    });

    describe('navigation on click', () => {
        it('should navigate to the active profile DNS route on indicator click', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderDnsSettings();
            const hint = container.querySelector('.profile-hint');
            expect(hint).not.toBeNull();
            fireEvent.click(hint!);
            // activeProfileId is 'profile-2', so navigates to /profiles/profile-2
            expect(mockPush).toHaveBeenCalledWith('/profiles/profile-2');
        });
    });
});
