import React, { type PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';

export interface SidebarLinkProps extends PropsWithChildren {
    to: string;
    hasBullet?: boolean;
    tabIndex?: number;
}

export function SidebarLink({
    to,
    hasBullet,
    tabIndex,
    children,
}: SidebarLinkProps) {
    return (
        <NavLink
            className="sidebar__link has-tab-focus"
            activeClassName="sidebar__link--active"
            tabIndex={tabIndex}
            to={to}
            exact
            replace
        >
            {children}
            {hasBullet && <span className="sidebar__link-bullet" />}
        </NavLink>
    );
}
