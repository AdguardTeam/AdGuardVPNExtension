import React, { type ReactElement, useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { translator } from '../../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry/useTelemetryPageViewEvent';
import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { Icon } from '../../../../common/components/Icons';

import styles from './UpgradeScreenB.module.pcss';

/**
 * Number of server locations available in unlimited plan.
 */
const UNLIMITED_LOCATIONS_COUNT = 80;

/**
 * Number of devices available in unlimited plan.
 */
const UNLIMITED_DEVICES_COUNT = 10;

/**
 * Returns feature items for B-variant upgrade screen.
 *
 * @returns Array of feature items with icons and localized text.
 */
const getFeatures = (): Array<{ icon: string; text: string }> => [
    {
        icon: 'rocket',
        text: translator.getMessage('popup_upgrade_b_feature_speed'),
    },
    {
        icon: 'globe',
        text: translator.getMessage('popup_upgrade_b_feature_locations', {
            count: UNLIMITED_LOCATIONS_COUNT,
        }),
    },
    {
        icon: 'device',
        text: translator.getMessage('popup_upgrade_b_feature_devices', {
            count: UNLIMITED_DEVICES_COUNT,
        }),
    },
    {
        icon: 'web-activity',
        text: translator.getMessage('popup_upgrade_b_feature_dns'),
    },
];

/**
 * B-variant of UpgradeScreen with features list and timer.
 * Part of AG-49792 AB test task.
 */
export const UpgradeScreenB = observer((): ReactElement | null => {
    const {
        authStore,
        vpnStore,
        telemetryStore,
    } = useContext(rootStore);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.PurchaseScreen,
    );

    const onUpgradeClick = async (): Promise<void> => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.OnboardingPurchaseClick,
            TelemetryScreenName.PurchaseScreen,
        );
        await authStore.setShowUpgradeScreen(false);
        await vpnStore.openPremiumPromoPage();
        window.close();
    };

    const onSkipClick = async (): Promise<void> => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.OnboardingStayFreeClick,
            TelemetryScreenName.PurchaseScreen,
        );
        await authStore.setShowUpgradeScreen(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h2 className={styles.title}>
                    {translator.getMessage('popup_upgrade_b_title_line1')}
                    <br />
                    {translator.getMessage('popup_upgrade_b_title_line2')}
                </h2>

                <p className={styles.description}>
                    {translator.getMessage('popup_upgrade_b_description')}
                </p>

                <div className={styles.features}>
                    {getFeatures().map((feature) => (
                        <div key={feature.icon} className={styles.feature}>
                            <Icon name={feature.icon} color="product" />
                            <span>{feature.text}</span>
                        </div>
                    ))}
                </div>

                <div>
                    <button
                        type="button"
                        onClick={onUpgradeClick}
                        className={`button button--large button--green ${styles.button}`}
                    >
                        {translator.getMessage('popup_upgrade_b_btn_get_unlimited')}
                    </button>
                    <button
                        type="button"
                        onClick={onSkipClick}
                        className={`button button--large ${styles.button} ${styles.maybeLater}`}
                    >
                        {translator.getMessage('popup_upgrade_b_btn_maybe_later')}
                    </button>
                </div>
            </div>
        </div>
    );
});
