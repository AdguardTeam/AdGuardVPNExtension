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

const mockPush = vi.hoisted(() => vi.fn());
const mockPathname = vi.hoisted(() => ({ value: '/' }));
const mockSetActiveProfile = vi.hoisted(() => vi.fn());
const mockSendCustomEvent = vi.hoisted(() => vi.fn());

const profilesStoreBox = vi.hoisted(() => ({
    value: {
        profiles: [
            { id: 'default', name: 'Default' },
            { id: 'work', name: 'Work' },
        ],
        activeProfileId: 'default',
        activeProfileDisplayName: 'Default',
    },
}));

vi.mock('react-router-dom', () => ({
    useHistory: () => ({ push: mockPush }),
    useLocation: () => ({ pathname: mockPathname.value }),
}));

vi.mock('../../../../src/common/translator', () => ({
    translator: {
        getMessage: (key: string) => key,
    },
}));

vi.mock('../../../../src/common/components/Icons', () => ({
    Icon: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock('../../../../src/options/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    const store = {
        get profilesStore() {
            return {
                ...profilesStoreBox.value,
                setActiveProfile: mockSetActiveProfile,
            };
        },
        telemetryStore: {
            sendCustomEvent: mockSendCustomEvent,
        },
    };

    return { rootStore: React.createContext(store) };
});

vi.mock('../../../../src/options/components/Sidebar/ProfileSwitcher/profile-switcher.module.pcss', () => ({
    default: { button: 'button', active: 'active' },
}));

// eslint-disable-next-line import/first
import { ProfileSwitcher } from '../../../../src/options/components/Sidebar/ProfileSwitcher/ProfileSwitcher';

/**
 * Renders the switcher and returns the container for querying.
 *
 * @param onNavigate Optional navigation callback.
 * @returns Rendered container.
 */
function renderSwitcher(onNavigate?: () => void): { container: HTMLElement } {
    const { container } = render(<ProfileSwitcher onNavigate={onNavigate} />);
    return { container };
}

/**
 * Returns the menu item button whose text contains the given value.
 *
 * @param container Rendered container.
 * @param text Text to search for.
 * @returns Menu item button.
 */
function getMenuItem(container: HTMLElement, text: string): HTMLButtonElement | undefined {
    return Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent?.includes(text));
}

describe('Sidebar ProfileSwitcher', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPathname.value = '/';
    });

    afterEach(() => {
        cleanup();
    });

    it('should render the active profile name', () => {
        const { container } = renderSwitcher();

        expect(container.querySelector('button')?.textContent).toContain('Default');
    });

    it('should highlight the button on the profiles screen', () => {
        mockPathname.value = '/profiles';
        const { container } = renderSwitcher();

        expect(container.querySelector('button')?.getAttribute('aria-current')).toBe('page');
        expect(container.querySelector('button')?.classList.contains('active')).toBe(true);
    });

    it('should highlight the button on the profile sub-screens', () => {
        mockPathname.value = '/profiles/work/dns';
        const { container } = renderSwitcher();

        expect(container.querySelector('button')?.getAttribute('aria-current')).toBe('page');
        expect(container.querySelector('button')?.classList.contains('active')).toBe(true);
    });

    it('should not highlight the button on other screens', () => {
        mockPathname.value = '/';
        const { container } = renderSwitcher();

        expect(container.querySelector('button')?.getAttribute('aria-current')).toBeNull();
        expect(container.querySelector('button')?.classList.contains('active')).toBe(false);
    });

    it('should not highlight the button on a path that only shares the profiles prefix', () => {
        mockPathname.value = '/profiles-settings';
        const { container } = renderSwitcher();

        expect(container.querySelector('button')?.getAttribute('aria-current')).toBeNull();
        expect(container.querySelector('button')?.classList.contains('active')).toBe(false);
    });

    it('should open the menu with the profile list and the manage entry', () => {
        const { container } = renderSwitcher();

        expect(container.textContent).not.toContain('settings_profiles_manage');

        fireEvent.click(container.querySelector('button')!);

        expect(container.textContent).toContain('Work');
        expect(container.textContent).toContain('settings_profiles_manage');
        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'profile_selector_settings_click',
            'context_based_screen',
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

        fireEvent.click(getMenuItem(container, 'Work')!);

        await waitFor(() => {
            expect(mockSetActiveProfile).toHaveBeenCalledWith('work');
        });
    });

    it('should not switch to the already active profile', () => {
        const { container } = renderSwitcher();
        fireEvent.click(container.querySelector('button')!);
        mockSendCustomEvent.mockClear();

        fireEvent.click(getMenuItem(container, 'settings_profiles_default_name')!);

        expect(mockSetActiveProfile).not.toHaveBeenCalled();
        expect(mockSendCustomEvent).not.toHaveBeenCalled();
    });

    it('should close the menu before the switch completes', async () => {
        let resolveSwitch: () => void = () => {};
        mockSetActiveProfile.mockImplementationOnce(() => new Promise<void>((resolve) => {
            resolveSwitch = resolve;
        }));

        const { container } = renderSwitcher();
        fireEvent.click(container.querySelector('button')!);

        fireEvent.click(getMenuItem(container, 'Work')!);

        // The switch is still in flight, the menu is already closed.
        expect(container.textContent).not.toContain('settings_profiles_manage');

        resolveSwitch();
        await waitFor(() => {
            expect(mockSetActiveProfile).toHaveBeenCalledWith('work');
        });
    });

    it('should open the profiles screen and notify on manage', () => {
        const onNavigate = vi.fn();
        const { container } = renderSwitcher(onNavigate);
        fireEvent.click(container.querySelector('button')!);

        fireEvent.click(getMenuItem(container, 'settings_profiles_manage')!);

        expect(onNavigate).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/profiles');
        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'manage_profiles_settings_click',
            'context_based_screen',
        );
    });

    it('should not push the profiles screen when it is already open', () => {
        mockPathname.value = '/profiles';
        const onNavigate = vi.fn();
        const { container } = renderSwitcher(onNavigate);
        fireEvent.click(container.querySelector('button')!);

        fireEvent.click(getMenuItem(container, 'settings_profiles_manage')!);

        expect(onNavigate).toHaveBeenCalledTimes(1);
        expect(mockPush).not.toHaveBeenCalled();
    });
});
