import React from 'react';

import classNames from 'classnames';

import { Icon } from '../Icon';

import './checkbox.pcss';

export interface CheckboxProps {
    title: React.ReactNode;
    description?: React.ReactNode;
    value: boolean;
    onChange: (value: boolean) => void;
}

export function Checkbox({
    title,
    description,
    value,
    onChange,
}: CheckboxProps) {
    const classes = classNames('checkbox', value && 'checkbox--active');
    const iconName = `checkbox-${value ? 'enabled' : 'disabled'}`;

    const handleClick = () => {
        onChange(!value);
    };

    return (
        <button
            className={classes}
            onClick={handleClick}
            type="button"
        >
            <div className="checkbox__content">
                <div className="checkbox__box">
                    <Icon name={iconName} className="checkbox__box-icon" />
                </div>
                <div className="checkbox__title">
                    {title}
                </div>
            </div>
            {description && (
                <div className="checkbox__description">
                    {description}
                </div>
            )}
        </button>
    );
}
