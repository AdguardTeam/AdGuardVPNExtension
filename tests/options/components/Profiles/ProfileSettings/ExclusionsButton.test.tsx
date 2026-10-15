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

const mockPush = vi.hoisted(() => vi.fn());
const mockSendCustomEvent = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
    useHistory: () => ({ push: mockPush }),
    useLocation: () => ({ pathname: '/profiles/profile-1' }),
}));

vi.mock('../../../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => key),
    },
}));

vi.mock('../../../../../src/common/components/Icons', () => ({
    IconButton: () => null,
}));

vi.mock('../../../../../src/options/stores', () => {
    const React = require('react'); // eslint-disable-line global-require

    const store = {
        profilesStore: {
            exclusionsCache: { 'profile-1': { currentMode: 'regular' } },
        },
        telemetryStore: {
            sendCustomEvent: mockSendCustomEvent,
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import { ExclusionsButton } from '../../../../../src/options/components/Profiles/ProfileSettings/ExclusionsButton';
// eslint-disable-next-line import/first
import { TelemetryScreenName } from '../../../../../src/background/telemetry/telemetryEnums';

describe('ExclusionsButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('should send the exclusions settings click telemetry and navigate on click', () => {
        const { container } = render(
            <ExclusionsButton
                profileId="profile-1"
                telemetryScreenName={TelemetryScreenName.ProfileSettingsScreen}
            />,
        );

        fireEvent.click(container.querySelector('.controls')!);

        expect(mockSendCustomEvent).toHaveBeenCalledWith(
            'exclusions_settings_click',
            'profile_settings_screen',
        );
        expect(mockPush).toHaveBeenCalledWith(
            '/profiles/profile-1/exclusions?from=%2Fprofiles%2Fprofile-1',
        );
    });
});
