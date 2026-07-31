import React from 'react';

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
} from 'vitest';
import {
    render,
    screen,
    cleanup,
    fireEvent,
    waitFor,
} from '@testing-library/react';

const setShowUpgradeScreen = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const openPremiumPromoPage = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const sendCustomEvent = vi.hoisted(() => vi.fn());
const sendPageViewEvent = vi.hoisted(() => vi.fn());
const uiStoreBox = vi.hoisted(() => ({
    value: {
        isPersonalizedOnboardingVariant: false,
        onboardingGoal: null as OnboardingGoal | null,
    },
}));

vi.mock('../../../../src/common/translator', () => ({
    translator: {
        getMessage: (key: string) => key,
        getPlural: (key: string) => key,
    },
}));

vi.mock('../../../../src/common/components/Icons', () => ({
    Icon: ({ name }: { name: string }) => <span data-icon={name} />,
}));

vi.mock('../../../../src/popup/stores', () => ({
    rootStore: React.createContext({
        authStore: { setShowUpgradeScreen },
        vpnStore: { openPremiumPromoPage },
        get uiStore() { return uiStoreBox.value; },
        telemetryStore: { sendCustomEvent, sendPageViewEvent },
    }),
}));

// eslint-disable-next-line import/first
import { type OnboardingGoal } from '../../../../src/popup/stores/UiStore';
// eslint-disable-next-line import/first
import { UpgradePaywall } from '../../../../src/popup/components/Authentication/UpgradeScreen/UpgradePaywall';

describe('UpgradePaywall', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cleanup();
        vi.spyOn(window, 'close').mockImplementation(() => {});
        uiStoreBox.value = {
            isPersonalizedOnboardingVariant: false,
            onboardingGoal: null,
        };
    });

    it('renders the default upgrade screen for the non-personalized variant', () => {
        render(<UpgradePaywall />);
        expect(screen.getByText('popup_upgrade_b_title_line1')).toBeTruthy();
        expect(screen.getByText('popup_upgrade_b_description')).toBeTruthy();
        expect(screen.getByText('popup_upgrade_b_btn_get_unlimited')).toBeTruthy();
    });

    it('renders the goal-tailored variant for the personalized variant with a selected goal', () => {
        uiStoreBox.value = {
            isPersonalizedOnboardingVariant: true,
            onboardingGoal: 'streaming',
        };
        render(<UpgradePaywall />);
        expect(screen.getByText('popup_paywall_streaming_title')).toBeTruthy();
        // goal-specific features kept as-is
        expect(screen.getByText('popup_paywall_streaming_feature_1')).toBeTruthy();
        // goal-specific CTA labels kept
        expect(screen.getByText('popup_paywall_get_unlimited')).toBeTruthy();
        expect(screen.getByText('popup_paywall_maybe_later')).toBeTruthy();
        // default description is NOT shown for personalized variants
        expect(screen.queryByText('popup_upgrade_b_description')).toBeNull();
    });

    it('renders the default upgrade screen for the personalized variant when no goal was selected', () => {
        uiStoreBox.value = {
            isPersonalizedOnboardingVariant: true,
            onboardingGoal: null,
        };
        render(<UpgradePaywall />);
        expect(screen.getByText('popup_upgrade_b_title_line1')).toBeTruthy();
    });

    it('default variant upgrade click opens promo page and dismisses paywall', async () => {
        render(<UpgradePaywall />);
        fireEvent.click(screen.getByText('popup_upgrade_b_btn_get_unlimited'));
        await waitFor(() => expect(openPremiumPromoPage).toHaveBeenCalled());
        expect(setShowUpgradeScreen).toHaveBeenCalledWith(false);
    });

    it('default variant maybe-later click dismisses the paywall', () => {
        render(<UpgradePaywall />);
        fireEvent.click(screen.getByText('popup_upgrade_b_btn_maybe_later'));
        expect(setShowUpgradeScreen).toHaveBeenCalledWith(false);
    });

    it('personalized variant maybe-later click dismisses the paywall and sends goal telemetry', () => {
        uiStoreBox.value = {
            isPersonalizedOnboardingVariant: true,
            onboardingGoal: 'privacy',
        };
        render(<UpgradePaywall />);
        fireEvent.click(screen.getByText('popup_paywall_maybe_later'));
        expect(setShowUpgradeScreen).toHaveBeenCalledWith(false);
        expect(sendCustomEvent).toHaveBeenCalledWith(
            'privacy_maybe_later_click',
            'purchase_screen',
        );
    });

    it('sends VarBPurchaseScreen page view for the default variant', () => {
        render(<UpgradePaywall />);
        expect(sendPageViewEvent).toHaveBeenCalledWith('var_b_purchase_screen');
    });

    it('sends PurchaseScreen page view for the personalized variant with a goal', () => {
        uiStoreBox.value = {
            isPersonalizedOnboardingVariant: true,
            onboardingGoal: 'bypass',
        };
        render(<UpgradePaywall />);
        expect(sendPageViewEvent).toHaveBeenCalledWith('purchase_screen');
    });

    it('sends goal-specific CTA telemetry for the personalized variant', async () => {
        uiStoreBox.value = {
            isPersonalizedOnboardingVariant: true,
            onboardingGoal: 'streaming',
        };
        render(<UpgradePaywall />);
        fireEvent.click(screen.getByText('popup_paywall_get_unlimited'));
        await waitFor(() => expect(sendCustomEvent).toHaveBeenCalled());
        expect(sendCustomEvent).toHaveBeenCalledWith(
            'onboarding_purchase_click',
            'purchase_screen',
        );
    });
});
