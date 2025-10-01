import React, { type ReactElement, useState } from 'react';

import classNames from 'classnames';

import { Icon } from '../../../../common/components/Icons';

import './checkbox.pcss';

/**
 * Checkbox component props.
 */
export interface CheckboxProps {
    /**
     * ID of input.
     */
    id?: string;

    /**
     * Label.
     */
    label: React.ReactNode;

    /**
     * Current value.
     *
     * Note: If {@link onToggle} not provided, state will be controlled locally,
     * and this value will be considered only as initial value.
     */
    value: boolean;

    /**
     * On toggle handler.
     *
     * Note: If not provided, state will be controlled locally,
     * and {@link value} will be considered only as initial value.
     */
    onToggle?: () => void;
}

/**
 * Checkbox component.
 */
export function Checkbox({
    id,
    label,
    value,
    onToggle,
}: CheckboxProps): ReactElement {
    const [checkedValue, setCheckedValue] = useState(value);
    const computedValue = onToggle ? value : checkedValue;
    const classes = classNames(
        'checkbox has-tab-focus',
        computedValue && 'checkbox--active',
    );
    const iconName = `checkbox-${computedValue ? 'enabled' : 'disabled'}`;

    const handleChange = (): void => {
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
            <Icon name={iconName} color={computedValue ? 'product' : 'gray'} />
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
