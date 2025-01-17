import React, { useState } from 'react';

import classNames from 'classnames';

import { Icon } from '../Icon';

import './checkbox.pcss';

export interface CheckboxProps {
    id?: string;
    label: React.ReactNode;
    value: boolean;
    onToggle?: () => void;
}

export function Checkbox({
    id,
    label,
    value,
    onToggle,
}: CheckboxProps) {
    const [checkedValue, setCheckedValue] = useState(value);
    const classes = classNames(
        'checkbox has-tab-focus',
        checkedValue && 'checkbox--active',
    );
    const iconName = `checkbox-${checkedValue ? 'enabled' : 'disabled'}`;

    const handleChange = () => {
        setCheckedValue((prevValue) => !prevValue);
        if (onToggle) {
            onToggle();
        }
    };

    return (
        <label
            htmlFor={id}
            className={classes}
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
        >
            <Icon name={iconName} className="checkbox__icon" />
            <input
                id={id}
                type="checkbox"
                checked={value}
                className="checkbox__input"
                tabIndex={-1}
                onChange={handleChange}
            />
            <div className="checkbox__label">
                {label}
            </div>
        </label>
    );
}
