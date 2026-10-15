import React from 'react';
import { MemoryRouter, useHistory } from 'react-router-dom';

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
} from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => key),
        getPlural: vi.fn((key: string, count: number) => `${key}:${count}`),
    },
}));

const mockOpenPremiumPromoPageFromSettings = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockHidePremiumFeatures = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockSendCustomEvent = vi.hoisted(() => vi.fn());

/**
 * Mutable settings store state shared across tests.
 */
const mockSettings = {
    isPremiumToken: false,
    premiumFeatures: true,
};

vi.mock('../../../../src/options/stores', () => {
    const store = {
        settingsStore: {
            get isPremiumToken(): boolean {
                return mockSettings.isPremiumToken;
            },
            get premiumFeatures(): boolean {
                return mockSettings.premiumFeatures;
            },
            openPremiumPromoPageFromSettings: mockOpenPremiumPromoPageFromSettings,
            hidePremiumFeatures: mockHidePremiumFeatures,
        },
        telemetryStore: {
            sendCustomEvent: mockSendCustomEvent,
        },
    };

    return { rootStore: React.createContext(store) };
});

// eslint-disable-next-line import/first
import { UnlimitedPromo } from '../../../../src/options/components/UnlimitedPromo/UnlimitedPromo';
// eslint-disable-next-line import/first
import { TelemetryActionName, TelemetryScreenName } from '../../../../src/background/telemetry/telemetryEnums';
// eslint-disable-next-line import/first
import { POTENTIAL_DEVICE_NUM, UNLIMITED_LOCATIONS_COUNT } from '../../../../src/common/components/constants';

/**
 * Class of the shared Button component rendered as the upgrade button.
 */
const UPGRADE_BUTTON_SELECTOR = '.button';

/**
 * Class of the shared IconButton component rendered as the close button.
 */
const CLOSE_BUTTON_SELECTOR = '.icon-button';

/**
 * Selector of the control that switches the settings tab.
 */
const SWITCH_TAB_SELECTOR = '[data-testid="switch-tab"]';

/**
 * Renders the control that switches the settings tab.
 *
 * @param to Path to navigate to.
 *
 * @returns React element with the tab switcher.
 */
const TabSwitcher = ({ to }: { to: string }): React.ReactElement => {
    const history = useHistory();

    return (
        <button
            type="button"
            data-testid="switch-tab"
            onClick={() => history.push(to)}
        >
            switch tab
        </button>
    );
};

/**
 * Renders the selling block inside a router, as it is rendered in the options page.
 *
 * @param initialPath Path of the options screen the block is opened on.
 * @param switchPath Path the tab switcher navigates to.
 *
 * @returns Rendered container.
 */
function renderPromo(initialPath = '/', switchPath = '/about'): { container: HTMLElement } {
    const { container } = render(
        <MemoryRouter initialEntries={[initialPath]}>
            <TabSwitcher to={switchPath} />
            <UnlimitedPromo />
        </MemoryRouter>,
    );

    return { container };
}

/**
 * Returns a block button by the class of the shared component that renders it.
 *
 * Styles are mocked in tests, so classes of the shared components are used as stable hooks.
 *
 * @param container Rendered block container.
 * @param selector Class selector of the shared component.
 * @returns Button element.
 * @throws If the button was not rendered.
 */
function getButton(container: HTMLElement, selector: string): HTMLButtonElement {
    const button = container.querySelector<HTMLButtonElement>(selector);

    if (!button) {
        throw new Error(`Button "${selector}" was not rendered`);
    }

    return button;
}

