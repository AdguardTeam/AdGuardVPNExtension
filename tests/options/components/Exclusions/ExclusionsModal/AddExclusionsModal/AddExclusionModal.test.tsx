import React from 'react';

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    afterEach,
} from 'vitest';
import { render, cleanup } from '@testing-library/react';

const mockAddExclusionModalOpen = vi.hoisted(() => ({ value: true }));
const mockSendPageViewEvent = vi.hoisted(() => vi.fn());

vi.mock('../../../../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => key),
    },
}));

vi.mock('../../../../../../src/options/components/ui/ReactPortal', () => ({
    ReactPortal: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('../../../../../../src/options/stores/ExclusionsStore', () => ({
    AddExclusionMode: { Service: 'Service', Manual: 'Manual' },
}));

vi.mock('../../../../../../src/options/components/Exclusions/ExclusionsModal/AddExclusionsModal/ServiceMode', () => ({
    SERVICE_FORM_ID: 'service-form',
    ServiceMode: () => null,
}));

vi.mock('../../../../../../src/options/components/Exclusions/ExclusionsModal/AddExclusionsModal/ManualMode', () => ({
    MANUAL_FORM_ID: 'manual-form',
    ManualMode: () => null,
}));

vi.mock('../../../../../../src/options/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    const store = {
        exclusionsStore: {
            get addExclusionModalOpen(): boolean {
                return mockAddExclusionModalOpen.value;
            },
            addExclusionMode: 'Service',
            servicesToToggle: [],
            closeAddExclusionModal: vi.fn(),
            setAddExclusionMode: vi.fn(),
        },
        telemetryStore: {
            sendPageViewEvent: mockSendPageViewEvent,
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import {
    AddExclusionModal,
} from '../../../../../../src/options/components/Exclusions/ExclusionsModal/AddExclusionsModal/AddExclusionModal';

describe('AddExclusionModal page view', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAddExclusionModalOpen.value = true;
    });

    afterEach(() => {
        cleanup();
    });

    it('should send the dialog page view event when opened', () => {
        render(<AddExclusionModal />);

        expect(mockSendPageViewEvent).toHaveBeenCalledWith('dialog_add_website_exclusion');
    });

    it('should not send the dialog page view event when closed', () => {
        mockAddExclusionModalOpen.value = false;

        render(<AddExclusionModal />);

        expect(mockSendPageViewEvent).not.toHaveBeenCalled();
    });
});
