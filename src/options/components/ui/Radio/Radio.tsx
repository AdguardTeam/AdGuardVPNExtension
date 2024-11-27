import React from 'react';

import classNames from 'classnames';

import './radio.pcss';

export interface RadioProps<T> {
    value: T;
    active: boolean;
    title: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
    variant?: 'default' | 'thin';
    onSelect: (value: T) => void;
}

export function Radio<T extends string>({
    value,
    active,
    title,
    description,
    action,
    variant = 'default',
    onSelect,
}: RadioProps<T>) {
    const classes = classNames(
        'radio',
        active && 'radio--active',
        `radio--${variant}`,
    );

    const handleClick = () => {
        onSelect(value);
    };

    return (
        <button
            className={classes}
            type="button"
            onClick={handleClick}
        >
            <span className="radio__circle-outer">
                <span className="radio__circle-inner" />
            </span>
            <span className="radio__content">
                <span className="radio__title">
                    {title}
                </span>
                {description && (
                    <span className="radio__description">
                        {description}
                    </span>
                )}
            </span>
            {action && (
                <span className="radio__action">
                    {action}
                </span>
            )}
        </button>
    );
}
