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

vi.mock('../../../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string, params?: Record<string, unknown>) => {
            if (key === 'settings_dns_label') {
                return 'DNS server';
            }
            if (key === 'settings_dns_description') {
                return 'Allows to select a DNS server to resolve DNS requests';
            }
            if (key === 'settings_description_current') {
                return `Current: ${(params as Record<string, string>)?.mode || ''}`;
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

vi.mock('../../../../../src/options/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    const store = {
        settingsStore: {
            setShowDnsSettings: vi.fn(),
        },
        dnsStore: {
            get currentDnsServerName(): string {
                return 'AdGuard DNS';
            },
            getProfileDnsServerName: vi.fn(() => 'AdGuard DNS'),
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

// eslint-disable-next-line import/first
import { DnsSettingsButton } from '../../../../../src/options/components/General/DnsSettings/DnsSettingsButton';

/**
 * Renders DnsSettingsButton with given props and returns the container for querying.
 */
function renderButton(props: { profileId?: string; onClick?: () => void } = {}): {
    container: HTMLElement;
} {
    const { container } = render(
        <DnsSettingsButton profileId={props.profileId} onClick={props.onClick} />,
    );
    return { container };
}

describe('DnsSettingsButton ProfileHint indicator', () => {
    beforeEach(() => {
        mockProfiles.length = 0;
        vi.clearAllMocks();
    });

    describe('visibility when profileId is undefined (General settings)', () => {
        it('should render ProfileHint indicator when profiles > 1', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderButton();
            const hint = container.querySelector('.profile-hint');
            expect(hint).not.toBeNull();
        });

        it('should not render ProfileHint indicator when profiles <= 1', () => {
            mockProfiles.push({ id: 'profile-1', name: 'Default' });
            const { container } = renderButton();
            const hint = container.querySelector('.profile-hint');
            expect(hint).toBeNull();
        });

        it('should not render ProfileHint indicator when no profiles exist', () => {
            const { container } = renderButton();
            const hint = container.querySelector('.profile-hint');
            expect(hint).toBeNull();
        });

        it('should display the active profile name in the indicator', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderButton();
            const hint = container.querySelector('.profile-hint');
            expect(hint).not.toBeNull();
            expect(hint!.textContent).toContain('Work');
        });
    });

    describe('visibility when profileId is provided (ProfileDetail)', () => {
        it('should not render ProfileHint indicator even with 2+ profiles', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderButton({ profileId: 'profile-2' });
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
            const { container } = renderButton();
            const hint = container.querySelector('.profile-hint');
            expect(hint).not.toBeNull();
            fireEvent.click(hint!);
            // activeProfileId is 'profile-2', so navigates to /profiles/profile-2
            expect(mockPush).toHaveBeenCalledWith('/profiles/profile-2');
        });
    });

    describe('description text', () => {
        it('should still render the original description text', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderButton();
            expect(container.textContent).toContain(
                'Allows to select a DNS server to resolve DNS requests',
            );
            expect(container.textContent).toContain('Current: AdGuard DNS');
        });
    });
});
