import React from 'react';

import classNames from 'classnames';

import './radio.pcss';

export interface RadioProps<T> {
    value: T;
    active: boolean;
    title: string | React.ReactNode;
    description?: string | React.ReactNode;
    action?: string | React.ReactNode;
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
    const handleClick = () => {
        onSelect(value);
    };

    return (
        <button
            className={classNames('radio', active && 'radio--active')}
            type="button"
            onClick={handleClick}
        >
            <span className="radio__circle-outer">
                <span className="radio__circle-inner" />
            </span>
            <span className="radio__content">
                <span className="radio__title">{title}</span>
                {description && (
                    <span className="radio__description">{description}</span>
                )}
            </span>
            {action && (
                <span className="radio__action">{action}</span>
            )}
        </button>
    );
}
