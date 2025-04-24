import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../../common/translator';
import { rootStore } from '../../../stores';
import { Icon } from '../../ui/Icon';
import { formatBytes } from '../utils';

import './stats-menu-item.pcss';

/**
 * Props for the StatsMenuItem component.
 */
export interface StatsMenuItemProps {
    /**
     * Callback that will be called when the menu item is clicked.
     */
    onCloseRequest: () => void;
}

/**
 * Component for displaying the usage statistics menu item.
 */
export const StatsMenuItem = observer(({ onCloseRequest }: StatsMenuItemProps) => {
    const { vpnStore, authStore, statsStore } = useContext(rootStore);
    const { isPremiumToken } = vpnStore;
    const { setForceShowUpgradeScreen } = authStore;
    const { totalUsageData, openStatsScreen } = statsStore;

    const handleClick = () => {
        onCloseRequest();

        if (!isPremiumToken) {
            setForceShowUpgradeScreen(true);
        } else {
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
                    {formatBytes(totalUsageData.downloadBytes, true, true)}
                </span>
                <span className="stats-menu-item__usage-item stats-menu-item__usage-item--upload">
                    {formatBytes(totalUsageData.uploadBytes, true, false)}
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
