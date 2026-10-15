import React from 'react';

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
} from 'vitest';
import { render } from '@testing-library/react';

import { AppearanceTheme } from '../../../../src/common/constants';
import { RequestStatus } from '../../../../src/options/stores/consts';
import { App } from '../../../../src/options/components/App/App';

vi.mock('../../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => key),
        getPlural: vi.fn((key: string, count: number) => `${key}:${count}`),
    },
}));

/**
 * Authentication state of the mocked auth store.
 */
const mockAuth = vi.hoisted(() => ({ authenticated: true }));

vi.mock('../../../../src/options/stores', () => {
    const store = {
        authStore: {
            get authenticated(): boolean {
                return mockAuth.authenticated;
            },
            requestProcessState: RequestStatus.Done,
        },
        settingsStore: {
            isPremiumToken: false,
            premiumFeatures: true,
            appearanceTheme: AppearanceTheme.System,
        },
        globalStore: {
            status: RequestStatus.Done,
            init: vi.fn().mockResolvedValue(undefined),
        },
        uiStore: {
            isContentLocked: false,
        },
        telemetryStore: {
            sendCustomEvent: vi.fn(),
            sendPageViewEvent: vi.fn(),
            removeOpenedPage: vi.fn(),
        },
        dnsStore: {
            openCustomDnsModal: vi.fn(),
            setDnsServerName: vi.fn(),
            setDnsServerAddress: vi.fn(),
        },
    };

    return { rootStore: React.createContext(store) };
});

vi.mock('../../../../src/common/messenger', () => ({
    messenger: {
        createEventListener: vi.fn().mockResolvedValue(vi.fn()),
    },
}));

// The screens are not the subject of this test: they are stubbed out so that
// the test only verifies which settings tabs render the selling block.
vi.mock('../../../../src/options/components/Sidebar', () => ({ Sidebar: () => null }));
vi.mock('../../../../src/options/components/General/General', () => ({ General: () => null }));
vi.mock('../../../../src/options/components/Account', () => ({ Account: () => null }));
vi.mock('../../../../src/options/components/Support', () => ({ Support: () => null }));
vi.mock('../../../../src/options/components/About', () => ({ About: () => null }));
vi.mock('../../../../src/options/components/FreeGbs', () => ({ FreeGbs: () => null }));
vi.mock('../../../../src/options/components/Exclusions', () => ({ Exclusions: () => null }));
vi.mock('../../../../src/options/components/Profiles', () => ({ Profiles: () => null }));
vi.mock('../../../../src/options/components/Profiles/ProfileDetail', () => ({ ProfileDetail: () => null }));
vi.mock('../../../../src/options/components/Profiles/ProfileExclusions', () => ({ ProfileExclusions: () => null }));
vi.mock('../../../../src/options/components/Profiles/ProfileDnsSettings', () => ({ ProfileDnsSettings: () => null }));
vi.mock('../../../../src/options/components/Profiles/ProfileLocationSettings', () => ({ ProfileLocationSettings: () => null }));
vi.mock('../../../../src/options/components/ui/Notifications', () => ({ Notifications: () => null }));

/**
 * Title of the selling block (the translator is mocked, so the message key is rendered).
 */
const SELLING_BLOCK_TITLE = 'settings_unlimited_promo_title';

/**
 * Paths of the options tabs the block is displayed on.
 */
const TAB_PATHS = [
    '/',
    '/account',
    '/support',
    '/about',
    '/free-gbs',
    '/profiles',
    '/exclusions',
];

/**
 * Renders the options page opened at the given path.
 *
 * @param path Path of the options screen.
 * @returns Rendered container.
 */
function renderOptionsPage(path: string): HTMLElement {
    window.location.hash = `#${path}`;

    const { container } = render(<App />);

    return container;
}

describe('App selling block', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuth.authenticated = true;
    });

    it.each(TAB_PATHS)('should render the selling block on the "%s" screen', (path) => {
        const container = renderOptionsPage(path);

        expect(container.textContent).toContain(SELLING_BLOCK_TITLE);
    });

    it('should not render the selling block when the user is not authenticated', () => {
        mockAuth.authenticated = false;

        const container = renderOptionsPage('/');

        expect(container.textContent).not.toContain(SELLING_BLOCK_TITLE);
    });
});
