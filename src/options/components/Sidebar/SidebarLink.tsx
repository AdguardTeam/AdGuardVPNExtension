import React, { type PropsWithChildren, type ReactElement } from 'react';
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
     * Optional subtitle shown below the main label.
     */
    subtitle?: string;

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
     * Whether the link should match the path exactly.
     * Defaults to true.
     */
    exact?: boolean;

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
    subtitle,
    hasBullet,
    tabIndex,
    children,
    exact = true,
    telemetryActionName,
    onClick,
}: SidebarLinkProps): ReactElement {
    const handleClick = (): void => {
        onClick(telemetryActionName);
    };

    return (
        <NavLink
            className="sidebar__link has-tab-focus"
            activeClassName="sidebar__link--active"
            tabIndex={tabIndex}
            to={to}
            exact={exact}
            replace
            onClick={handleClick}
        >
            <span className="sidebar__link-content">
                <span className="sidebar__link-label">{children}</span>
                {subtitle && <span className="sidebar__link-subtitle">{subtitle}</span>}
            </span>
            {hasBullet && <span className="sidebar__link-bullet" />}
        </NavLink>
    );
}
