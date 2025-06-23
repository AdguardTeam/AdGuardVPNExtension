import React from 'react';

import { IconButton } from '../../../../common/components/Icons';

import '../../Header/header.pcss';

export const SkeletonHeader = () => {
    return (
        <div className="header header--main">
            <div className="header__logo">
                <div className="logo" />
            </div>
            <IconButton name="sidebar-burger" size="20" />
        </div>
    );
};
