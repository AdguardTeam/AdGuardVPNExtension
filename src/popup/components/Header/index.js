import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import './header.pcss';
import rootStore from '../../stores';

const Header = observer(({ showMenuButton }) => {
    const { uiStore } = useContext(rootStore);

    const handleOpenModal = () => {
        uiStore.openOptionsModal(true);
    };

    const headerClass = classnames({
        header: true,
        'header--main': showMenuButton,
    });

    return (
        <div className={headerClass}>
            <div className="header__logo">
                <svg className="icon icon--logo">
                    <use xlinkHref="#logo" />
                </svg>
                <svg className="icon icon--beta">
                    <use xlinkHref="#beta" />
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
