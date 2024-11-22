import React from 'react';

import classNames from 'classnames';

import { Icon } from './Icon';

export interface IconButtonProps {
    type?: 'button' | 'submit' | 'reset';
    variant?: 'default' | 'success' | 'error';
    name: string;
    className?: string;
    iconClassName?: string;
    tabIndex?: number;
    onClick?: (e: React.MouseEvent) => void;
}

export function IconButton({
    type = 'button',
    variant = 'default',
    name,
    className,
    iconClassName,
    tabIndex,
    onClick,
}: IconButtonProps) {
    return (
        <button
            // eslint-disable-next-line react/button-has-type
            type={type}
            className={classNames(
                'icon-button',
                `icon-button--${variant}`,
                className,
            )}
            tabIndex={tabIndex}
            onClick={onClick}
        >
            <Icon name={name} className={iconClassName} />
        </button>
    );
}
