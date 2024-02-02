import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import classnames from 'classnames';

import { rootStore } from '../../stores';
import { popupActions } from '../../actions/popupActions';
import { reactTranslator } from '../../../common/reactTranslator';

import './header.pcss';

export const Header = observer(({ showMenuButton }: { showMenuButton: boolean }) => {
    const { uiStore, vpnStore, settingsStore } = useContext(rootStore);
    const { isPremiumToken } = vpnStore;
    const { hasGlobalError, isLimitedOfferActive } = settingsStore;

    const handleOpenModal = () => {
        uiStore.openOptionsModal();
    };

    const handleOpenReferral = async (e: React.MouseEvent<HTMLButtonElement> | React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
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
            {shouldShowGiftBtn && (
                <div className="header__referral">
                    <button
                        className="button header__referral__button"
                        type="button"
                        onClick={handleOpenReferral}
                    >
                        <svg className="icon icon--button">
                            <use xlinkHref="#gift" />
                        </svg>
                    </button>
                    <a
                        className="header__referral__hint"
                        href="#"
                        onClick={handleOpenReferral}
                    >
                        {reactTranslator.getMessage('referral_get_free_traffic')}
                    </a>
                </div>
            )}
            {showMenuButton && (
                <button
                    className="button header__setting"
                    type="button"
                    tabIndex={tabIndex}
                    onClick={handleOpenModal}
                >
                    <svg className="icon icon--button icon--popup-menu">
                        <use xlinkHref="#bar" />
                    </svg>
                </button>
            )}
        </div>
    );
});
