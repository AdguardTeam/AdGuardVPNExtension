import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import './header.pcss';
import rootStore from '../../stores';

const Header = observer(({ showMenuButton }) => {
    const { uiStore } = useContext(rootStore);

    const handleOpenModal = () => {
        uiStore.openOptionsModal(true);
    };

    return (
        <div className="header header--main">
            <div className="header__title">
                <svg className="header__logo">
                    <use xlinkHref="#logo" />
                </svg>
            </div>
            {showMenuButton && (
                <button
                    className="button header__setting"
                    type="button"
                    tabIndex="0"
                    onClick={handleOpenModal}
                >
                    <svg className="icon icon--button icon--options">
                        <use xlinkHref="#options" />
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
