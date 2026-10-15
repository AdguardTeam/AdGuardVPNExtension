import React from 'react';

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
} from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';

const mockPush = vi.hoisted(() => vi.fn());
const mockSearch = vi.hoisted(() => ({ value: '' }));
const mockActiveProfileId = vi.hoisted(() => ({ value: 'profile-1' }));
const mockUpdateQuickConnectCache = vi.hoisted(() => vi.fn());
const mockSendCustomEvent = vi.hoisted(() => vi.fn());
const mockSendPageViewEvent = vi.hoisted(() => vi.fn());
const mockQuickConnectCache = vi.hoisted(() => ({} as Record<string, string>));
const mockProfiles = vi.hoisted(() => [] as Array<{ id: string; name: string }>);
const mockLocations = vi.hoisted(() => [] as Array<{
    id: string; countryName: string; cityName: string; available: boolean; premiumOnly: boolean;
}>);

vi.mock('react-router-dom', () => ({
    useHistory: () => ({ push: mockPush }),
    useLocation: () => ({ pathname: '/profiles/profile-2', search: mockSearch.value }),
    useParams: () => ({ id: 'profile-2' }),
    Redirect: () => null,
}));

vi.mock('../../../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => key),
    },
}));

vi.mock('../../../../../src/common/reactTranslator', () => ({
    reactTranslator: {
        getMessage: vi.fn((_key: string, params?: Record<string, unknown>) => {
            const profileName = (params as Record<string, string>)?.profile_name || '';
            return (
                <>
                    Applies to your
                    <b>{profileName}</b>
                    {' '}
                    profile
                </>
            );
        }),
    },
}));

vi.mock('../../../../../src/common/messenger', () => ({
    messenger: {
        setCurrentLocation: vi.fn().mockResolvedValue(true),
    },
}));

