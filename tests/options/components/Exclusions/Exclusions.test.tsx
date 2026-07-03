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

vi.mock('../../../../src/common/telemetry/useTelemetryPageViewEvent', () => ({
    useTelemetryPageViewEvent: vi.fn(),
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
            sendCustomEvent: vi.fn(),
            sendPageViewEvent: vi.fn(),
        },
        settingsStore: {
            isPremiumToken: false,
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import { Exclusions } from '../../../../src/options/components/Exclusions/Exclusions';

function renderExclusions(props: { isProfileContext?: boolean } = {}): {
    container: HTMLElement;
} {
    const { container } = render(
        <Exclusions isProfileContext={props.isProfileContext ?? false} />,
    );
    return { container };
}

describe('Exclusions ProfileHint', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockProfiles.length = 0;
        mockExclusionsProfileId.value = undefined;
    });

    describe('General context (isProfileContext=false)', () => {
        it('should render ProfileHint when profiles > 1', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderExclusions({ isProfileContext: false });
            const hint = container.querySelector('.profile-hint');
            expect(hint).not.toBeNull();
        });

        it('should not render ProfileHint when profiles <= 1', () => {
            mockProfiles.push({ id: 'profile-1', name: 'Default' });
            const { container } = renderExclusions({ isProfileContext: false });
            const hint = container.querySelector('.profile-hint');
            expect(hint).toBeNull();
        });

        it('should navigate to profile exclusions route on ProfileHint click', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderExclusions({ isProfileContext: false });
            // After implementation, ProfileHint renders as button with class
            // "profile-hint profile-hint--interactive"
            const button = container.querySelector('.profile-hint--interactive');
            expect(button).not.toBeNull();
            fireEvent.click(button!);
            // exclusionsStore.profileId is undefined in General context,
            // so ProfileHint falls back to activeProfileId ('profile-1')
            expect(mockPush).toHaveBeenCalledWith('/profiles/profile-1');
        });
    });

    describe('Profile context (isProfileContext=true)', () => {
        it('should not render ProfileHint even with 2+ profiles', () => {
            mockProfiles.push(
                { id: 'profile-1', name: 'Default' },
                { id: 'profile-2', name: 'Work' },
            );
            const { container } = renderExclusions({ isProfileContext: true });
            const hint = container.querySelector('.profile-hint');
            expect(hint).toBeNull();
        });
    });
});