describe('UnlimitedPromo selling block', () => {
    beforeEach(() => {
        mockSettings.isPremiumToken = false;
        mockSettings.premiumFeatures = true;
        vi.clearAllMocks();
    });

    describe('visibility', () => {
        it('should render the block for a free user with the premium promo enabled', () => {
            const { container } = renderPromo();
            expect(container.textContent).toContain('settings_unlimited_promo_title');
        });

        it('should not render the block for a premium user', () => {
            mockSettings.isPremiumToken = true;
            const { container } = renderPromo();
            expect(container.textContent).not.toContain('settings_unlimited_promo_title');
        });

        it('should not render the block when the premium promo was hidden by the user', () => {
            mockSettings.premiumFeatures = false;
            const { container } = renderPromo();
            expect(container.textContent).not.toContain('settings_unlimited_promo_title');
        });
    });

    describe('content', () => {
        it('should render the title, the benefits and the upgrade button', () => {
            const { container } = renderPromo();

            expect(container.textContent).toContain('settings_unlimited_promo_title');
            expect(container.textContent).toContain('settings_unlimited_promo_feature_speed');
            expect(container.textContent)
                .toContain(`settings_unlimited_promo_feature_locations:${UNLIMITED_LOCATIONS_COUNT}`);
            expect(container.textContent)
                .toContain(`settings_unlimited_promo_feature_devices:${POTENTIAL_DEVICE_NUM}`);
            expect(getButton(container, UPGRADE_BUTTON_SELECTOR).textContent)
                .toBe('settings_unlimited_promo_upgrade_button');
        });
    });

    describe('display event', () => {
        it.each([
            ['/', TelemetryScreenName.GeneralSettingsScreen],
            ['/account', TelemetryScreenName.AccountScreen],
            ['/support', TelemetryScreenName.SupportScreen],
            ['/about', TelemetryScreenName.AboutScreen],
            ['/free-gbs', TelemetryScreenName.FreeGbScreen],
            ['/profiles', TelemetryScreenName.ManageProfilesScreen],
        ])('should report the display with the screen of the "%s" tab', (path, screen) => {
            renderPromo(path);

            expect(mockSendCustomEvent).toHaveBeenCalledWith(
                TelemetryActionName.SellingBlockDisplayed,
                screen,
            );
        });

        it.each([
            ['/profiles/profile-1/dns', TelemetryScreenName.ManageProfilesScreen],
            ['/free-gbs?invite-friend', TelemetryScreenName.FreeGbScreen],
            ['/account/', TelemetryScreenName.AccountScreen],
            ['/account/sub-page', TelemetryScreenName.AccountScreen],
            ['/profiles/profile-1/unknown', TelemetryScreenName.GeneralSettingsScreen],
        ])('should report the display with the tab screen for the "%s" screen', (path, screen) => {
            renderPromo(path);

            expect(mockSendCustomEvent).toHaveBeenCalledWith(
                TelemetryActionName.SellingBlockDisplayed,
                screen,
            );
        });

        it('should report the display on every options tab change', () => {
            const { container } = renderPromo();

            expect(mockSendCustomEvent).toHaveBeenCalledTimes(1);

            fireEvent.click(getButton(container, SWITCH_TAB_SELECTOR));

            expect(mockSendCustomEvent).toHaveBeenCalledTimes(2);
            expect(mockSendCustomEvent).toHaveBeenLastCalledWith(
                TelemetryActionName.SellingBlockDisplayed,
                TelemetryScreenName.AboutScreen,
            );
        });

        it('should not report the display again when navigating within the tab', () => {
            const { container } = renderPromo('/profiles', '/profiles/profile-1');

            expect(mockSendCustomEvent).toHaveBeenCalledTimes(1);

            fireEvent.click(getButton(container, SWITCH_TAB_SELECTOR));

            expect(mockSendCustomEvent).toHaveBeenCalledTimes(1);
            expect(mockSendCustomEvent).toHaveBeenCalledWith(
                TelemetryActionName.SellingBlockDisplayed,
                TelemetryScreenName.ManageProfilesScreen,
            );
        });

        it('should not report the display for a premium user', () => {
            mockSettings.isPremiumToken = true;
            renderPromo();

            expect(mockSendCustomEvent).not.toHaveBeenCalled();
        });

        it('should not report the display when the premium promo was hidden by the user', () => {
            mockSettings.premiumFeatures = false;
            renderPromo();

            expect(mockSendCustomEvent).not.toHaveBeenCalled();
        });
    });

    describe('upgrade click', () => {
        it('should report the click with the current screen and open the settings purchase link', async () => {
            const { container } = renderPromo('/account');

            fireEvent.click(getButton(container, UPGRADE_BUTTON_SELECTOR));

            await waitFor(() => {
                expect(mockSendCustomEvent).toHaveBeenLastCalledWith(
                    TelemetryActionName.GetSubscriptionClick,
                    TelemetryScreenName.ContextBasedScreen,
                );
                expect(mockOpenPremiumPromoPageFromSettings).toHaveBeenCalled();
            });
        });
    });

    describe('close click', () => {
        it('should report the click with the current screen and hide the premium promo', async () => {
            const { container } = renderPromo('/support');

            fireEvent.click(getButton(container, CLOSE_BUTTON_SELECTOR));

            await waitFor(() => {
                expect(mockSendCustomEvent).toHaveBeenLastCalledWith(
                    TelemetryActionName.CloseSellingBlockClick,
                    TelemetryScreenName.ContextBasedScreen,
                );
                expect(mockHidePremiumFeatures).toHaveBeenCalled();
            });
        });
    });
});
