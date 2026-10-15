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

vi.mock('../../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => {
            if (key === 'settings_profiles_manage') {
                return 'Manage profiles';
            }
            return key;
        }),
    },
}));

// eslint-disable-next-line import/first
import { ProfileMenu } from '../../../../src/common/components/ProfileMenu';

const PROFILES = [
    { id: 'profile-1', name: 'Default' },
    { id: 'profile-2', name: 'Work' },
];

/**
 * Renders the menu with the given handlers.
 */
function renderMenu(props: { activeProfileId?: string; className?: string } = {}): {
    container: HTMLElement;
    onSelect: ReturnType<typeof vi.fn>;
    onManage: ReturnType<typeof vi.fn>;
} {
    const onSelect = vi.fn();
    const onManage = vi.fn();

    const { container } = render(
        <ProfileMenu
            className={props.className}
            profiles={PROFILES}
            activeProfileId={props.activeProfileId ?? 'profile-1'}
            onSelect={onSelect}
            onManage={onManage}
        />,
    );

    return { container, onSelect, onManage };
}

describe('ProfileMenu', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('should render all profiles', () => {
        const { container } = renderMenu();

        expect(container.textContent).toContain('Default');
        expect(container.textContent).toContain('Work');
    });

    it('should apply the class name passed by the consumer', () => {
        const { container } = renderMenu({ className: 'custom-menu-class' });

        const root = container.firstElementChild as HTMLElement;

        expect(root.classList.contains('custom-menu-class')).toBe(true);
    });

    it('should mark the active profile with a tick', () => {
        const { container } = renderMenu({ activeProfileId: 'profile-2' });

        const items = Array.from(container.querySelectorAll('button'));
        const activeItem = items.find((item) => item.textContent?.includes('Work'));
        const inactiveItem = items.find((item) => item.textContent?.includes('Default'));

        expect(activeItem?.querySelector('use')?.getAttribute('xlink:href')).toBe('#tick');
        expect(inactiveItem?.querySelector('use')).toBeNull();
    });

    it('should select a profile on click', () => {
        const { container, onSelect } = renderMenu();

        const items = Array.from(container.querySelectorAll('button'));
        const workItem = items.find((item) => item.textContent?.includes('Work'));

        fireEvent.click(workItem!);

        expect(onSelect).toHaveBeenCalledWith('profile-2');
    });

    it('should render the manage profiles button and handle clicks', () => {
        const { container, onManage } = renderMenu();

        expect(container.textContent).toContain('Manage profiles');

        const manageButton = Array.from(container.querySelectorAll('button'))
            .find((item) => item.textContent?.includes('Manage profiles'));

        fireEvent.click(manageButton!);

        expect(onManage).toHaveBeenCalledTimes(1);
    });
});
