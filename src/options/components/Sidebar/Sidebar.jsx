import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { NavLink } from 'react-router-dom';

import { Rate } from './Rate';
import { reactTranslator } from '../../../common/reactTranslator';
import { rootStore } from '../../stores';
import { REFERRAL_PROGRAM_LINK } from '../../../lib/constants';

import './sidebar.pcss';

export const Sidebar = observer(() => {
    const { authStore } = useContext(rootStore);
    const { isPremiumToken } = authStore;

    return (
        <div className="sidebar">
            <div className="sidebar__in">
                <svg className="logo sidebar__logo" />
                <nav className="sidebar__nav">
                    <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/">
                        {reactTranslator.getMessage('settings_title')}
                    </NavLink>
                    <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/exclusions">
                        {reactTranslator.getMessage('settings_exclusion_title')}
                    </NavLink>
                    {!isPremiumToken && (
                        <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to={`/${REFERRAL_PROGRAM_LINK}`}>
                            {reactTranslator.getMessage('options_menu_free_traffic')}
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
        </div>
    );
});
