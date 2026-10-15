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

const mockSetActiveProfile = vi.hoisted(() => vi.fn());
const mockSendCustomEvent = vi.hoisted(() => vi.fn());
const mockOnRename = vi.hoisted(() => vi.fn());
const mockOnDelete = vi.hoisted(() => vi.fn());
const mockProfiles = vi.hoisted(() => [] as Array<{ id: string; name: string }>);
const mockActiveProfileId = vi.hoisted(() => ({ value: 'default' }));

vi.mock('../../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => key),
    },
}));

vi.mock('../../../../src/common/profiles', () => ({
    isDefaultProfileId: (profileId: string): boolean => profileId === 'default',
}));

vi.mock('../../../../src/common/components/ActionMenu', () => ({
    ActionMenu: ({ items, onAction }: {
        items: Array<{ value: string; title: React.ReactNode; hidden?: boolean }>;
        onAction: (value: string) => void;
    }) => (
        <div>
            {items
                .filter((item) => !item.hidden)
                .map((item) => (
                    <button
                        key={item.value}
                        type="button"
                        onClick={(): void => onAction(item.value)}
                    >
                        {item.title}
                    </button>
                ))}
        </div>
    ),
}));

vi.mock('../../../../src/options/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    const store = {
        profilesStore: {
            get profiles(): Array<{ id: string; name: string }> {
                return mockProfiles;
            },
            isActive: (profileId: string): boolean => profileId === mockActiveProfileId.value,
            setActiveProfile: mockSetActiveProfile,
            getDisplayName: (profile: { name: string }): string => profile.name,
        },
        telemetryStore: {
            sendCustomEvent: mockSendCustomEvent,
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import { ProfileActions } from '../../../../src/options/components/Profiles/ProfileActions';

/**
 * Renders the actions menu for the given profile.
 *
 * @param profileId Profile to render actions for.
 * @returns Rendered container.
 */
function renderActions(profileId = 'work'): { container: HTMLElement } {
    const { container } = render(
        <ProfileActions
            profileId={profileId}
            onRename={mockOnRename}
            onDelete={mockOnDelete}
        />,
    );
    return { container };
}

/**
 * Returns the rendered action button with the given title.
 *
 * @param container Rendered container.
 * @param title Action title to search for.
 * @returns Button element or undefined.
 */
function getActionButton(container: HTMLElement, title: string): HTMLButtonElement | undefined {
    return Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent?.includes(title));
}

describe('ProfileActions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockProfiles.length = 0;
        mockProfiles.push(
            { id: 'default', name: 'Default' },
            { id: 'work', name: 'Work' },
        );
        mockActiveProfileId.value = 'default';
    });

    afterEach(() => {
        cleanup();
    });

    it('should hide rename and delete actions for the default profile', () => {
        mockActiveProfileId.value = 'work';
        const { container } = renderActions('default');

        expect(getActionButton(container, 'settings_profiles_action_rename')).toBeUndefined();
        expect(getActionButton(container, 'settings_profiles_action_delete')).toBeUndefined();
        expect(getActionButton(container, 'settings_profiles_action_use')).toBeDefined();
    });

    it('should hide the use action for the active profile', () => {
        mockActiveProfileId.value = 'work';
        const { container } = renderActions('work');

        expect(getActionButton(container, 'settings_profiles_action_use')).toBeUndefined();
        expect(getActionButton(container, 'settings_profiles_action_rename')).toBeDefined();
        expect(getActionButton(container, 'settings_profiles_action_delete')).toBeDefined();
    });

    it('should render nothing for an unknown profile', () => {
        const { container } = renderActions('missing');

        expect(container.querySelector('button')).toBeNull();
    });

    it('should switch to the profile on use', () => {
        const { container } = renderActions('work');

        fireEvent.click(getActionButton(container, 'settings_profiles_action_use')!);

        expect(mockSetActiveProfile).toHaveBeenCalledWith('work');
    });

    it('should notify the rename action and send telemetry on rename', () => {
        const { container } = renderActions('work');

        fireEvent.click(getActionButton(container, 'settings_profiles_action_rename')!);

        expect(mockOnRename).toHaveBeenCalledTimes(1);
        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'actions_rename_profile_click',
            'profile_settings_screen',
        );
    });

    it('should notify the delete action and send telemetry on delete', () => {
        const { container } = renderActions('work');

        fireEvent.click(getActionButton(container, 'settings_profiles_action_delete')!);

        expect(mockOnDelete).toHaveBeenCalledTimes(1);
        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'actions_delete_profile_click',
            'profile_settings_screen',
        );
    });
});
