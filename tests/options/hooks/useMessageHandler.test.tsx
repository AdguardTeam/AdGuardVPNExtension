import React from 'react';

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
} from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const mockSetPremiumFeatures = vi.hoisted(() => vi.fn());
const mockSetIsHelpUsImproveEnabled = vi.hoisted(() => vi.fn());
const mockSetLocations = vi.hoisted(() => vi.fn());

/**
 * Captured notifier callback and subscribed events registered by the hook
 * through the messenger.
 */
const capturedListener = vi.hoisted(() => ({
    callback: null as null | ((message: unknown) => void),
    events: null as null | string[],
}));

vi.mock('../../../src/common/messenger', () => ({
    messenger: {
        createEventListener: vi.fn(async (events: string[], callback: (message: unknown) => void) => {
            capturedListener.callback = callback;
            capturedListener.events = events;
            return vi.fn();
        }),
    },
}));

vi.mock('../../../src/options/stores', () => {
    const store = {
        authStore: {
            setIsAuthenticated: vi.fn(),
        },
        settingsStore: {
            setPremiumFeatures: mockSetPremiumFeatures,
            updateCurrentUsername: vi.fn(),
            setSelectedLanguage: vi.fn(),
            setLocations: mockSetLocations,
        },
        globalStore: {
            getOptionsData: vi.fn(),
        },
        exclusionsStore: {
            updateExclusionsData: vi.fn(),
        },
        telemetryStore: {
            setIsHelpUsImproveEnabled: mockSetIsHelpUsImproveEnabled,
        },
        translationStore: {
            setLocalePreference: vi.fn(),
        },
        profilesStore: {
            updateLocationCache: vi.fn(),
            handleProfileChanged: vi.fn(),
            startSwitchingProfile: vi.fn(),
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import { useMessageHandler } from '../../../src/options/hooks/useMessageHandler';
// eslint-disable-next-line import/first
import { notifier } from '../../../src/common/notifier';
// eslint-disable-next-line import/first
import { SETTINGS_IDS } from '../../../src/common/constants';

/**
 * Renders the hook and waits until it subscribes to the background notifications.
 */
async function renderAndWaitForSubscription(): Promise<void> {
    renderHook(() => useMessageHandler());

    await waitFor(() => {
        expect(capturedListener.callback).not.toBeNull();
    });
}

describe('useMessageHandler settings updates', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        capturedListener.callback = null;
        capturedListener.events = null;
    });

    it('should apply the premium promo visibility changed in another options tab', async () => {
        await renderAndWaitForSubscription();

        capturedListener.callback?.({
            type: notifier.types.SETTING_UPDATED,
            data: SETTINGS_IDS.PREMIUM_FEATURES_SHOW,
            value: false,
        });

        expect(mockSetPremiumFeatures).toHaveBeenCalledWith(false);
    });

    it('should ignore setting updates that do not affect the options page', async () => {
        await renderAndWaitForSubscription();

        capturedListener.callback?.({
            type: notifier.types.SETTING_UPDATED,
            data: SETTINGS_IDS.PROXY_ENABLED,
            value: false,
        });

        expect(mockSetPremiumFeatures).not.toHaveBeenCalled();
    });

    it('should keep applying the help us improve visibility', async () => {
        await renderAndWaitForSubscription();

        capturedListener.callback?.({
            type: notifier.types.SETTING_UPDATED,
            data: SETTINGS_IDS.HELP_US_IMPROVE,
            value: true,
        });

        expect(mockSetIsHelpUsImproveEnabled).toHaveBeenCalledWith(true);
        expect(mockSetPremiumFeatures).not.toHaveBeenCalled();
    });

    it('should refresh the locations list and subscribe to locations updates', async () => {
        await renderAndWaitForSubscription();

        const locations = [{
            id: 'location-1',
            countryName: 'Germany',
            cityName: 'Berlin',
        }];

        expect(capturedListener.events).toContain(notifier.types.LOCATIONS_UPDATED);

        capturedListener.callback?.({
            type: notifier.types.LOCATIONS_UPDATED,
            data: locations,
        });

        expect(mockSetLocations).toHaveBeenCalledWith(locations);
    });
});
