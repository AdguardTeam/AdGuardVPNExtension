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

const mockQuickConnect = vi.hoisted(() => ({ value: '' }));
const mockLocation = vi.hoisted(() => ({
    value: null as null | { countryName: string; cityName: string },
}));

vi.mock('../../../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => key),
    },
}));

vi.mock('../../../../../src/options/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    const store = {
        profilesStore: {
            get quickConnectCache(): Record<string, string> {
                return { 'profile-1': mockQuickConnect.value };
            },
            get locationCache(): Record<string, unknown> {
                return { 'profile-1': mockLocation.value };
            },
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import { LocationButton } from '../../../../../src/options/components/Profiles/ProfileSettings/LocationButton';

/**
 * Returns the state text rendered by the row.
 *
 * @param container Rendered container.
 *
 * @returns State text.
 */
const getStateText = (container: HTMLElement): string => {
    return container.querySelector('.controls__state')?.textContent ?? '';
};

describe('LocationButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockQuickConnect.value = '';
        mockLocation.value = null;
    });

    afterEach(() => {
        cleanup();
    });

    it('should show the strategy for last used location profiles', () => {
        mockQuickConnect.value = 'lastUsedLocation';
        mockLocation.value = { countryName: 'Germany', cityName: 'Berlin' };

        const { container } = render(
            <LocationButton profileId="profile-1" onClick={vi.fn()} />,
        );

        expect(getStateText(container)).toBe('settings_quick_connect_last_used');
    });

    it('should show the strategy for fastest location profiles', () => {
        mockQuickConnect.value = 'fastestLocation';

        const { container } = render(
            <LocationButton profileId="profile-1" onClick={vi.fn()} />,
        );

        expect(getStateText(container)).toBe('settings_location_fastest_title');
    });

    it('should show the pinned location for specific location profiles', () => {
        mockQuickConnect.value = 'specificLocation';
        mockLocation.value = { countryName: 'Germany', cityName: 'Berlin' };

        const { container } = render(
            <LocationButton profileId="profile-1" onClick={vi.fn()} />,
        );

        expect(getStateText(container)).toBe('Germany, Berlin');
    });
});
