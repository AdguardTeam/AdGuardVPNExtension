import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import classnames from 'classnames';

import { rootStore } from '../../stores';
import { popupActions } from '../../actions/popupActions';
import { translator } from '../../../common/translator';
import {
    TelemetryActionName,
    TelemetryScreenName,
    type HeaderScreenNames,
} from '../../../background/telemetry/telemetryEnums';
import { Icon, IconButton } from '../../../common/components/Icons';

import './header.pcss';

/**
 * Header component props.
 */
export interface HeaderProps {
    /**
     * If true, show menu button.
     */
    showMenuButton: boolean;

    /**
     * Screen name for telemetry. Default is HomeScreen.
     *
     * If null, telemetry will not be sent.
     */
    screenName?: HeaderScreenNames | null;
}

/**
 * Main header component of popup.
 */
export const Header = observer(({
    showMenuButton,
    screenName = TelemetryScreenName.HomeScreen,
}: HeaderProps) => {
    const {
        uiStore,
        vpnStore,
        settingsStore,
        telemetryStore,
    } = useContext(rootStore);

    const { isPremiumToken } = vpnStore;
    const { hasGlobalError, isLimitedOfferActive } = settingsStore;

    const handleOpenModal = (): void => {
        if (screenName) {
            telemetryStore.sendCustomEvent(
                TelemetryActionName.MenuClick,
                screenName,
            );
        }

        uiStore.openOptionsModal();
    };

    const handleOpenReferral = async (): Promise<void> => {
        if (screenName) {
            telemetryStore.sendCustomEvent(
                TelemetryActionName.FreeGbClick,
                screenName,
            );
        }

        await popupActions.openFreeGbsPage();
    };

    const headerClass = classnames({
        header: true,
        'header--main': showMenuButton,
    });

    /**
     * Gift button should be shown if:
     * 1. User is not premium;
     * 1. There is no active limited offer (with timer);
     * 1. There is no global error.
     */
    const shouldShowGiftBtn = !isPremiumToken
        && !isLimitedOfferActive
        && !hasGlobalError;

    return (
        <div className={headerClass}>
            <div className="header__logo">
                <div className="logo" />
            </div>
            <div className="header__actions">
                {shouldShowGiftBtn && (
                    <button className="header__referral" type="button" onClick={handleOpenReferral}>
                        <span className="button header__referral__button">
                            <Icon name="gift" />
                        </span>
                        <span className="header__referral__hint">
                            {translator.getMessage('referral_get_free_traffic')}
                        </span>
                    </button>
                )}
                {showMenuButton && (
                    <IconButton name="sidebar-burger" onClick={handleOpenModal} />
                )}
            </div>
        </div>
    );
});
