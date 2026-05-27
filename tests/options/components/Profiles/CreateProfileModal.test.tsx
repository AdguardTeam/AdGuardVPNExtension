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
    createProfile: vi.fn(),
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

const { mockGetOptionsData, mockProfiles, mockNotifyError } = vi.hoisted(() => ({
    mockGetOptionsData: vi.fn(),
    mockProfiles: [] as Array<{ id: string; name: string }>,
    mockNotifyError: vi.fn(),
}));

vi.mock('../../../../src/options/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    const store = {
        globalStore: { getOptionsData: mockGetOptionsData },
        profilesStore: { profiles: mockProfiles },
        notificationsStore: { notifyError: mockNotifyError },
        telemetryStore: {
            sendCustomEvent: vi.fn(),
            sendPageViewEvent: vi.fn(),
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import { ProfileNameValidationResult } from '../../../../src/common/profiles';
// eslint-disable-next-line import/first
import { CreateProfileModal } from '../../../../src/options/components/Profiles/modal/CreateProfileModal';

function renderModal(isOpen = true): { onClose: Mock; container: HTMLElement } {
    const onClose = vi.fn();
    const { container } = render(<CreateProfileModal isOpen={isOpen} onClose={onClose} />);
    return { onClose, container };
}

function getSubmitButton(container: HTMLElement): HTMLButtonElement {
    const view = within(container);
    return view.getByText('settings_profiles_create_modal_submit').closest('button')!;
}

function typeInInput(container: HTMLElement, value: string): void {
    const input = container.querySelector('#profile-name') as HTMLInputElement;
    fireEvent.change(input, { target: { value } });
}

describe('CreateProfileModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockProfiles.length = 0;
    });

    it('should render with submit button disabled when input is empty', () => {
        const { container } = renderModal();

        expect(getSubmitButton(container).disabled).toBe(true);
    });

    it('should enable submit button when valid name is entered', () => {
        const { container } = renderModal();

        typeInInput(container, 'Work');

        expect(getSubmitButton(container).disabled).toBe(false);
    });

    it('should show validation error for duplicate name but keep button enabled', async () => {
        const { container } = renderModal();
        typeInInput(container, 'Work');

        mockMessenger.createProfile.mockResolvedValueOnce({
            result: ProfileNameValidationResult.DuplicateName,
        });

        fireEvent.click(getSubmitButton(container));

        await waitFor(() => {
            expect(within(container).getByText('settings_profiles_error_duplicate_name')).toBeTruthy();
        });

        expect(getSubmitButton(container).disabled).toBe(false);
    });

    it('should send only one request on rapid double-click', async () => {
        let resolveCreate: (value: unknown) => void;
        mockMessenger.createProfile.mockImplementation(() => {
            return new Promise((resolve) => {
                resolveCreate = resolve;
            });
        });

        const { container } = renderModal();
        typeInInput(container, 'Test');

        const button = getSubmitButton(container);
        fireEvent.click(button);
        fireEvent.click(button);

        resolveCreate!({
            result: ProfileNameValidationResult.Ok,
            profileId: 'new-id',
        });

        await waitFor(() => {
            expect(mockMessenger.createProfile).toHaveBeenCalledTimes(1);
        });
    });

    it('should call getOptionsData and navigate on success', async () => {
        mockMessenger.createProfile.mockResolvedValueOnce({
            result: ProfileNameValidationResult.Ok,
            profileId: 'new-id',
        });
        mockGetOptionsData.mockResolvedValueOnce(undefined);

        const { onClose, container } = renderModal();
        typeInInput(container, 'Test');

        fireEvent.click(getSubmitButton(container));

        await waitFor(() => {
            expect(mockGetOptionsData).toHaveBeenCalledWith(true);
        });

        expect(onClose).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/profiles/new-id');
    });

    it('should show fallback error message on catch and keep button disabled', async () => {
        mockMessenger.createProfile.mockRejectedValueOnce(new Error('Network error'));

        const { container } = renderModal();
        typeInInput(container, 'Test');

        fireEvent.click(getSubmitButton(container));

        await waitFor(() => {
            expect(mockNotifyError).toHaveBeenCalledWith('Network error');
        });

        expect(getSubmitButton(container).disabled).toBe(false);
    });

    it('should not render content when isOpen is false', () => {
        const { container } = renderModal(false);

        expect(within(container).queryByText('settings_profiles_create_modal_title')).toBeNull();
    });

    it('should clear error when user changes the name', async () => {
        mockMessenger.createProfile.mockResolvedValueOnce({
            result: ProfileNameValidationResult.DuplicateName,
        });

        const { container } = renderModal();
        typeInInput(container, 'Work');

        fireEvent.click(getSubmitButton(container));

        await waitFor(() => {
            expect(within(container).getByText('settings_profiles_error_duplicate_name')).toBeTruthy();
        });

        typeInInput(container, 'Work2');
        expect(within(container).queryByText('settings_profiles_error_duplicate_name')).toBeNull();
        expect(getSubmitButton(container).disabled).toBe(false);
    });
});
