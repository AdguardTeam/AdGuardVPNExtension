import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import classnames from 'classnames';

import { rootStore } from '../../stores';
import { popupActions } from '../../actions/popupActions';
import { translator } from '../../../common/translator';
import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry';
import { Icon } from '../ui/Icon';

import './header.pcss';

export const Header = observer(({ showMenuButton }: { showMenuButton: boolean }) => {
    const {
        uiStore,
        vpnStore,
        settingsStore,
        telemetryStore,
    } = useContext(rootStore);

    const { isPremiumToken } = vpnStore;
    const { hasGlobalError, isLimitedOfferActive } = settingsStore;

    const handleOpenModal = () => {
        uiStore.openOptionsModal();
    };

    const handleOpenReferral = async () => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.FreeGbClick,
            TelemetryScreenName.HomeScreen,
        );
        await popupActions.openFreeGbsPage();
    };

    const headerClass = classnames({
        header: true,
        'header--main': showMenuButton,
    });

    const tabIndex = 0;

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
                            <Icon icon="gift" className="icon--button" />
                        </span>
                        <span className="header__referral__hint">
                            {translator.getMessage('referral_get_free_traffic')}
                        </span>
                    </button>
                )}
                {showMenuButton && (
                    <button
                        className="button header__setting"
                        type="button"
                        tabIndex={tabIndex}
                        onClick={handleOpenModal}
                    >
                        <Icon icon="bar" className="icon--button icon--popup-menu" />
                    </button>
                )}
            </div>
        </div>
    );
});

/**
 * Component is used as part of the ScreenShot component
 * to render the Header as static non-interactive element.
 *
 * See `ScreenShot.tsx` for more details.
 */
export const HeaderScreenShot = () => (
    <div className="header header--main">
        <div className="header__logo">
            <div className="logo" />
        </div>
        <div className="header__actions">
            <button type="button" className="button header__setting">
                <Icon icon="bar" className="icon--button icon--popup-menu" />
            </button>
        </div>
    </div>
);
