import React, { type ReactElement, useContext } from 'react';
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
 */
export const UpgradePaywall = observer((): ReactElement => {
    const { uiStore } = useContext(rootStore);
    const { isPersonalizedOnboardingVariant, onboardingGoal } = uiStore;

    const variant = isPersonalizedOnboardingVariant && onboardingGoal
        ? getGoalUpgradeVariants()[onboardingGoal]
        : getDefaultUpgradeVariant();

    return <UpgradeScreen variant={variant} />;
});
