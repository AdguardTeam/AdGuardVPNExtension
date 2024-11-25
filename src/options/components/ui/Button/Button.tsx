import React, { type PropsWithChildren } from 'react';

import classNames from 'classnames';

import { Icon } from '../Icon';

import './button.pcss';

export interface ButtonProps extends PropsWithChildren {
    type?: 'button' | 'submit' | 'reset';
    variant?: 'default' | 'ghost' | 'outline';
    size?: 'medium' | 'large';
    color?: 'default' | 'red';
    beforeIconName?: string;
    className?: string;
    disabled?: boolean;
    onClick?: () => void;
}

export function Button({
    type = 'button',
    variant = 'default',
    size = 'medium',
    color = 'default',
    beforeIconName,
    className,
    children,
    disabled,
    onClick,
}: ButtonProps) {
    return (
        <button
            className={classNames(
                'button',
                `button--${variant}`,
                `button--${size}`,
                `button--${color}`,
                className,
            )}
            // eslint-disable-next-line react/button-has-type
            type={type}
            onClick={onClick}
            disabled={disabled}
        >
            {beforeIconName && (
                <Icon name={beforeIconName} className="button__icon" />
            )}
            <span className="button__text">{children}</span>
        </button>
    );
}
