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

const mockSendPageViewEvent = vi.hoisted(() => vi.fn());
const mockProfiles = vi.hoisted(() => [] as Array<{ id: string; name: string }>);

vi.mock('react-router-dom', () => ({
    Redirect: () => null,
    useHistory: () => ({ push: vi.fn() }),
    useParams: () => ({ id: 'work' }),
}));

vi.mock('../../../../src/options/components/Profiles/ProfileActions', () => ({
    ProfileActions: ({ onRename, onDelete }: {
        onRename: () => void;
        onDelete: () => void;
    }) => (
        <div data-testid="profile-actions">
            <button type="button" data-testid="rename-action" onClick={onRename}>rename</button>
            <button type="button" data-testid="delete-action" onClick={onDelete}>delete</button>
        </div>
    ),
}));

vi.mock('../../../../src/options/components/Profiles/modal/RenameProfileModal', () => ({
    RenameProfileModal: ({ isOpen, onClose }: {
        isOpen: boolean;
        onClose: () => void;
    }) => (
        isOpen ? <button type="button" data-testid="rename-modal-close" onClick={onClose}>close</button> : null
    ),
}));

vi.mock('../../../../src/options/components/Profiles/modal/DeleteProfileModal', () => ({
    DeleteProfileModal: ({ isOpen, onClose }: {
        isOpen: boolean;
        onClose: () => void;
    }) => (
        isOpen ? <button type="button" data-testid="delete-modal-close" onClick={onClose}>close</button> : null
    ),
}));

vi.mock('../../../../src/options/components/Profiles/ProfileSettings', () => ({
    ProfileSettings: () => <div data-testid="profile-settings" />,
}));

vi.mock('../../../../src/options/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    const store = {
        profilesStore: {
            get profiles(): Array<{ id: string; name: string }> {
                return mockProfiles;
            },
            getDisplayName: (profile: { name: string }): string => profile.name,
            isActive: (profileId: string): boolean => profileId === 'work',
        },
        telemetryStore: {
            sendPageViewEvent: mockSendPageViewEvent,
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import { ProfileDetail } from '../../../../src/options/components/Profiles/ProfileDetail/ProfileDetail';

describe('ProfileDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockProfiles.length = 0;
    });

    afterEach(() => {
        cleanup();
    });

    it('should send the profile settings page view event', () => {
        mockProfiles.push({ id: 'work', name: 'Work' });

        render(<ProfileDetail />);

        expect(mockSendPageViewEvent).toHaveBeenCalledWith('profile_settings_screen');
    });

    it('should not send the page view event when the profile is missing', () => {
        render(<ProfileDetail />);

        expect(mockSendPageViewEvent).not.toHaveBeenCalled();
    });

    it('should re-send the page view event when the rename dialog closes', () => {
        mockProfiles.push({ id: 'work', name: 'Work' });
        const { getByTestId } = render(<ProfileDetail />);

        expect(mockSendPageViewEvent).toHaveBeenCalledTimes(1);

        fireEvent.click(getByTestId('rename-action'));
        expect(mockSendPageViewEvent).toHaveBeenCalledTimes(1);

        fireEvent.click(getByTestId('rename-modal-close'));
        expect(mockSendPageViewEvent).toHaveBeenCalledTimes(2);
        expect(mockSendPageViewEvent).toHaveBeenLastCalledWith('profile_settings_screen');
    });

    it('should re-send the page view event when the delete dialog closes', () => {
        mockProfiles.push({ id: 'work', name: 'Work' });
        const { getByTestId } = render(<ProfileDetail />);

        fireEvent.click(getByTestId('delete-action'));
        expect(mockSendPageViewEvent).toHaveBeenCalledTimes(1);

        fireEvent.click(getByTestId('delete-modal-close'));
        expect(mockSendPageViewEvent).toHaveBeenCalledTimes(2);
        expect(mockSendPageViewEvent).toHaveBeenLastCalledWith('profile_settings_screen');
    });
});
