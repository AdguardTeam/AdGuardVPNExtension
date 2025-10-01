import React, { type PropsWithChildren, type ReactElement } from 'react';

import classNames from 'classnames';

import { Icon } from '../../../../common/components/Icons';

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
     * Button color. Default is 'primary'.
     */
    color?: 'primary' | 'danger';

    /**
     * Button size. Default is 'large'.
     * - 'large' - 16px 24px padding, 18px font size.
     * - 'medium' - 16px 16px padding, 16px font size.
     *
     * Supported only with 'filled' and 'outlined' variant.
     */
    size?: 'large' | 'medium';

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
    color = 'primary',
    size = 'large',
    className,
    disabled,
    form,
    beforeIconName,
    children,
    onClick,
}: ButtonProps): ReactElement {
    const classes = classNames(
        'button has-tab-focus',
        `button--${variant}`,
        `button--color-${color}`,
        `button--size-${size}`,
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
            {beforeIconName && <Icon name={beforeIconName} />}
            <span className="button__text">
                {children}
            </span>
        </button>
    );
}
