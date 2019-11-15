import React from 'react';
import { NavLink } from 'react-router-dom';
import browser from 'webextension-polyfill';

import Rate from './Rate';
import './sidebar.pcss';

const Sidebar = () => {
    return (
        <div className="sidebar">
            <svg className="sidebar__logo">
                <use xlinkHref="#logo" />
            </svg>
            <nav className="sidebar__nav">
                <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/">
                    {browser.i18n.getMessage('settings_title')}
                </NavLink>
                <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/account">
                    {browser.i18n.getMessage('account_title')}
                </NavLink>
                <NavLink className="sidebar__link" exact activeClassName="sidebar__link--active" to="/about">
                    {browser.i18n.getMessage('about_title')}
                </NavLink>
            </nav>
            <div className="sidebar__rate">
                <Rate />
            </div>
        </div>
    );
};

export default Sidebar;
