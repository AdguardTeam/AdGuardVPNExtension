import React, { type ReactElement, useContext, useEffect } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';

import { UpgradeScreen } from './UpgradeScreen';
import { getGoalUpgradeVariants, getDefaultUpgradeVariant } from './upgradeScreenVariants';

/**
 * Renders the upgrade paywall for the current onboarding variant.
 *
 * The personalized onboarding (AG-55378) with a selected goal renders a
 * goal-tailored variant (goal-specific title, features, button labels and
 * PurchaseScreen telemetry); every other case renders the default upgrade
 * screen (former B variant — winner of the concluded AG-49792 A/B test).
 *
 * A premium-location click by a free user (AG-57544) always renders the
 * default variant, regardless of the A/B test assignment.
 */
export const UpgradePaywall = observer((): ReactElement => {
    const { uiStore, settingsStore } = useContext(rootStore);
    const { isPersonalizedOnboardingVariant, onboardingGoal } = uiStore;
    const { freeUserClickedPremiumLocation } = settingsStore;

    useEffect(() => {
        return (): void => {
            settingsStore.clearPremiumLocationPaywall();
        };
    }, [settingsStore]);

    // Premium-location click always shows the default screen, bypassing the A/B test (AG-57544).
    const variant = !freeUserClickedPremiumLocation
        && isPersonalizedOnboardingVariant
        && onboardingGoal
        ? getGoalUpgradeVariants()[onboardingGoal]
        : getDefaultUpgradeVariant();

    return <UpgradeScreen variant={variant} />;
});
