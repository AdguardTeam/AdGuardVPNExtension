import React from 'react';

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
} from 'vitest';
import {
    fireEvent,
    render,
    waitFor,
    within,
} from '@testing-library/react';

const mockExclusionsStore = vi.hoisted(() => ({
    addUrlToExclusions: vi.fn(),
    confirmUrlToAdd: vi.fn(),
    closeAddExclusionModal: vi.fn(),
    restoreExclusions: vi.fn(),
}));

const mockNotificationsStore = vi.hoisted(() => ({
    notifySuccess: vi.fn(),
}));

const mockTelemetryStore = vi.hoisted(() => ({
    sendCustomEvent: vi.fn(),
}));

vi.mock('../../../../../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => key),
    },
}));

vi.mock('../../../../../../../src/options/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    return {
        rootStore: React.createContext({
            exclusionsStore: mockExclusionsStore,
            notificationsStore: mockNotificationsStore,
            telemetryStore: mockTelemetryStore,
        }),
    };
});

// eslint-disable-next-line import/first
import {
    ManualMode,
    MANUAL_FORM_ID,
} from '../../../../../../../src/options/components/Exclusions/ExclusionsModal/AddExclusionsModal/ManualMode/ManualMode';

const typeDomain = (container: HTMLElement, value: string): void => {
    const input = container.querySelector('#domain') as HTMLInputElement;
    fireEvent.change(input, { target: { value } });
};

describe('ManualMode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('adds normalized-valid input without opening confirmation', async () => {
        mockExclusionsStore.addUrlToExclusions.mockResolvedValue(2);

        const { container } = render(<ManualMode isProfileContext={false} />);
        typeDomain(container, 'example.com');

        fireEvent.submit(container.querySelector(`#${MANUAL_FORM_ID}`)!);

        await waitFor(() => {
            expect(mockExclusionsStore.addUrlToExclusions).toHaveBeenCalledWith('example.com');
        });
        expect(mockExclusionsStore.confirmUrlToAdd).not.toHaveBeenCalled();
        expect(mockExclusionsStore.closeAddExclusionModal).toHaveBeenCalled();
    });

    it('shows inline error for hard-invalid input', () => {
        const { container } = render(<ManualMode isProfileContext={false} />);
        typeDomain(container, '*..com');

        fireEvent.submit(container.querySelector(`#${MANUAL_FORM_ID}`)!);

        expect(within(container).getByText('settings_exclusion_invalid_domain')).toBeTruthy();
        expect(mockExclusionsStore.confirmUrlToAdd).not.toHaveBeenCalled();
        expect(mockExclusionsStore.addUrlToExclusions).not.toHaveBeenCalled();
        expect(mockExclusionsStore.closeAddExclusionModal).not.toHaveBeenCalled();
    });

    it('clears inline error when user types again after an invalid submission', () => {
        const { container } = render(<ManualMode isProfileContext={false} />);
        typeDomain(container, '*..com');

        fireEvent.submit(container.querySelector(`#${MANUAL_FORM_ID}`)!);

        expect(within(container).getByText('settings_exclusion_invalid_domain')).toBeTruthy();

        typeDomain(container, 'example.com');

        expect(within(container).queryByText('settings_exclusion_invalid_domain')).toBeNull();
    });

    it('shows inline error for single-label non-suffix input', () => {
        const { container } = render(<ManualMode isProfileContext={false} />);
        typeDomain(container, 'aaaaa');

        fireEvent.submit(container.querySelector(`#${MANUAL_FORM_ID}`)!);

        expect(within(container).getByText('settings_exclusion_invalid_domain')).toBeTruthy();
        expect(mockExclusionsStore.confirmUrlToAdd).not.toHaveBeenCalled();
        expect(mockExclusionsStore.addUrlToExclusions).not.toHaveBeenCalled();
        expect(mockExclusionsStore.closeAddExclusionModal).not.toHaveBeenCalled();
    });

    it('routes TLD-only input to force-add confirmation', () => {
        const { container } = render(<ManualMode isProfileContext={false} />);
        typeDomain(container, '.com');

        fireEvent.submit(container.querySelector(`#${MANUAL_FORM_ID}`)!);

        expect(mockExclusionsStore.confirmUrlToAdd).toHaveBeenCalledWith('.com');
        expect(mockExclusionsStore.addUrlToExclusions).not.toHaveBeenCalled();
        expect(mockExclusionsStore.closeAddExclusionModal).toHaveBeenCalled();
        expect(within(container).queryByText('settings_exclusion_invalid_domain')).toBeNull();
    });

    it('trims whitespace-padded valid input before validating and adding', async () => {
        mockExclusionsStore.addUrlToExclusions.mockResolvedValue(1);

        const { container } = render(<ManualMode isProfileContext={false} />);
        typeDomain(container, '  example.com  ');

        fireEvent.submit(container.querySelector(`#${MANUAL_FORM_ID}`)!);

        await waitFor(() => {
            expect(mockExclusionsStore.addUrlToExclusions).toHaveBeenCalledWith('example.com');
        });
        expect(mockExclusionsStore.closeAddExclusionModal).toHaveBeenCalled();
    });
});
