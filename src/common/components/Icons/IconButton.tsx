import React, { type ReactElement } from 'react';

import classNames from 'classnames';

import { Icon, type IconColor, type IconProps } from './Icon';

import './icon-button.pcss';

/**
 * IconButton component props.
 */
export interface IconButtonProps extends IconProps {
    /**
     * Button type. Default is 'button'.
     */
    type?: 'button' | 'submit' | 'reset';

    /**
     * Color of the icon.
     * Default is `'gray'`.
     */
    color?: IconColor;

    /**
     * Hover color of the icon.
     * Default is `'text-main'`.
     */
    hoverColor?: IconColor;

    /**
     * Additional icon class name.
     */
    iconClassName?: string;

    /**
     * Click event handler.
     */
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function IconButton({
    name,
    size,
    rotation,
    className,
    type = 'button',
    color = 'gray',
    hoverColor = 'text-main',
    iconClassName,
    onClick,
}: IconButtonProps): ReactElement {
    const classes = classNames(
        'icon-button has-tab-focus',
        `icon-button--hover-color-${hoverColor}`,
        className,
    );

    return (
        <button
            // eslint-disable-next-line react/button-has-type
            type={type}
            className={classes}
            onClick={onClick}
        >
            <Icon
                name={name}
                color={color}
                size={size}
                rotation={rotation}
                className={iconClassName}
            />
        </button>
    );
}
