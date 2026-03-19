import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../../common/translator';
import { rootStore } from '../../../stores';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry/useTelemetryPageViewEvent';
import { Icon } from '../../../../common/components/Icons';
import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { reactTranslator } from '../../../../common/reactTranslator';

import styles from './TrafficLimitExceededB.module.pcss';

/**
 * Free plan VPN data limit in GB per month.
 */
const FREE_VPN_DATA_GB = 3;

/**
 * Free plan number of available server locations.
 */
const FREE_LOCATIONS_COUNT = 10;

/**
 * Unlimited plan number of available server locations.
 */
const UNLIMITED_LOCATIONS_COUNT = 80;

/**
 * Free plan number of devices.
 */
const FREE_DEVICES_COUNT = 2;

/**
 * Unlimited plan number of devices.
 */
const UNLIMITED_DEVICES_COUNT = 10;

/**
 * B-variant of TrafficLimitExceeded screen with comparison table.
 * Part of AG-49792 AB test task.
 */
export const TrafficLimitExceededB = observer(() => {
    const {
        vpnStore,
        settingsStore,
        telemetryStore,
    } = useContext(rootStore);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.SpeedReducedScreen,
    );

    const onUpgradeClick = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();
        telemetryStore.sendCustomEvent(
            TelemetryActionName.SpeedReducedPurchaseClick,
            TelemetryScreenName.SpeedReducedScreen,
        );
        await vpnStore.openPremiumPromoPage();
        window.close();
    };

    const onClose = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();
        telemetryStore.sendCustomEvent(
            TelemetryActionName.CloseSpeedReducesClick,
            TelemetryScreenName.SpeedReducedScreen,
        );
        settingsStore.setHasLimitExceededDisplayed();
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>
                {translator.getMessage('popup_paywall_b_title')}
            </h2>
            <p className={styles.description}>
                {translator.getMessage('popup_paywall_b_description')}
            </p>

            <table className={styles.table}>
                <thead>
                    <tr className={styles.tableHeader}>
                        <th className={styles.tableCell} aria-label="Feature" />
                        <th className={styles.tableCellFree}>
                            {translator.getMessage('popup_paywall_b_column_free')}
                        </th>
                        <th className={styles.tableCellUnlimited}>
                            {translator.getMessage('popup_paywall_b_column_unlimited')}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th className={`${styles.tableCell} ${styles.tableCellLabel}`}>
                            {translator.getMessage('popup_paywall_b_row_vpn_data')}
                        </th>
                        <td className={`${styles.tableCell} ${styles.tableCellFree}`}>
                            {reactTranslator.getMessage('popup_paywall_b_row_vpn_data_free', {
                                gb: FREE_VPN_DATA_GB,
                                span: (chunks: string) => (
                                    <span className={styles.suffix}>{chunks}</span>
                                ),
                            })}
                        </td>
                        <td className={`${styles.tableCell} ${styles.tableCellHighlight} ${styles.tableCellHighlightFirst}`}>
                            <Icon name="infinity-circle" />
                        </td>
                    </tr>

                    <tr>
                        <th className={`${styles.tableCell} ${styles.tableCellLabel}`}>
                            {translator.getMessage('popup_paywall_b_row_speed')}
                        </th>
                        <td className={`${styles.tableCell} ${styles.tableCellFree}`}>
                            {translator.getMessage('popup_paywall_b_row_speed_free')}
                        </td>
                        <td className={`${styles.tableCell} ${styles.tableCellHighlight}`}>
                            <Icon name="infinity-circle" />
                        </td>
                    </tr>

                    <tr>
                        <th className={`${styles.tableCell} ${styles.tableCellLabel}`}>
                            {translator.getMessage('popup_paywall_b_row_locations')}
                        </th>
                        <td className={`${styles.tableCell} ${styles.tableCellFree}`}>
                            {FREE_LOCATIONS_COUNT}
                        </td>
                        <td className={`${styles.tableCell} ${styles.tableCellHighlight}`}>
                            {translator.getMessage('popup_paywall_b_row_locations_unlimited', {
                                count: UNLIMITED_LOCATIONS_COUNT,
                            })}
                        </td>
                    </tr>

                    <tr>
                        <th className={`${styles.tableCell} ${styles.tableCellLabel}`}>
                            {translator.getMessage('popup_paywall_b_row_devices')}
                        </th>
                        <td className={`${styles.tableCell} ${styles.tableCellFree}`}>
                            {FREE_DEVICES_COUNT}
                        </td>
                        <td className={`${styles.tableCell} ${styles.tableCellHighlight}`}>
                            {UNLIMITED_DEVICES_COUNT}
                        </td>
                    </tr>

                    <tr>
                        <th className={`${styles.tableCell} ${styles.tableCellLabel}`}>
                            {translator.getMessage('popup_paywall_b_row_dns')}
                        </th>
                        <td className={`${styles.tableCell} ${styles.tableCellFree}`}>
                            <Icon name="cross-circle" className={styles.iconGray} />
                        </td>
                        <td className={`${styles.tableCell} ${styles.tableCellHighlight} ${styles.tableCellHighlightLast}`}>
                            <Icon name="check-circle" />
                        </td>
                    </tr>
                </tbody>
            </table>

            <div className={styles.actions}>
                <button
                    type="button"
                    onClick={onUpgradeClick}
                    className="button button--large button--green"
                >
                    {translator.getMessage('popup_paywall_b_btn_upgrade')}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className={`button button--large ${styles.maybeLater}`}
                >
                    {translator.getMessage('popup_paywall_b_btn_maybe_later')}
                </button>
            </div>
        </div>
    );
});
