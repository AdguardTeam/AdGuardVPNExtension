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

const mockMessenger = vi.hoisted(() => ({
    renameProfile: vi.fn(),
}));

vi.mock('../../../../src/common/messenger', () => ({
    messenger: mockMessenger,
}));

vi.mock('../../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => key),
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
    mockLogError,
} = vi.hoisted(() => ({
    mockGetOptionsData: vi.fn(),
    mockNotifyError: vi.fn(),
    mockNotifySuccess: vi.fn(),
    mockLogError: vi.fn(),
}));

const mockSendCustomEvent = vi.hoisted(() => vi.fn());
const mockSendPageViewEvent = vi.hoisted(() => vi.fn());

vi.mock('../../../../src/common/logger', () => ({
    log: { error: mockLogError },
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
import { ProfileNameValidationResult } from '../../../../src/common/profiles';
// eslint-disable-next-line import/first
import { RenameProfileModal } from '../../../../src/options/components/Profiles/modal/RenameProfileModal';

const PROFILE_ID = 'custom-1';
const CURRENT_NAME = 'Work';

/**
 * Renders the modal with the given profile.
 *
 * @returns Rendered container and the close handler.
 */
function renderModal(): { onClose: Mock; container: HTMLElement } {
    const onClose = vi.fn();
    const { container } = render(
        <RenameProfileModal
            isOpen
            profileId={PROFILE_ID}
            currentName={CURRENT_NAME}
            onClose={onClose}
        />,
    );
    return { onClose, container };
}

/**
 * Submits the given name through the modal form.
 *
 * @param container Rendered container.
 * @param name Name to type.
 */
function submitName(container: HTMLElement, name: string): void {
    const input = container.querySelector('#profile-name') as HTMLInputElement;
    fireEvent.change(input, { target: { value: name } });
    fireEvent.click(
        within(container).getByText('settings_profiles_rename_modal_submit').closest('button')!,
    );
}

/**
 * Returns the action passed to the success snackbar.
 *
 * @returns Snackbar action with its handler.
 */
function getSnackbarAction(): { action: string; handler: () => Promise<void> } {
    const [, snackbarAction] = mockNotifySuccess.mock.calls[0];
    return snackbarAction;
}

/**
 * Renames the profile and waits for the success snackbar.
 *
 * @param container Rendered container.
 */
async function renameAndWaitForSnackbar(container: HTMLElement): Promise<void> {
    submitName(container, 'Home');

    await waitFor(() => {
        expect(mockNotifySuccess).toHaveBeenCalled();
    });
}

describe('RenameProfileModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should show the renamed snackbar with the undo action', async () => {
        mockMessenger.renameProfile.mockResolvedValueOnce({
            result: ProfileNameValidationResult.Ok,
            profileId: PROFILE_ID,
        });
        mockGetOptionsData.mockResolvedValue(undefined);

        const { container } = renderModal();
        await renameAndWaitForSnackbar(container);

        expect(mockNotifySuccess).toHaveBeenCalledWith(
            'profile_name_updated',
            {
                action: 'settings_exclusions_undo',
                handler: expect.any(Function),
            },
        );
    });

    it('should restore the previous name when undo is used', async () => {
        mockMessenger.renameProfile.mockResolvedValueOnce({
            result: ProfileNameValidationResult.Ok,
            profileId: PROFILE_ID,
        });
        mockGetOptionsData.mockResolvedValue(undefined);

        const { container } = renderModal();
        await renameAndWaitForSnackbar(container);

        mockMessenger.renameProfile.mockClear();
        mockGetOptionsData.mockClear();
        mockMessenger.renameProfile.mockResolvedValueOnce({
            result: ProfileNameValidationResult.Ok,
            profileId: PROFILE_ID,
        });

        await getSnackbarAction().handler();

        expect(mockMessenger.renameProfile).toHaveBeenCalledWith(PROFILE_ID, CURRENT_NAME);
        expect(mockGetOptionsData).toHaveBeenCalledWith(true);
        expect(mockNotifyError).not.toHaveBeenCalled();
    });

    it('should report a validation error when the undo is rejected', async () => {
        mockMessenger.renameProfile.mockResolvedValueOnce({
            result: ProfileNameValidationResult.Ok,
            profileId: PROFILE_ID,
        });
        mockGetOptionsData.mockResolvedValue(undefined);

        const { container } = renderModal();
        await renameAndWaitForSnackbar(container);

        mockMessenger.renameProfile.mockClear();
        mockMessenger.renameProfile.mockResolvedValueOnce({
            result: ProfileNameValidationResult.DuplicateName,
        });
        mockGetOptionsData.mockClear();

        await getSnackbarAction().handler();

        expect(mockMessenger.renameProfile).toHaveBeenCalledWith(PROFILE_ID, CURRENT_NAME);
        expect(mockNotifyError).toHaveBeenCalledWith('settings_profiles_error_duplicate_name');
        expect(mockGetOptionsData).not.toHaveBeenCalled();
    });

    it('should report an error when the undo fails', async () => {
        mockMessenger.renameProfile.mockResolvedValueOnce({
            result: ProfileNameValidationResult.Ok,
            profileId: PROFILE_ID,
        });
        mockGetOptionsData.mockResolvedValue(undefined);

        const { container } = renderModal();
        await renameAndWaitForSnackbar(container);

        mockMessenger.renameProfile.mockRejectedValueOnce(new Error('Network error'));

        await getSnackbarAction().handler();

        expect(mockLogError).toHaveBeenCalled();
        expect(mockNotifyError).toHaveBeenCalledWith('Network error');
    });

    it('should send the rename dialog page view and the save click telemetry', async () => {
        mockMessenger.renameProfile.mockResolvedValueOnce({
            result: ProfileNameValidationResult.Ok,
            profileId: PROFILE_ID,
        });
        mockGetOptionsData.mockResolvedValue(undefined);

        const { container } = renderModal();

        expect(mockSendPageViewEvent).toHaveBeenCalledWith('edit_name_profiles_screen');

        submitName(container, 'Home');

        await vi.waitFor(() => {
            expect(mockSendCustomEvent).toHaveBeenCalledWith(
                'save_new_name_profiles_click',
                'edit_name_profiles_screen',
            );
        });
    });
});
