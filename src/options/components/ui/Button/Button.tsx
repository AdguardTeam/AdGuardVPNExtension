import React, { type PropsWithChildren } from 'react';

import { Icon } from '../Icon';

import './button.pcss';

export interface ButtonProps extends PropsWithChildren {
    beforeIconName?: string;
    onClick?: () => void;
}

export function Button({
    beforeIconName,
    children,
    onClick,
}: ButtonProps) {
    return (
        <button
            className="button"
            type="button"
            onClick={onClick}
        >
            {beforeIconName && (
                <Icon name={beforeIconName} className="button__icon" />
            )}
            <span className="button__text">{children}</span>
        </button>
    );
}
