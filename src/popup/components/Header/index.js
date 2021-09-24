import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import browser from 'webextension-polyfill';
import classnames from 'classnames';
import { BUILD_ENV } from '../../../background/config';

import './header.pcss';
import { rootStore } from '../../stores';
import { popupActions } from '../../actions/popupActions';
import { reactTranslator } from '../../../common/reactTranslator';

const Header = observer(({ showMenuButton }) => {
    const { uiStore } = useContext(rootStore);

    const handleOpenModal = () => {
        uiStore.openOptionsModal(true);
    };

    const handleOpenReferral = async (e) => {
        e.preventDefault();
        const referralProgramPageUrl = `chrome-extension://${browser.runtime.id}/options.html#referral-program`;
        await popupActions.openTab(referralProgramPageUrl);
    };

    const headerClass = classnames({
        header: true,
        'header--main': showMenuButton,
    });

    const shouldShowBeta = BUILD_ENV !== 'release';

    return (
        <div className={headerClass}>
            <div className="header__logo">
                <svg className="icon icon--logo">
                    <use xlinkHref="#logo" />
                </svg>
                {shouldShowBeta && (
                    <svg className="icon icon--beta">
                        <use xlinkHref="#beta" />
                    </svg>
                )}
            </div>
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
                    {reactTranslator.getMessage('referral_add_free_traffic')}
                </a>
            </div>
            {showMenuButton && (
                <button
                    className="button header__setting"
                    type="button"
                    tabIndex="0"
                    onClick={handleOpenModal}
                >
                    <svg className="icon icon--button icon--options">
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

export default Header;
