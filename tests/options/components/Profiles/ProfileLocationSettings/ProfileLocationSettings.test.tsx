import React from 'react';

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
} from 'vitest';
import { render } from '@testing-library/react';

const mockPush = vi.hoisted(() => vi.fn());
const mockProfiles = vi.hoisted(() => [] as Array<{ id: string; name: string }>);
const mockLocations = vi.hoisted(() => [] as Array<{
    id: string; countryName: string; cityName: string; available: boolean; premiumOnly: boolean;
}>);

vi.mock('react-router-dom', () => ({
    useHistory: () => ({ push: mockPush }),
    useParams: () => ({ id: 'profile-2' }),
    Redirect: () => null,
}));

vi.mock('../../../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => key),
    },
}));

vi.mock('../../../../../src/common/reactTranslator', () => ({
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

vi.mock('../../../../../src/common/messenger', () => ({
    messenger: {
        setCurrentLocation: vi.fn(),
    },
}));

vi.mock('../../../../../src/options/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    const store = {
        profilesStore: {
            get profiles(): Array<{ id: string; name: string }> {
                return mockProfiles;
            },
            quickConnectCache: {} as Record<string, string>,
            locationCache: {} as Record<string, { id: string }>,
            getDisplayName: vi.fn((p: { id: string; name: string }) => p.name),
            updateQuickConnectCache: vi.fn(),
        },
        settingsStore: {
            get locations(): Array<{
                id: string; countryName: string; cityName: string; available: boolean; premiumOnly: boolean;
            }> {
                return mockLocations;
            },
            isPremiumToken: false,
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import {
    ProfileLocationSettings,
} from '../../../../../src/options/components/Profiles/ProfileLocationSettings/ProfileLocationSettings';

function renderComponent(): { container: HTMLElement } {
    const { container } = render(<ProfileLocationSettings />);
    return { container };
}

describe('ProfileLocationSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockProfiles.length = 0;
        mockLocations.length = 0;
    });

    it('should not render ProfileHint in title subtitle', () => {
        mockProfiles.push(
            { id: 'profile-1', name: 'Default' },
            { id: 'profile-2', name: 'Work' },
        );
        const { container } = renderComponent();
        const hint = container.querySelector('.profile-hint');
        expect(hint).toBeNull();
    });
});
