import React from 'react';
import { NavLink } from 'react-router-dom';

import Rate from './Rate';
import { reactTranslator } from '../../../reactCommon/reactTranslator';

import './sidebar.pcss';

export const Sidebar = () => {
    return (
        <div className="sidebar">
            <svg className="sidebar__logo" />
            <nav className="sidebar__nav">
                <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/">
                    {reactTranslator.translate('settings_exclusion_title')}
                </NavLink>
                <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/settings">
                    {reactTranslator.translate('settings_title')}
                </NavLink>
                <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/account">
                    {reactTranslator.translate('account_title')}
                </NavLink>
                <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/support">
                    {reactTranslator.translate('options_support_title')}
                </NavLink>
                <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/about">
                    {reactTranslator.translate('about_title')}
                </NavLink>
            </nav>
            <div className="sidebar__rate">
                <Rate />
            </div>
        </div>
    );
};
