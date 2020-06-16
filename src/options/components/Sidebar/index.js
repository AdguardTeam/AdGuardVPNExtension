import React from 'react';
import { NavLink } from 'react-router-dom';

import Rate from './Rate';
import './sidebar.pcss';
import translator from '../../../lib/translator';

const Sidebar = () => {
    return (
        <div className="sidebar">
            <svg className="sidebar__logo" />
            <nav className="sidebar__nav">
                <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/">
                    {translator.translate('settings_exclusion_title')}
                </NavLink>
                <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/settings">
                    {translator.translate('settings_title')}
                </NavLink>
                <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/account">
                    {translator.translate('account_title')}
                </NavLink>
                <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/about">
                    {translator.translate('about_title')}
                </NavLink>
            </nav>
            <div className="sidebar__rate">
                <Rate />
            </div>
        </div>
    );
};

export default Sidebar;
