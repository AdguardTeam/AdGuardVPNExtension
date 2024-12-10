import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';

import classNames from 'classnames';

import { translator } from '../../../common/translator';
import { rootStore } from '../../stores';
import { IconButton } from '../ui/Icon';

import { SidebarLink } from './SidebarLink';
import { Rate } from './Rate';

import './sidebar.pcss';

export const Sidebar = observer(() => {
    const { settingsStore, uiStore } = useContext(rootStore);

    const {
        isPremiumToken,
        allQuestsCompleted,
        closeSubComponents,
    } = settingsStore;

    const {
        isSidebarOpen,
        isAnyModalOpen,
        openSidebar,
        closeSidebar,
    } = uiStore;

    const classes = classNames(
        'sidebar',
        isSidebarOpen && 'sidebar--open',
    );

    /**
     * Lock sidebar from tab focus in following scenarios:
     * - Any modal open
     * - Sidebar closed on mobile screen
     */
    const isMobileScreen = window.matchMedia('(max-width: 865px)').matches;
    const isSidebarLocked = isAnyModalOpen || (!isSidebarOpen && isMobileScreen);

    useEffect(() => {
        (async () => {
            // request bonuses data on opening this screen to display actual information to user
            await settingsStore.updateBonusesData();
        })();
    }, []);

    const handleCloseAll = () => {
        closeSubComponents();
        closeSidebar();
    };

    return (
        <div className={classes}>
            <div className="sidebar__header" inert={isSidebarOpen ? '' : undefined}>
                <IconButton
                    name="sidebar-burger"
                    onClick={openSidebar}
                    className="sidebar__open-btn"
                />
            </div>
            <div className="sidebar__overlay" onClick={closeSidebar} />
            <div className="sidebar__content" inert={isSidebarLocked ? '' : undefined}>
                <div className="sidebar__logo">
                    <div className="logo" />
                </div>
                <nav className="sidebar__nav" onClick={handleCloseAll}>
                    <SidebarLink to="/">
                        {/* FIXME: Update translation text */}
                        {/* {translator.getMessage('settings_title')} */}
                        General
                    </SidebarLink>
                    <SidebarLink to="/exclusions">
                        {translator.getMessage('settings_exclusion_title')}
                    </SidebarLink>
                    <SidebarLink to="/account">
                        {translator.getMessage('account_title')}
                    </SidebarLink>
                    <SidebarLink to="/support">
                        {translator.getMessage('options_support_title')}
                    </SidebarLink>
                    <SidebarLink to="/about">
                        {translator.getMessage('about_title')}
                    </SidebarLink>
                    {!isPremiumToken && (
                        <SidebarLink
                            to="/free-gbs"
                            hasBullet={!allQuestsCompleted}
                        >
                            {translator.getMessage('settings_free_gbs')}
                        </SidebarLink>
                    )}
                </nav>
                <IconButton
                    name="cross"
                    onClick={closeSidebar}
                    className="sidebar__close-btn"
                />
                <Rate />
            </div>
        </div>
    );
});
