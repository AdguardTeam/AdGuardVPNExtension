import React, { useContext, useEffect, useState } from 'react';
import { observer } from 'mobx-react';

import classNames from 'classnames';

import { reactTranslator } from '../../../common/reactTranslator';
import { rootStore } from '../../stores';
import { Icon } from '../ui/Icon';

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

    useEffect(() => {
        (async () => {
            // request bonuses data on opening this screen to display actual information to user
            await settingsStore.updateBonusesData();
        })();
    }, []);

    const allQuestsCompleted = invitesQuestCompleted && confirmEmailQuestCompleted && addDeviceQuestCompleted;

    return (
        <div className={classNames('sidebar', isActive && 'sidebar--active')}>
            <div className="sidebar__overlay" onClick={() => setIsActive(false)} />
            <div className="sidebar__menu">
                <button
                    className="sidebar__menu-btn"
                    type="button"
                    onClick={() => setIsActive(true)}
                >
                    <Icon className="sidebar__menu-btn-icon" name="sidebar-burger" />
                </button>
            </div>
            <div className="sidebar__content">
                <div className="sidebar__logo">
                    <div className="logo" />
                </div>
                <nav className="sidebar__nav" onClick={settingsStore.closeSubComponents}>
                    <SidebarLink to="/">
                        {reactTranslator.getMessage('settings_title')}
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
