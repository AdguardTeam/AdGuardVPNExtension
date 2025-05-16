import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry';
import { translator } from '../../../../common/translator';
import { rootStore } from '../../../stores';
import { Icon } from '../../ui/Icon';
import { formatTraffic } from '../utils';

import './stats-menu-item.pcss';

/**
 * Component for displaying the usage statistics menu item.
 */
export const StatsMenuItem = observer(() => {
    const {
        vpnStore,
        authStore,
        statsStore,
        uiStore,
        telemetryStore,
    } = useContext(rootStore);

    const { isPremiumToken } = vpnStore;
    const { setForceShowUpgradeScreen } = authStore;
    const { totalUsageData, openStatsScreen } = statsStore;
    const { closeOptionsModal } = uiStore;

    const handleClick = () => {
        closeOptionsModal();

        if (!isPremiumToken) {
            telemetryStore.sendCustomEvent(
                TelemetryActionName.FreeMenuStatsClick,
                TelemetryScreenName.MenuScreen,
            );
            setForceShowUpgradeScreen(true);
        } else {
            telemetryStore.sendCustomEvent(
                TelemetryActionName.MenuStatsClick,
                TelemetryScreenName.MenuScreen,
            );
            openStatsScreen();
        }
    };

    const renderSecondaryBlock = () => {
        if (!isPremiumToken) {
            return (
                <span className="stats-menu-item__description">
                    {translator.getMessage('popup_settings_free_description')}
                </span>
            );
        }

        return (
            <span className="stats-menu-item__usage">
                <span className="stats-menu-item__usage-item stats-menu-item__usage-item--download">
                    {formatTraffic(totalUsageData.downloadBytes, true, true)}
                </span>
                <span className="stats-menu-item__usage-item stats-menu-item__usage-item--upload">
                    {formatTraffic(totalUsageData.uploadBytes, true, false)}
                </span>
            </span>
        );
    };

    return (
        <button
            type="button"
            className="button button--inline extra-options__item stats-menu-item"
            onClick={handleClick}
        >
            <span className="stats-menu-item__row">
                <span className="stats-menu-item__title">
                    {translator.getMessage('popup_settings_stats')}
                </span>
                <Icon
                    icon="right-arrow"
                    className="stats-menu-item__icon icon--arrow"
                />
            </span>
            {renderSecondaryBlock()}
        </button>
    );
});
