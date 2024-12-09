import React from 'react';

import classNames from 'classnames';

import './radio.pcss';

export interface RadioProps<T extends string> {
    name: string;
    value: T;
    active: boolean;
    title: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
    onSelect: (value: T) => void;
}

export function Radio<T extends string>({
    name,
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            onSelect(value);
        }
    };

    return (
        <label
            className={classes}
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
        >
            <input
                type="radio"
                value={value}
                name={name}
                checked={active}
                onChange={handleChange}
                className="hidden"
            />
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
        </label>
    );
}