vi.mock('../../../../../src/options/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    const store = {
        profilesStore: {
            get profiles(): Array<{ id: string; name: string }> {
                return mockProfiles;
            },
            get quickConnectCache(): Record<string, string> {
                return mockQuickConnectCache;
            },
            locationCache: {} as Record<string, { id: string }>,
            get activeProfileId(): string {
                return mockActiveProfileId.value;
            },
            getDisplayName: vi.fn((p: { id: string; name: string }) => p.name),
            updateQuickConnectCache: (profileId: string, value: string): Promise<void> => {
                mockUpdateQuickConnectCache(profileId, value);
                mockQuickConnectCache[profileId] = value;
                return Promise.resolve();
            },
        },
        settingsStore: {
            get locations(): Array<{
                id: string; countryName: string; cityName: string; available: boolean; premiumOnly: boolean;
            }> {
                return mockLocations;
            },
            isPremiumToken: false,
        },
        telemetryStore: {
            sendCustomEvent: mockSendCustomEvent,
            sendPageViewEvent: mockSendPageViewEvent,
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import { messenger } from '../../../../../src/common/messenger';
// eslint-disable-next-line import/first
import {
    ProfileLocationSettings,
} from '../../../../../src/options/components/Profiles/ProfileLocationSettings/ProfileLocationSettings';

function renderComponent(): { container: HTMLElement } {
    const { container } = render(<ProfileLocationSettings />);
    return { container };
}

describe('ProfileLocationSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.keys(mockQuickConnectCache).forEach((key) => {
            delete mockQuickConnectCache[key];
        });
        mockProfiles.length = 0;
        mockLocations.length = 0;
        mockSearch.value = '';
        mockActiveProfileId.value = 'profile-1';
    });

    it('should render the profile hint for a non-active profile', () => {
        mockProfiles.push(
            { id: 'profile-1', name: 'Default' },
            { id: 'profile-2', name: 'Work' },
        );
        const { container } = renderComponent();
        const hint = container.querySelector('.profile-hint');

        expect(hint).not.toBeNull();
        expect(hint!.textContent).toContain('Work');
    });

    it('should not render the profile hint for the active profile', () => {
        mockProfiles.push(
            { id: 'profile-1', name: 'Default' },
            { id: 'profile-2', name: 'Work' },
        );
        mockActiveProfileId.value = 'profile-2';
        const { container } = renderComponent();

        expect(container.querySelector('.profile-hint')).toBeNull();
    });

    it('should align the subtitle with the back arrow (no indent)', () => {
        mockProfiles.push(
            { id: 'profile-1', name: 'Default' },
            { id: 'profile-2', name: 'Work' },
        );
        const { container } = renderComponent();
        const title = container.querySelector('.title');

        expect(container.querySelector('.profile-hint')).not.toBeNull();
        expect(title!.className).not.toContain('title--subtitle-indent');
    });

    it('should navigate to the profile settings when the hint is clicked', () => {
        mockProfiles.push(
            { id: 'profile-1', name: 'Default' },
            { id: 'profile-2', name: 'Work' },
        );
        const { container } = renderComponent();
        const hint = container.querySelector('.profile-hint--interactive');

        expect(hint).not.toBeNull();
        fireEvent.click(hint!);

        expect(mockPush).toHaveBeenCalledWith('/profiles/profile-2');
        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'applies_to_profile_click',
            'quick_connect_screen',
        );
    });

    it('should send the quick connect page view event', () => {
        mockProfiles.push({ id: 'profile-2', name: 'Work' });
        renderComponent();

        expect(mockSendPageViewEvent).toHaveBeenCalledWith('quick_connect_screen');
    });

    it('should not send the quick connect page view event when the profile is missing', () => {
        renderComponent();

        expect(mockSendPageViewEvent).not.toHaveBeenCalled();
    });

    it('should return to the profile screen when there is no origin in the URL', () => {
        mockProfiles.push({ id: 'profile-2', name: 'Work' });
        const { container } = renderComponent();

        fireEvent.click(container.querySelector('button')!);

        expect(mockPush).toHaveBeenCalledWith('/profiles/profile-2');
    });

    it('should return to the screen the settings were opened from', () => {
        mockProfiles.push({ id: 'profile-2', name: 'Work' });
        mockSearch.value = '?from=/';
        const { container } = renderComponent();

        fireEvent.click(container.querySelector('button')!);

        expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should render the strategy options before the location list', () => {
        mockProfiles.push({ id: 'profile-2', name: 'Work' });
        mockLocations.push({
            id: 'loc-berlin',
            countryName: 'Germany',
            cityName: 'Berlin',
            available: true,
            premiumOnly: false,
        });
        const { container } = renderComponent();

        const values = [...container.querySelectorAll('input[type="radio"]')]
            .map((input) => (input as HTMLInputElement).value);

        expect(values).toEqual(['auto', 'lastUsed', 'loc-berlin']);
    });

    it('should hide the last used and fastest options while searching', () => {
        mockProfiles.push({ id: 'profile-2', name: 'Work' });
        const { container } = renderComponent();

        fireEvent.change(container.querySelector('input[type="text"]')!, {
            target: { value: 'berlin' },
        });

        expect(container.querySelector('input[value="lastUsed"]')).toBeNull();
        expect(container.querySelector('input[value="auto"]')).toBeNull();
    });

    it('should save the last used location strategy to the profile', async () => {
        mockProfiles.push({ id: 'profile-2', name: 'Work' });
        const { container } = renderComponent();

        fireEvent.click(container.querySelector('input[value="lastUsed"]')!);

        await waitFor(() => {
            expect(mockUpdateQuickConnectCache).toHaveBeenCalledWith('profile-2', 'lastUsedLocation');
        });
        expect(messenger.setCurrentLocation).not.toHaveBeenCalled();
        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'last_quick_connect_click',
            'quick_connect_screen',
        );
    });

    it('should save the fastest strategy to the profile', async () => {
        mockProfiles.push({ id: 'profile-2', name: 'Work' });
        const { container } = renderComponent();

        fireEvent.click(container.querySelector('input[value="auto"]')!);

        await waitFor(() => {
            expect(mockUpdateQuickConnectCache).toHaveBeenCalledWith('profile-2', 'fastestLocation');
        });
        expect(messenger.setCurrentLocation).not.toHaveBeenCalled();
        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'fastest_quick_connect_click',
            'quick_connect_screen',
        );
    });

    it('should pin the selected location to the profile', async () => {
        mockProfiles.push({ id: 'profile-2', name: 'Work' });
        mockLocations.push({
            id: 'loc-berlin',
            countryName: 'Germany',
            cityName: 'Berlin',
            available: true,
            premiumOnly: false,
        });
        const { container } = renderComponent();

        fireEvent.click(container.querySelector('input[value="loc-berlin"]')!);

        await waitFor(() => {
            expect(mockUpdateQuickConnectCache).toHaveBeenCalledWith('profile-2', 'specificLocation');
        });
        expect(messenger.setCurrentLocation).toHaveBeenCalledWith('profile-2', 'loc-berlin');
        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'location_quick_connect_click',
            'quick_connect_screen',
        );
    });

    it('should not pin the location when it is not applied', async () => {
        mockProfiles.push({ id: 'profile-2', name: 'Work' });
        mockLocations.push({
            id: 'loc-berlin',
            countryName: 'Germany',
            cityName: 'Berlin',
            available: true,
            premiumOnly: false,
        });
        // The location may be missing from the background locations list
        // (e.g. it is outdated): the strategy must not be saved then.
        vi.mocked(messenger.setCurrentLocation).mockResolvedValueOnce(false);
        const { container } = renderComponent();

        fireEvent.click(container.querySelector('input[value="loc-berlin"]')!);

        await waitFor(() => {
            expect(messenger.setCurrentLocation).toHaveBeenCalledWith('profile-2', 'loc-berlin');
        });
        expect(mockUpdateQuickConnectCache).not.toHaveBeenCalled();
    });

    it('should not overwrite the strategy picked while the location is applying', async () => {
        mockProfiles.push({ id: 'profile-2', name: 'Work' });
        mockLocations.push({
            id: 'loc-berlin',
            countryName: 'Germany',
            cityName: 'Berlin',
            available: true,
            premiumOnly: false,
        });
        let resolveLocation: (value: boolean) => void = () => {};
        vi.mocked(messenger.setCurrentLocation).mockImplementationOnce(() => {
            return new Promise((resolve) => {
                resolveLocation = resolve;
            });
        });
        const { container } = renderComponent();

        fireEvent.click(container.querySelector('input[value="loc-berlin"]')!);
        // The user picks another strategy while the location is still applying.
        fireEvent.click(container.querySelector('input[value="lastUsed"]')!);

        await waitFor(() => {
            expect(mockUpdateQuickConnectCache).toHaveBeenCalledWith('profile-2', 'lastUsedLocation');
        });

        resolveLocation(true);

        await waitFor(() => {
            expect(messenger.setCurrentLocation).toHaveBeenCalledWith('profile-2', 'loc-berlin');
        });
        expect(mockUpdateQuickConnectCache).not.toHaveBeenCalledWith('profile-2', 'specificLocation');
    });

    it('should not overwrite the strategy re-selected while the location is applying', async () => {
        mockProfiles.push({ id: 'profile-2', name: 'Work' });
        mockLocations.push({
            id: 'loc-berlin',
            countryName: 'Germany',
            cityName: 'Berlin',
            available: true,
            premiumOnly: false,
        });
        // The fastest strategy is already active, so re-selecting it
        // does not change the cached value.
        mockQuickConnectCache['profile-2'] = 'fastestLocation';

        let resolveLocation: (value: boolean) => void = () => {};
        vi.mocked(messenger.setCurrentLocation).mockImplementationOnce(() => {
            return new Promise((resolve) => {
                resolveLocation = resolve;
            });
        });
        const { container } = renderComponent();

        fireEvent.click(container.querySelector('input[value="loc-berlin"]')!);
        // The user re-selects the already active strategy while the location
        // is still applying.
        const activeOption = container.querySelector('input[value="auto"]')!.closest('label')!;
        fireEvent.keyDown(activeOption, { key: 'Enter' });

        await waitFor(() => {
            expect(mockUpdateQuickConnectCache).toHaveBeenCalledWith('profile-2', 'fastestLocation');
        });

        resolveLocation(true);

        await waitFor(() => {
            expect(messenger.setCurrentLocation).toHaveBeenCalledWith('profile-2', 'loc-berlin');
        });
        expect(mockUpdateQuickConnectCache).not.toHaveBeenCalledWith('profile-2', 'specificLocation');
    });
});
