import React from 'react';

import classNames from 'classnames';

import './radio.pcss';

export interface RadioProps<T> {
    value: T;
    active: boolean;
    title: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
    onSelect: (value: T) => void;
}

export function Radio<T extends string>({
    value,
    active,
    title,
    description,
    action,
    onSelect,
}: RadioProps<T>) {
    const classes = classNames(
        'radio has-tab-focus',
        active && 'radio--active',
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
