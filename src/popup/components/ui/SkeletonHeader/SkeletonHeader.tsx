import React from 'react';

import { IconButton } from '../../../../common/components/Icons';

import '../../Header/header.pcss';

export const SkeletonHeader = () => {
    return (
        <div className="header header--main">
            <div className="header__logo">
                <div className="logo" />
            </div>
            <div className="header__actions">
                <IconButton name="sidebar-burger" />
            </div>
        </div>
    );
};
