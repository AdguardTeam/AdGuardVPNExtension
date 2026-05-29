import React, { type ReactElement, useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';

import { UpgradeScreen } from './UpgradeScreen';
import { UpgradeScreenB } from './UpgradeScreenB';

/**
 * Renders the appropriate upgrade paywall variant (A or B)
 * based on the current A/B test configuration.
 */
export const UpgradePaywall = observer((): ReactElement => {
    const { uiStore } = useContext(rootStore);

    const UpgradeComponent = uiStore.isPaywallBVariant ? UpgradeScreenB : UpgradeScreen;

    return <UpgradeComponent />;
});
