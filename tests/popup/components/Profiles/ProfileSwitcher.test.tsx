import React from 'react';

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    afterEach,
} from 'vitest';
import {
    render,
    cleanup,
    fireEvent,
    waitFor,
} from '@testing-library/react';

const mockSwitchProfile = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockOpenProfilesPage = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockCloseWindow = vi.hoisted(() => vi.fn());
const mockSendCustomEvent = vi.hoisted(() => vi.fn());
const mockLogError = vi.hoisted(() => vi.fn());

const vpnStoreBox = vi.hoisted(() => ({
    value: {
        profiles: [
            { id: 'default', name: 'Default' },
            { id: 'work', name: 'Work' },
        ],
        activeProfileId: 'default',
        activeProfileName: 'Default',
    },
}));

/**
 * Restores the initial store state.
 */
function resetStore(): void {
    vpnStoreBox.value = {
        profiles: [
            { id: 'default', name: 'Default' },
            { id: 'work', name: 'Work' },
        ],
        activeProfileId: 'default',
        activeProfileName: 'Default',
    };
}

vi.mock('../../../../src/common/translator', () => ({
    translator: {
        getMessage: (key: string) => key,
    },
}));

vi.mock('../../../../src/common/messenger', () => ({
    messenger: {
        switchProfile: mockSwitchProfile,
        openProfilesPage: mockOpenProfilesPage,
    },
}));

vi.mock('../../../../src/common/logger', () => ({
    log: {
        error: mockLogError,
    },
}));

vi.mock('../../../../src/common/components/Icons', () => ({
    Icon: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock('../../../../src/popup/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    const store = {
        get vpnStore() {
            return vpnStoreBox.value;
        },
        telemetryStore: {
            sendCustomEvent: mockSendCustomEvent,
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import { ProfileSwitcher } from '../../../../src/popup/components/Profiles/ProfileSwitcher/ProfileSwitcher';

/**
 * Renders the switcher and returns the container for querying.
 *
 * @returns Rendered container.
 */
function renderSwitcher(): { container: HTMLElement } {
    const { container } = render(<ProfileSwitcher />);
    return { container };
}

describe('Popup ProfileSwitcher', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetStore();
        Object.defineProperty(window, 'close', {
            value: mockCloseWindow,
            writable: true,
        });
    });

    afterEach(() => {
        cleanup();
    });

    it('should render the active profile name', () => {
        const { container } = renderSwitcher();

        expect(container.querySelector('button')?.textContent).toContain('Default');
    });

    it('should render the button even with a single profile', () => {
        vpnStoreBox.value = {
            ...vpnStoreBox.value,
            profiles: [{ id: 'default', name: 'Default' }],
        };

        const { container } = renderSwitcher();

        expect(container.querySelector('button')?.textContent).toContain('Default');
    });

    it('should not render the menu until the button is clicked', () => {
        const { container } = renderSwitcher();

        expect(container.textContent).not.toContain('settings_profiles_manage');

        fireEvent.click(container.querySelector('button')!);

        expect(container.textContent).toContain('settings_profiles_manage');
        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'profile_selector_click',
            'home_screen',
        );
    });

    it('should not send the selector event when the menu is closed by clicking the name', () => {
        const { container } = renderSwitcher();

        fireEvent.click(container.querySelector('button')!);
        mockSendCustomEvent.mockClear();
        fireEvent.click(container.querySelector('button')!);

        expect(container.textContent).not.toContain('settings_profiles_manage');
        expect(mockSendCustomEvent).not.toHaveBeenCalled();
    });

    it('should switch the profile on selection', async () => {
        const { container } = renderSwitcher();

        fireEvent.click(container.querySelector('button')!);

        const workItem = Array.from(container.querySelectorAll('button'))
            .find((button) => button.textContent?.includes('Work'));

        fireEvent.click(workItem!);

        await waitFor(() => {
            expect(mockSwitchProfile).toHaveBeenCalledWith('work');
        });
    });

    it('should log the error when the switch fails', async () => {
        mockSwitchProfile.mockRejectedValueOnce(new Error('Failed to switch'));

        const { container } = renderSwitcher();
        fireEvent.click(container.querySelector('button')!);

        const workItem = Array.from(container.querySelectorAll('button'))
            .find((button) => button.textContent?.includes('Work'));
        fireEvent.click(workItem!);

        await waitFor(() => {
            expect(mockLogError).toHaveBeenCalledTimes(1);
        });
        expect(mockSwitchProfile).toHaveBeenCalledWith('work');
    });

    it('should not switch to the already active profile', () => {
        const { container } = renderSwitcher();

        fireEvent.click(container.querySelector('button')!);
        mockSendCustomEvent.mockClear();

        const activeItem = Array.from(container.querySelectorAll('button'))
            .find((button) => button.textContent?.includes('settings_profiles_default_name'));

        fireEvent.click(activeItem!);

        expect(mockSwitchProfile).not.toHaveBeenCalled();
        expect(mockSendCustomEvent).not.toHaveBeenCalled();
    });

    it('should open the profiles page and close the popup on manage', async () => {
        const { container } = renderSwitcher();

        fireEvent.click(container.querySelector('button')!);

        const manageButton = Array.from(container.querySelectorAll('button'))
            .find((button) => button.textContent?.includes('settings_profiles_manage'));

        fireEvent.click(manageButton!);

        await waitFor(() => {
            expect(mockOpenProfilesPage).toHaveBeenCalledTimes(1);
        });
        expect(mockCloseWindow).toHaveBeenCalledTimes(1);
        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'manage_profiles_click',
            'home_screen',
        );
    });

    it('should not close the popup when opening the profiles page fails', async () => {
        mockOpenProfilesPage.mockRejectedValueOnce(new Error('Failed to open'));

        const { container } = renderSwitcher();

        fireEvent.click(container.querySelector('button')!);

        const manageButton = Array.from(container.querySelectorAll('button'))
            .find((button) => button.textContent?.includes('settings_profiles_manage'));

        fireEvent.click(manageButton!);

        await waitFor(() => {
            expect(mockLogError).toHaveBeenCalledTimes(1);
        });
        expect(mockCloseWindow).not.toHaveBeenCalled();
    });
});
