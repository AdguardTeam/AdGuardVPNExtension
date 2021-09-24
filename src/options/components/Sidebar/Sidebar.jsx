import React from 'react';
import { NavLink } from 'react-router-dom';

import { Rate } from './Rate';
import { reactTranslator } from '../../../common/reactTranslator';

import './sidebar.pcss';

export const Sidebar = () => {
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
                <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/referral-program">
                    {reactTranslator.getMessage('referral_get_free_traffic')}
                </NavLink>
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
};
