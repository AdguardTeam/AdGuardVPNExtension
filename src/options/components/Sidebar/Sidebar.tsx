import React, { useContext, useEffect, useState } from 'react';
import { observer } from 'mobx-react';

import classNames from 'classnames';

import { reactTranslator } from '../../../common/reactTranslator';
import { rootStore } from '../../stores';
import { IconButton } from '../ui/Icon';

import { Rate } from './Rate';
import { SidebarLink } from './SidebarLink';

import './sidebar.pcss';

export const Sidebar = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const {
        isPremiumToken,
        invitesQuestCompleted,
        confirmEmailQuestCompleted,
        addDeviceQuestCompleted,
    } = settingsStore;

    const [isActive, setIsActive] = useState(false);

    const classes = classNames('sidebar', isActive && 'sidebar--active');

    const handleCloseMenu = () => {
        setIsActive(false);
    };

    const handleOpenMenu = () => {
        setIsActive(true);
    };

    const handleCloseAll = () => {
        settingsStore.closeSubComponents();
        handleCloseMenu();
    };

    useEffect(() => {
        (async () => {
            // request bonuses data on opening this screen to display actual information to user
            await settingsStore.updateBonusesData();
        })();
    }, []);

    const allQuestsCompleted = (
        invitesQuestCompleted
        && confirmEmailQuestCompleted
        && addDeviceQuestCompleted
    );

    return (
        <div className={classes}>
            <div className="sidebar__overlay" onClick={handleCloseMenu} />
            <div className="sidebar__menu">
                <IconButton
                    name="sidebar-burger"
                    className="sidebar__menu-btn"
                    onClick={handleOpenMenu}
                />
            </div>
            <div className="sidebar__content">
                <div className="sidebar__logo">
                    <div className="logo" />
                </div>
                <nav className="sidebar__nav" onClick={handleCloseAll}>
                    <SidebarLink to="/">
                        {/* FIXME: Translation */}
                        General
                    </SidebarLink>
                    <SidebarLink to="/exclusions">
                        {reactTranslator.getMessage('settings_exclusion_title')}
                    </SidebarLink>
                    <SidebarLink to="/account">
                        {reactTranslator.getMessage('account_title')}
                    </SidebarLink>
                    <SidebarLink to="/support">
                        {reactTranslator.getMessage('options_support_title')}
                    </SidebarLink>
                    <SidebarLink to="/about">
                        {reactTranslator.getMessage('about_title')}
                    </SidebarLink>
                    {!isPremiumToken && (
                        <SidebarLink to="/free-gbs" hasBullet={!allQuestsCompleted}>
                            {reactTranslator.getMessage('settings_free_gbs')}
                        </SidebarLink>
                    )}
                </nav>
                <Rate />
            </div>
        </div>
    );
});
