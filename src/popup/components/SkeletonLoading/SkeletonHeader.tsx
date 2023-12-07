import React from 'react';

import '../Header/header.pcss';

export const SkeletonHeader = () => {
    return (
        <div className="header header--main">
            <div className="header__logo">
                <div className="logo" />
            </div>
            <button
                className="button header__setting header__setting--inactive"
                type="button"
                tabIndex={-1}
            >
                <svg className="icon icon--button icon--popup-menu">
                    <use xlinkHref="#bar" />
                </svg>
            </button>
        </div>
    );
};
