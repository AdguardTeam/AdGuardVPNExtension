import React from 'react';

import classNames from 'classnames';

import { Icon } from './Icon';

export interface IconButtonProps {
    type?: 'button' | 'submit' | 'reset';
    color?: 'default' | 'success' | 'error';
    name: string;
    className?: string;
    iconClassName?: string;
    onClick?: (e: React.MouseEvent) => void;
}

export function IconButton({
    type = 'button',
    color = 'default',
    name,
    className,
    iconClassName,
    onClick,
}: IconButtonProps) {
    const classes = classNames(
        'icon-button has-tab-focus',
        `icon-button--${color}`,
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
