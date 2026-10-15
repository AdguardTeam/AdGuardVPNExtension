import React from 'react';

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    type Mock,
} from 'vitest';
import {
    render,
    fireEvent,
    waitFor,
    within,
} from '@testing-library/react';

const mockPush = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
    useHistory: () => ({ push: mockPush }),
}));

const mockMessenger = vi.hoisted(() => ({
    deleteProfile: vi.fn(),
}));

const mockSendCustomEvent = vi.hoisted(() => vi.fn());
const mockSendPageViewEvent = vi.hoisted(() => vi.fn());

vi.mock('../../../../src/common/messenger', () => ({
    messenger: mockMessenger,
}));

vi.mock('../../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string, params?: Record<string, string>) => (
            params?.profile_name ? `${key}:${params.profile_name}` : key
        )),
        getPlural: vi.fn((key: string) => key),
    },
}));

vi.mock('../../../../src/options/components/ui/ReactPortal', () => ({
    ReactPortal: ({ children }: { children: React.ReactNode }) => children,
}));

const {
    mockGetOptionsData,
    mockNotifyError,
    mockNotifySuccess,
} = vi.hoisted(() => ({
    mockGetOptionsData: vi.fn(),
    mockNotifyError: vi.fn(),
    mockNotifySuccess: vi.fn(),
}));

vi.mock('../../../../src/options/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    const store = {
        globalStore: { getOptionsData: mockGetOptionsData },
        notificationsStore: {
            notifyError: mockNotifyError,
            notifySuccess: mockNotifySuccess,
        },
        telemetryStore: {
            sendCustomEvent: mockSendCustomEvent,
            sendPageViewEvent: mockSendPageViewEvent,
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import { DeleteProfileModal } from '../../../../src/options/components/Profiles/modal/DeleteProfileModal';

const PROFILE_ID = 'custom-1';
const PROFILE_NAME = 'Work';

function renderModal(isActive: boolean): { onClose: Mock; container: HTMLElement } {
    const onClose = vi.fn();
    const { container } = render(
        <DeleteProfileModal
            isOpen
            profileId={PROFILE_ID}
            profileName={PROFILE_NAME}
            isActive={isActive}
            onClose={onClose}
        />,
    );
    return { onClose, container };
}

function submitDeletion(container: HTMLElement): void {
    const submitButton = within(container)
        .getByText('settings_profiles_delete_modal_submit')
        .closest('button')!;
    fireEvent.click(submitButton);
}

describe('DeleteProfileModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should notify that the profile is deleted when it is not active', async () => {
        mockMessenger.deleteProfile.mockResolvedValueOnce(undefined);
        mockGetOptionsData.mockResolvedValueOnce(undefined);

        const { onClose, container } = renderModal(false);
        submitDeletion(container);

        await waitFor(() => {
            expect(mockNotifySuccess).toHaveBeenCalled();
        });

        expect(mockNotifySuccess).toHaveBeenCalledTimes(1);
        expect(mockNotifySuccess).toHaveBeenCalledWith('profile_deleted');
        expect(mockNotifyError).not.toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/profiles');
    });

    it('should notify about the switch to the fallback profile when the active profile is deleted', async () => {
        mockMessenger.deleteProfile.mockResolvedValueOnce(undefined);
        mockGetOptionsData.mockResolvedValueOnce(undefined);

        const { container } = renderModal(true);
        submitDeletion(container);

        await waitFor(() => {
            expect(mockNotifySuccess).toHaveBeenCalled();
        });

        expect(mockNotifySuccess).toHaveBeenCalledTimes(1);
        expect(mockNotifySuccess).toHaveBeenCalledWith(
            'profile_deleted_switched:settings_profiles_default_name',
        );
    });

    it('should show an error notification and stay open when deletion fails', async () => {
        mockMessenger.deleteProfile.mockRejectedValueOnce(new Error('Network error'));

        const { onClose, container } = renderModal(false);
        submitDeletion(container);

        await waitFor(() => {
            expect(mockNotifyError).toHaveBeenCalledWith('Network error');
        });

        expect(mockNotifySuccess).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('should send the delete dialog page view and the delete click telemetry', async () => {
        mockMessenger.deleteProfile.mockResolvedValueOnce(undefined);
        mockGetOptionsData.mockResolvedValueOnce(undefined);

        const { container } = renderModal(false);

        expect(mockSendPageViewEvent).toHaveBeenCalledWith('delete_profiles_screen');

        submitDeletion(container);

        await vi.waitFor(() => {
            expect(mockSendCustomEvent).toHaveBeenCalledWith(
                'delete_profile_click',
                'delete_profiles_screen',
            );
        });
    });
});
