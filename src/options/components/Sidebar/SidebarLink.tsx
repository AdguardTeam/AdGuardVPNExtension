import React, { type PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';

import { type SidebarLinkItemClickActionNames } from '../../../background/telemetry/telemetryEnums';

/**
 * Sidebar link component props.
 */
export interface SidebarLinkProps extends PropsWithChildren {
    /**
     * Link to navigate to.
     */
    to: string;

    /**
     * Flag indicating whether the link has a bullet.
     */
    hasBullet?: boolean;

    /**
     * Tab index.
     */
    tabIndex?: number;

    /**
     * Telemetry action name.
     */
    telemetryActionName: SidebarLinkItemClickActionNames;

    /**
     * Click event handler.
     *
     * @param telemetryActionName Telemetry action name.
     */
    onClick: (telemetryActionName: SidebarLinkItemClickActionNames) => void;
}

/**
 * Sidebar link component.
 */
export function SidebarLink({
    to,
    hasBullet,
    tabIndex,
    children,
    telemetryActionName,
    onClick,
}: SidebarLinkProps) {
    const handleClick = () => {
        onClick(telemetryActionName);
    };

    return (
        <NavLink
            className="sidebar__link has-tab-focus"
            activeClassName="sidebar__link--active"
            tabIndex={tabIndex}
            to={to}
            exact
            replace
            onClick={handleClick}
        >
            {children}
            {hasBullet && <span className="sidebar__link-bullet" />}
        </NavLink>
    );
}
