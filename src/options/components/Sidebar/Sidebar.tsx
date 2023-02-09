import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import { NavLink } from 'react-router-dom';

import { Rate } from './Rate';
import { reactTranslator } from '../../../common/reactTranslator';
import { rootStore } from '../../stores';

import './sidebar.pcss';

export const Sidebar = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const {
        isPremiumToken,
        invitesQuestCompleted,
        confirmEmailQuestCompleted,
        addDeviceQuestCompleted,
    } = settingsStore;

    useEffect(() => {
        (async () => {
            // update bonuses data to have actual value for allQuestsCompleted
            // to display dot marker for Free BGs menu item
            await settingsStore.updateBonusesData();
        })();
    }, []);

    const allQuestsCompleted = invitesQuestCompleted && confirmEmailQuestCompleted && addDeviceQuestCompleted;

    return (
        <div className="sidebar">
            <div className="logo sidebar__logo" />
            <nav className="sidebar__nav" onClick={settingsStore.closeSubComponents}>
                <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/" replace>
                    {reactTranslator.getMessage('settings_title')}
                </NavLink>
                <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/exclusions" replace>
                    {reactTranslator.getMessage('settings_exclusion_title')}
                </NavLink>
                <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/account" replace>
                    {reactTranslator.getMessage('account_title')}
                </NavLink>
                <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/support" replace>
                    {reactTranslator.getMessage('options_support_title')}
                </NavLink>
                <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/about" replace>
                    {reactTranslator.getMessage('about_title')}
                </NavLink>
                {!isPremiumToken && (
                    <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/free-gbs" replace>
                        {reactTranslator.getMessage('settings_free_gbs')}
                        {!allQuestsCompleted && <span className="sidebar__link--mark" />}
                    </NavLink>
                )}
            </nav>
            <Rate />
        </div>
    );
});
