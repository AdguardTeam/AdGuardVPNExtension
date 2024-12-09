import React, { type PropsWithChildren } from 'react';

import classNames from 'classnames';

import { Icon } from '../Icon';

import './button.pcss';

export interface ButtonProps extends PropsWithChildren {
    variant?: 'default' | 'outline' | 'ghost';
    type?: 'button' | 'submit' | 'reset';
    className?: string;
    disabled?: boolean;
    form?: string;
    beforeIconName?: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function Button({
    variant = 'default',
    type = 'button',
    className,
    disabled,
    form,
    beforeIconName,
    children,
    onClick,
}: ButtonProps) {
    const classes = classNames(
        'button has-tab-focus',
        `button--${variant}`,
        className,
    );

    return (
        <button
            // eslint-disable-next-line react/button-has-type
            type={type}
            className={classes}
            disabled={disabled}
            form={form}
            onClick={onClick}
        >
            {beforeIconName && (
                <Icon name={beforeIconName} className="button__before-icon" />
            )}
            <span className="button__text">
                {children}
            </span>
        </button>
    );
}
