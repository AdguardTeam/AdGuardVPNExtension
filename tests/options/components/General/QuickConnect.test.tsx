import React from 'react';

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
} from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { observable } from 'mobx';

const mockPush = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
    useHistory: () => ({ push: mockPush }),
}));

/**
 * Mutable profiles array shared across tests. Push to it to simulate multiple profiles.
 */
const mockProfiles: Array<{ id: string; name: string }> = [];

/**
 * Mutable active profile ID. Change this via .set() to simulate profile switching (AC4).
 * Defaults to 'profile-2' ('Work') per AC1. Uses mobx observable so observer() re-renders.
 */
const mockActiveProfileId = observable.box('profile-2');

vi.mock('../../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => {
            if (key === 'settings_quick_connect_subtitle') {
                return 'VPN location selected when you click Connect';
            }
            if (key === 'settings_quick_connect_title') {
                return 'Quick connect';
            }
            if (key === 'settings_quick_connect_last_used') {
                return 'Last used location';
            }
            if (key === 'settings_quick_connect_fastest') {
                return 'Fastest location';
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

const mockSendCustomEvent = vi.hoisted(() => vi.fn());

vi.mock('../../../../src/options/stores', () => {
    const store = {
        profilesStore: {
            get profiles(): Array<{ id: string; name: string }> {
                return mockProfiles;
            },
            get activeProfileId(): string {
                return mockActiveProfileId.get();
            },
            get quickConnectCache(): Record<string, string> {
                return { [mockActiveProfileId.get()]: 'fastestLocation' };
            },
            getDisplayName: vi.fn((p: { id: string; name: string }) => p.name),
            updateQuickConnectCache: vi.fn(),
        },
        telemetryStore: {
            sendCustomEvent: mockSendCustomEvent,
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import { QuickConnect } from '../../../../src/options/components/General/QuickConnect';

/**
 * Renders QuickConnect and returns the container for querying rendered output.
 */
function renderQuickConnect(): { container: HTMLElement } {
    const { container } = render(<QuickConnect />);
    return { container };
}

describe('QuickConnect ProfileHint indicator', () => {
    beforeEach(() => {
        mockProfiles.length = 0;
        mockActiveProfileId.set('profile-2');
        vi.clearAllMocks();
    });

    describe('visibility', () => {
        it('should render ProfileHint indicator when profiles > 1', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderQuickConnect();
            const hint = container.querySelector('.profile-hint');
            expect(hint).not.toBeNull();
        });

        it('should not render ProfileHint indicator when profiles <= 1', () => {
            mockProfiles.push({ id: 'profile-1', name: 'Default' });
            const { container } = renderQuickConnect();
            const hint = container.querySelector('.profile-hint');
            expect(hint).toBeNull();
        });

        it('should not render ProfileHint indicator when no profiles exist', () => {
            const { container } = renderQuickConnect();
            const hint = container.querySelector('.profile-hint');
            expect(hint).toBeNull();
        });
    });

    describe('profile name in indicator', () => {
        it('should display the active profile name in the indicator', () => {
            // AC1: active profile is "Work" (profile-2), so indicator shows "Work"
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderQuickConnect();
            const hint = container.querySelector('.profile-hint');
            expect(hint).not.toBeNull();
            expect(hint!.textContent).toContain('Work');
        });
    });

    describe('reactivity on active profile change (AC4)', () => {
        it('should update indicator when active profile changes', async () => {
            // AC4: start with "Work" active, switch to "Home" — indicator updates
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
                { id: 'profile-3', name: 'Home' },
            );

            // Initial render with activeProfileId = 'profile-2' ('Work')
            const { container } = render(<QuickConnect />);
            const hintInitial = container.querySelector('.profile-hint');
            expect(hintInitial).not.toBeNull();
            expect(hintInitial!.textContent).toContain('Work');

            // Switch active profile to 'profile-3' ('Home')
            mockActiveProfileId.set('profile-3');

            await waitFor(() => {
                const hintUpdated = container.querySelector('.profile-hint');
                expect(hintUpdated).not.toBeNull();
                expect(hintUpdated!.textContent).toContain('Home');
                expect(hintUpdated!.textContent).not.toContain('Work');
            });
        });
    });

    describe('navigation on click', () => {
        it('should navigate to the active profile location route on indicator click', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderQuickConnect();
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
            const { container } = renderQuickConnect();
            expect(container.textContent).toContain(
                'VPN location selected when you click Connect',
            );
        });
    });
});
