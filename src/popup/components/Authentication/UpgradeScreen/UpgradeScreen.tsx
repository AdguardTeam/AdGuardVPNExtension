import React, { type ReactElement, useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry/useTelemetryPageViewEvent';
import { Icon } from '../../../../common/components/Icons';

import { getDefaultUpgradeVariant, type UpgradeScreenVariant } from './upgradeScreenVariants';

import styles from './UpgradeScreen.module.pcss';

interface UpgradeScreenProps {
    /**
     * Variant describing the title, features, CTA labels and telemetry for the
     * screen. Defaults to {@link getDefaultUpgradeVariant}.
     */
    variant?: UpgradeScreenVariant;
}

/**
 * Upgrade paywall card. Renders the shared layout for both the default
 * onboarding upgrade screen and every personalized onboarding goal variant;
 * the title, features, CTA labels and telemetry are provided by the variant.
 */
export const UpgradeScreen = observer(({
    variant,
}: UpgradeScreenProps): ReactElement => {
    const {
        title,
        description,
        features,
        ctaLabel,
        skipLabel,
        pageViewScreen,
        ctaTelemetry,
        skipTelemetry,
    } = variant ?? getDefaultUpgradeVariant();
    const { authStore, vpnStore, telemetryStore } = useContext(rootStore);

    useTelemetryPageViewEvent(telemetryStore, pageViewScreen);

    const onUpgradeClick = async (): Promise<void> => {
        telemetryStore.sendCustomEvent(ctaTelemetry.actionName, ctaTelemetry.screenName);
        await authStore.setShowUpgradeScreen(false);
        await vpnStore.openPremiumPromoPage();
        window.close();
    };

    const onSkipClick = async (): Promise<void> => {
        telemetryStore.sendCustomEvent(skipTelemetry.actionName, skipTelemetry.screenName);
        await authStore.setShowUpgradeScreen(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h2 className={styles.title}>{title}</h2>

                {description && (
                    <p className={styles.description}>{description}</p>
                )}

                <div className={styles.features}>
                    {features.map((feature) => (
                        <div key={feature.id} className={styles.feature}>
                            <Icon name={feature.icon} color="product" className={styles.featureIcon} />
                            <span className={styles.featureText}>{feature.text}</span>
                        </div>
                    ))}
                </div>

                <div>
                    <button
                        type="button"
                        onClick={onUpgradeClick}
                        className={`button button--large button--green ${styles.button}`}
                    >
                        {ctaLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onSkipClick}
                        className={`button button--large ${styles.button} ${styles.maybeLater}`}
                    >
                        {skipLabel}
                    </button>
                </div>
            </div>
        </div>
    );
});
