import React, { type PropsWithChildren } from 'react';

import classNames from 'classnames';

import { Icon } from '../Icon';

import './button.pcss';

/**
 * Button component props.
 */
export interface ButtonProps extends PropsWithChildren {
    /**
     * Button variant. Default is 'default'.
     * - 'default' - Filled button.
     * - 'outline' - Outlined button.
     * - 'transparent' - Transparent button.
     */
    variant?: 'default' | 'outline' | 'transparent';

    /**
     * Button type. Default is 'button'.
     */
    type?: 'button' | 'submit' | 'reset';

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
