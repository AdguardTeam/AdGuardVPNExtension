import React from 'react';

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
} from 'vitest';
import { render, fireEvent } from '@testing-library/react';

const mockPush = vi.hoisted(() => vi.fn());
const mockProfiles = vi.hoisted(() => [] as Array<{ id: string; name: string }>);
const mockExclusionsProfileId = vi.hoisted(() => ({ value: undefined as string | undefined }));
const mockSendCustomEvent = vi.hoisted(() => vi.fn());
const mockSendPageViewEvent = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
    useHistory: () => ({ push: mockPush }),
}));

vi.mock('../../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => key),
    },
}));

vi.mock('../../../../src/common/reactTranslator', () => ({
    reactTranslator: {
        getMessage: vi.fn((_key: string, params?: Record<string, unknown>) => {
            const profileName = (params as Record<string, string>)?.profile_name || '';
            return (
                <>
                    Applies to your
                    <b>{profileName}</b>
                    {' '}
                    profile
                </>
            );
        }),
    },
}));

vi.mock('../../../../src/options/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    const store = {
        exclusionsStore: {
            currentMode: 'regular',
            exclusionsTree: { children: [] },
            exclusionsSearchValue: '',
            modeSelectorModalOpen: false,
            addExclusionModalOpen: false,
            removeAllModalOpen: false,
            selectedExclusion: null,
            confirmAddModalOpen: false,
            selectListModalOpen: false,
            servicesToToggle: [],
            servicesSearchValue: '',
            unfoldedServiceCategories: [],
            addSubdomainModalOpen: false,
            resetServiceModalOpen: false,
            urlToConfirm: undefined as string | undefined,
            addExclusionMode: 'Service',
            importingExclusions: false,
            get preparedExclusions(): Array<unknown> {
                return [];
            },
            get profileId(): string | undefined {
                return mockExclusionsProfileId.value;
            },
            resetUiState: vi.fn(),
            setModeSelectorModalOpen: vi.fn(),
            openAddExclusionModal: vi.fn(),
            setExclusionsSearchValue: vi.fn(),
        },
        profilesStore: {
            get profiles(): Array<{ id: string; name: string }> {
                return mockProfiles;
            },
            get activeProfileId(): string {
                return 'profile-1';
            },
            getDisplayName: vi.fn((p: { id: string; name: string }) => p.name),
        },
        telemetryStore: {
            sendCustomEvent: mockSendCustomEvent,
            sendPageViewEvent: mockSendPageViewEvent,
        },
        settingsStore: {
            isPremiumToken: false,
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import { Exclusions } from '../../../../src/options/components/Exclusions/Exclusions';

function renderExclusions(): { container: HTMLElement } {
    const { container } = render(<Exclusions />);
    return { container };
}

describe('Exclusions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockProfiles.length = 0;
        mockExclusionsProfileId.value = undefined;
    });

    it('should render ProfileHint for a non-active profile', () => {
        mockProfiles.push(
            { id: 'profile-1', name: 'Default' },
            { id: 'profile-2', name: 'Work' },
        );
        mockExclusionsProfileId.value = 'profile-2';
        const { container } = renderExclusions();
        const hint = container.querySelector('.profile-hint');
        expect(hint).not.toBeNull();
        expect(hint!.textContent).toContain('Work');
    });

    it('should not render ProfileHint for the active profile', () => {
        mockProfiles.push(
            { id: 'profile-1', name: 'Default' },
            { id: 'profile-2', name: 'Work' },
        );
        const { container } = renderExclusions();
        const hint = container.querySelector('.profile-hint');
        expect(hint).toBeNull();
    });

    it('should not render ProfileHint when profiles <= 1', () => {
        mockProfiles.push({ id: 'profile-1', name: 'Default' });
        const { container } = renderExclusions();
        const hint = container.querySelector('.profile-hint');
        expect(hint).toBeNull();
    });

    it('should navigate to the profile route and send applies_to_profile_click on ProfileHint click', () => {
        mockProfiles.push(
            { id: 'profile-1', name: 'Default' },
            { id: 'profile-2', name: 'Work' },
        );
        mockExclusionsProfileId.value = 'profile-2';
        const { container } = renderExclusions();
        const button = container.querySelector('.profile-hint--interactive');
        expect(button).not.toBeNull();
        fireEvent.click(button!);

        expect(mockPush).toHaveBeenCalledWith('/profiles/profile-2');
        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'applies_to_profile_click',
            'exclusions_screen',
        );
    });

    it('should send the exclusions page view event', () => {
        renderExclusions();

        expect(mockSendPageViewEvent).toHaveBeenCalledWith('exclusions_screen');
    });
});
