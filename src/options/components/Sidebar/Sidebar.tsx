import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';

import classNames from 'classnames';

import { translator } from '../../../common/translator';
import { rootStore } from '../../stores';

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
        openSidebar,
        closeSidebar,
    } = uiStore;

    const classes = classNames(
        'sidebar',
        isSidebarOpen && 'sidebar--open',
    );

    const isMobileScreen = window.matchMedia('(max-width: 865px)').matches;

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
                {/* TODO: Export icons to component (AG-38059) */}
                <button
                    className="sidebar__open-btn has-tab-focus"
                    type="button"
                    onClick={openSidebar}
                >
                    <svg className="sidebar__open-btn-icon">
                        <use xlinkHref="#sidebar-burger" />
                    </svg>
                </button>
            </div>
            <div className="sidebar__overlay" onClick={closeSidebar} />
            <div className="sidebar__content" inert={!isSidebarOpen && isMobileScreen ? '' : undefined}>
                <div className="sidebar__logo">
                    <div className="logo" />
                </div>
                <nav className="sidebar__nav" onClick={handleCloseAll}>
                    <SidebarLink to="/">
                        {translator.getMessage('settings_title')}
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
                {/* TODO: Export icons to component (AG-38059) */}
                <button
                    className="sidebar__close-btn has-tab-focus"
                    type="button"
                    onClick={closeSidebar}
                >
                    <svg className="sidebar__close-btn-icon">
                        <use xlinkHref="#cross" />
                    </svg>
                </button>
                <Rate />
            </div>
        </div>
    );
});
