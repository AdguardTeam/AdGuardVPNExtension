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

const mockSendCustomEvent = vi.hoisted(() => vi.fn());
const mockOpenRemoveAllModal = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('../../../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => key),
    },
}));

vi.mock('../../../../../src/common/components/Select', () => ({
    Select: ({ options, onChange }: {
        options: Array<{ value: string; title: React.ReactNode; shouldSkip?: boolean }>;
        onChange: (value: string) => void;
    }) => (
        <div>
            {options
                .filter((option) => !option.shouldSkip)
                .map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={(): void => onChange(option.value)}
                    >
                        {option.title}
                    </button>
                ))}
        </div>
    ),
}));

vi.mock('../../../../../src/options/components/Exclusions/Actions/SelectListModal', () => ({
    SelectListModal: () => null,
}));

vi.mock('../../../../../src/options/components/Exclusions/Actions/RemoveAllModal', () => ({
    RemoveAllModal: () => null,
}));

vi.mock('../../../../../src/common/messenger', () => ({
    messenger: {
        getGeneralExclusions: vi.fn().mockResolvedValue('general'),
        getSelectiveExclusions: vi.fn().mockResolvedValue('selective'),
        addRegularExclusions: vi.fn(),
        addSelectiveExclusions: vi.fn(),
    },
}));

vi.mock('file-saver', () => ({
    default: { saveAs: vi.fn() },
}));

vi.mock('../../../../../src/options/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    const store = {
        exclusionsStore: {
            selectListModalOpen: false,
            isAllExclusionsListsEmpty: false,
            isCurrentModeExclusionsListEmpty: false,
            importingExclusions: false,
            effectiveProfileId: 'profile-1',
            closeSelectListModal: vi.fn(),
            openSelectListModal: vi.fn(),
            openRemoveAllModal: mockOpenRemoveAllModal,
            restoreExclusions: vi.fn(),
            updateExclusionsData: vi.fn(),
            setImportingExclusions: vi.fn(),
        },
        notificationsStore: {
            notifySuccess: vi.fn(),
            notifyError: vi.fn(),
        },
        telemetryStore: {
            sendCustomEvent: mockSendCustomEvent,
            sendPageViewEvent: vi.fn(),
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import { Actions } from '../../../../../src/options/components/Exclusions/Actions/Actions';

/**
 * Renders the actions menu.
 *
 * @returns Rendered helpers.
 */
function renderActions(): { getByText: (text: string) => HTMLElement } {
    const { getByText } = render(<Actions />);
    return { getByText };
}

describe('Exclusions Actions telemetry', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('should send the export exclusions telemetry', async () => {
        const { getByText } = renderActions();

        fireEvent.click(getByText('settings_exclusions_action_export'));

        await vi.waitFor(() => {
            expect(mockSendCustomEvent).toHaveBeenCalledWith(
                'actions_export_exclusions_click',
                'exclusions_screen',
            );
        });
    });

    it('should send the import exclusions telemetry', () => {
        const { getByText } = renderActions();

        fireEvent.click(getByText('settings_exclusions_action_import'));

        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'actions_import_exclusions_click',
            'exclusions_screen',
        );
    });

    it('should send the remove exclusions telemetry and open the confirmation dialog', () => {
        const { getByText } = renderActions();

        fireEvent.click(getByText('settings_exclusions_action_remove_all'));

        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'actions_remove_exclusions_click',
            'exclusions_screen',
        );
        expect(mockOpenRemoveAllModal).toHaveBeenCalled();
    });
});
