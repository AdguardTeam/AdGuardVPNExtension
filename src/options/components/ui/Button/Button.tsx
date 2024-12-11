import React, { type PropsWithChildren } from 'react';

import classNames from 'classnames';

import { Icon } from '../Icon';

import './button.pcss';

/**
 * Button component props.
 */
export interface ButtonProps extends PropsWithChildren {
    /**
     * Button variant. Default is 'filled'.
     */
    variant?: 'filled' | 'outlined' | 'transparent';

    /**
     * Button type. Default is 'button'.
     */
    type?: 'button' | 'submit' | 'reset';

    /**
     * Button color. Default is 'default'.
     */
    color?: 'default' | 'danger';

    /**
     * Additional class name.
     */
    className?: string;

    /**
     * Is button disabled or not.
     */
    disabled?: boolean;

    /**
     * Form id to associate the button with.
     */
    form?: string;

    /**
     * Icon name to display before the text.
     */
    beforeIconName?: string;

    /**
     * Click event handler.
     */
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function Button({
    variant = 'filled',
    type = 'button',
    color = 'default',
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
        `button--color-${color}`,
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
