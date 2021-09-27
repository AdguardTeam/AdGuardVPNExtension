import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { NavLink } from 'react-router-dom';

import { Rate } from './Rate';
import { reactTranslator } from '../../../common/reactTranslator';

import './sidebar.pcss';
import { rootStore } from '../../stores';

export const Sidebar = observer(() => {
    const { authStore } = useContext(rootStore);
    const { isPremiumToken } = authStore;

    return (
        <div className="sidebar">
            <svg className="logo sidebar__logo" />
            <nav className="sidebar__nav">
                <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/">
                    {reactTranslator.getMessage('settings_exclusion_title')}
                </NavLink>
                <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/settings">
                    {reactTranslator.getMessage('settings_title')}
                </NavLink>
                {!isPremiumToken && (
                    <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/referral-program">
                        {reactTranslator.getMessage('referral_get_free_traffic')}
                    </NavLink>
                )}
                <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/account">
                    {reactTranslator.getMessage('account_title')}
                </NavLink>
                <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/support">
                    {reactTranslator.getMessage('options_support_title')}
                </NavLink>
                <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/about">
                    {reactTranslator.getMessage('about_title')}
                </NavLink>
            </nav>
            <div className="sidebar__rate">
                <Rate />
            </div>
        </div>
    );
});
