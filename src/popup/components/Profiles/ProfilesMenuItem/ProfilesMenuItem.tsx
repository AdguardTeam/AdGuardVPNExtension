import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import cn from 'classnames';

import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { translator } from '../../../../common/translator';
import { Icon } from '../../../../common/components/Icons';
import { rootStore } from '../../../stores';

import styles from './profiles-menu-item.module.pcss';

/**
 * Menu item for opening the profiles screen.
 * Displays the active profile name and a chevron.
 */
export const ProfilesMenuItem = observer(() => {
    const { vpnStore, uiStore, telemetryStore } = useContext(rootStore);
    const { activeProfileName, profiles } = vpnStore;

    if (profiles.length <= 1) {
        return null;
    }

    const handleClick = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.ProfilesMainClick,
            TelemetryScreenName.MenuScreen,
        );
        uiStore.closeOptionsModal();
        vpnStore.setProfilesScreenOpen(true);
    };

    return (
        <button
            type="button"
            className={cn('button button--inline extra-options__item', styles.root)}
            onClick={handleClick}
        >
            <span className={styles.row}>
                <span className={styles.title}>
                    {translator.getMessage('popup_profiles_title')}
                </span>
                <Icon
                    name="arrow-down"
                    color="gray"
                    rotation="clockwise"
                />
            </span>
            <span className={styles.subtitle}>
                {activeProfileName}
            </span>
        </button>
    );
});
