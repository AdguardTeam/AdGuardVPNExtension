import React, { type PropsWithChildren } from 'react';

import classNames from 'classnames';

import { Icon } from '../Icon';

import './button.pcss';

export interface ButtonProps extends PropsWithChildren {
    type?: 'button' | 'submit' | 'reset';
    variant?: 'default' | 'ghost' | 'outline';
    beforeIconName?: string;
    onClick?: () => void;
}

export function Button({
    type = 'button',
    variant = 'default',
    beforeIconName,
    children,
    onClick,
}: ButtonProps) {
    return (
        <button
            className={classNames('button', `button--${variant}`)}
            // eslint-disable-next-line react/button-has-type
            type={type}
            onClick={onClick}
        >
            {beforeIconName && (
                <Icon name={beforeIconName} className="button__icon" />
            )}
            <span className="button__text">{children}</span>
        </button>
    );
}
