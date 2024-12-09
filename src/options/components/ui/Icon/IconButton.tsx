import React from 'react';

import classNames from 'classnames';

import { Icon } from './Icon';

export interface IconButtonProps {
    type?: 'button' | 'submit' | 'reset';
    name: string;
    className?: string;
    iconClassName?: string;
    onClick?: (e: React.MouseEvent) => void;
}

export function IconButton({
    type = 'button',
    name,
    className,
    iconClassName,
    onClick,
}: IconButtonProps) {
    const classes = classNames(
        'icon-button',
        'has-tab-focus',
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
