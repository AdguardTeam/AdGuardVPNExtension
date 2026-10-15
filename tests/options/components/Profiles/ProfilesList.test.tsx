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
const mockSendPageViewEvent = vi.hoisted(() => vi.fn());
const mockProfiles = vi.hoisted(() => [] as Array<{ id: string; name: string }>);
const mockActiveProfileId = vi.hoisted(() => ({ value: 'default' }));

vi.mock('../../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => key),
    },
}));

vi.mock('react-router-dom', () => ({
    Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('../../../../src/common/components/Icons', () => ({
    Icon: () => null,
}));

vi.mock('../../../../src/common/components/Radio', () => ({
    Radio: ({ value, title, onSelect }: {
        value: string;
        title: React.ReactNode;
        onSelect: (value: string) => void;
    }) => (
        <button
            type="button"
            data-testid={`radio-${value}`}
            onClick={(): void => onSelect(value)}
        >
            {title}
        </button>
    ),
}));

vi.mock('../../../../src/options/components/Profiles/modal/CreateProfileModal', () => ({
    CreateProfileModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
        isOpen
            ? <button type="button" data-testid="create-modal" onClick={onClose}>close</button>
            : null
    ),
}));

vi.mock('../../../../src/options/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    const store = {
        profilesStore: {
            get profiles(): Array<{ id: string; name: string }> {
                return mockProfiles;
            },
            get activeProfileId(): string {
                return mockActiveProfileId.value;
            },
            isSwitchingProfile: false,
            isActive: (profileId: string): boolean => profileId === mockActiveProfileId.value,
            setActiveProfile: mockSetActiveProfile,
            getDisplayName: (profile: { name: string }): string => profile.name,
        },
        telemetryStore: {
            sendCustomEvent: mockSendCustomEvent,
            sendPageViewEvent: mockSendPageViewEvent,
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import { ProfilesList } from '../../../../src/options/components/Profiles/ProfilesList';

describe('ProfilesList', () => {
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

    it('should send the manage profiles page view event', () => {
        render(<ProfilesList />);

        expect(mockSendPageViewEvent).toHaveBeenCalledWith('manage_profiles_screen');
    });

    it('should send the create profile telemetry and open the modal', () => {
        const { container, getByText } = render(<ProfilesList />);

        fireEvent.click(getByText('settings_profiles_create'));

        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'create_profile_click',
            'manage_profiles_screen',
        );
        expect(container.querySelector('[data-testid="create-modal"]')).not.toBeNull();
    });

    it('should switch the profile on selecting another profile', () => {
        const { getByTestId } = render(<ProfilesList />);

        fireEvent.click(getByTestId('radio-work'));

        expect(mockSetActiveProfile).toHaveBeenCalledWith('work');
    });

    it('should not switch the profile when the active profile is re-selected', () => {
        const { getByTestId } = render(<ProfilesList />);

        fireEvent.click(getByTestId('radio-default'));

        expect(mockSendCustomEvent).not.toHaveBeenCalled();
    });

    it('should re-send the page view event when the create dialog closes', () => {
        const { getByText, getByTestId } = render(<ProfilesList />);

        expect(mockSendPageViewEvent).toHaveBeenCalledTimes(1);

        fireEvent.click(getByText('settings_profiles_create'));
        expect(mockSendPageViewEvent).toHaveBeenCalledTimes(1);

        fireEvent.click(getByTestId('create-modal'));
        expect(mockSendPageViewEvent).toHaveBeenCalledTimes(2);
        expect(mockSendPageViewEvent).toHaveBeenLastCalledWith('manage_profiles_screen');
    });
});
