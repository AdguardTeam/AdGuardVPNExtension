import React from 'react';

import classNames from 'classnames';

import { Icon } from './Icon';

/**
 * IconButton component props.
 */
export interface IconButtonProps {
    /**
     * Button type. Default is 'button'.
     */
    type?: 'button' | 'submit' | 'reset';

    /**
     * Button hover color. Default is 'primary'.
     */
    hoverColor?: 'primary' | 'success' | 'error';

    /**
     * The name of the icon to display.
     *
     * Full list of available icons can be found in the `Icons.tsx` file.
     */
    name: string;

    /**
     * Additional class name.
     */
    className?: string;

    /**
     * Additional icon class name.
     */
    iconClassName?: string;

    /**
     * Click event handler.
     */
    onClick?: (e: React.MouseEvent) => void;
}

export function IconButton({
    type = 'button',
    hoverColor = 'primary',
    name,
    className,
    iconClassName,
    onClick,
}: IconButtonProps) {
    const classes = classNames(
        'icon-button has-tab-focus',
        `icon-button--hover-${hoverColor}`,
        className,
    );

    return (
        <button
            // eslint-disable-next-line react/button-has-type
            type={type}
            className={classes}
            onClick={onClick}
        >
            <Icon name={name} className={iconClassName} />
        </button>
    );
}
