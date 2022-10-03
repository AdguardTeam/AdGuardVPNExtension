import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { rootStore } from '../../stores';
import { popupActions } from '../../actions/popupActions';
import { reactTranslator } from '../../../common/reactTranslator';

import './header.pcss';

export const Header = observer(({ showMenuButton }) => {
    const { uiStore, vpnStore } = useContext(rootStore);
    const { isPremiumToken } = vpnStore;

    const handleOpenModal = () => {
        uiStore.openOptionsModal(true);
    };

    const handleOpenReferral = async (e) => {
        e.preventDefault();
        await popupActions.openFreeGbsPage();
    };

    const headerClass = classnames({
        header: true,
        'header--main': showMenuButton,
    });

    return (
        <div className={headerClass}>
            <div className="header__logo">
                <div className="logo" />
            </div>
            {!isPremiumToken && showMenuButton && (
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
                    tabIndex="0"
                    onClick={handleOpenModal}
                >
                    <svg className="icon icon--button">
                        <use xlinkHref="#bar" />
                    </svg>
                </button>
            )}
        </div>
    );
});

Header.defaultProps = {
    authenticated: false,
};
