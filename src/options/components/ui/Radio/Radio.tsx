import React from 'react';

import classNames from 'classnames';

import './radio.pcss';

/**
 * Radio component props.
 */
export interface RadioProps<T extends string> {
    /**
     * Radio id.
     */
    id?: string;

    /**
     * Radio name.
     */
    name: string;

    /**
     * Radio value.
     */
    value: T;

    /**
     * Is radio active or not.
     */
    isActive: boolean;

    /**
     * Radio title.
     */
    title: React.ReactNode;

    /**
     * Radio description.
     */
    description?: React.ReactNode;

    /**
     * Radio action. Rendered on the right side of the radio.
     */
    action?: React.ReactNode;

    /**
     * Additional class name.
     */
    className?: string;

    /**
     * Select radio handler.
     */
    onSelect: (value: T) => void;
}

export function Radio<T extends string>({
    id,
    name,
    value,
    isActive,
    title,
    description,
    action,
    className,
    onSelect,
}: RadioProps<T>) {
    const classes = classNames(
        'radio has-tab-focus',
        isActive && 'radio--active',
        className,
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            onSelect(value);
        }
    };

    return (
        <label
            htmlFor={id}
            className={classes}
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
        >
            <input
                id={id}
                type="radio"
                value={value}
                name={name}
                checked={isActive}
                tabIndex={-1}
                onChange={handleChange}
                className="radio__input"
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
