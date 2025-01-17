import React, { useRef, useState } from 'react';

import classNames from 'classnames';

import { useOutsideClick } from '../../../../common/components/ui/useOutsideClick';
import { useOutsideFocus } from '../../../../common/components/ui/useOutsideFocus';
import { Icon } from '../Icon';

import './select.pcss';

/**
 * Select option item.
 */
interface SelectOptionItem<T> {
    /**
     * Value of the option.
     */
    value: T;

    /**
     * Title of the option.
     */
    title: React.ReactNode;

    /**
     * Should skip rendering of the option.
     */
    shouldSkip?: boolean;

    /**
     * Is the select active or not. Used to control tab index.
     */
    isSelectActive?: boolean;
}

/**
 * SelectOption component props.
 */
interface SelectOptionProps<T> extends SelectOptionItem<T> {
    /**
     * Is the option is selected one or not.
     */
    isActive?: boolean;

    /**
     * Click event handler.
     */
    onClick: (value: T) => void;
}

function SelectOption<T extends string>({
    value,
    title,
    isActive,
    shouldSkip,
    isSelectActive,
    onClick,
}: SelectOptionProps<T>) {
    const classes = classNames(
        'select__item has-tab-focus',
        isActive && 'select__item--active',
    );

    const handleClick = () => {
        onClick(value);
    };

    if (shouldSkip) {
        return null;
    }

    return (
        <button
            className={classes}
            type="button"
            onClick={handleClick}
            tabIndex={!isSelectActive ? -1 : undefined}
        >
            {title}
            <Icon name="tick" className="select__item-icon" />
        </button>
    );
}

/**
 * Select component props.
 */
export interface SelectProps<T> {
    /**
     * Current selected value of the select.
     */
    value: T;

    /**
     * Options of the select.
     */
    options: SelectOptionItem<T>[];

    /**
     * Is the select active or not.
     */
    isActive?: boolean;

    /**
     * Change event handler.
     */
    onChange: (value: T) => void;

    /**
     * Is active change event handler.
     */
    onIsActiveChange?: (value: boolean | ((oldValue: boolean) => boolean)) => void;
}

export function Select<T extends string>({
    value,
    options,
    isActive: outsideActive,
    onChange,
    onIsActiveChange,
}: SelectProps<T>) {
    const activeItem = options.find((option) => option.value === value);

    const ref = useRef<HTMLDivElement>(null);

    const [localActive, setLocalActive] = useState(false);
    const isActive = outsideActive !== undefined ? outsideActive : localActive;

    const classes = classNames(
        'select',
        isActive && 'select--active',
    );

    const setActive = (value: boolean | ((oldValue: boolean) => boolean)) => {
        if (!onIsActiveChange) {
            setLocalActive(value);
        }
    };

    const handleClose = () => {
        setActive(false);
    };

    const handleToggle = () => {
        setActive((currentActive) => !currentActive);
    };

    const handleChange = (value: T) => {
        handleClose();
        onChange(value);
    };

    useOutsideClick(ref, handleClose);
    useOutsideFocus(ref, handleClose);

    return (
        <div ref={ref} className={classes}>
            <button
                className="select__btn has-tab-focus"
                type="button"
                onClick={handleToggle}
            >
                <span className="select__btn-text text-ellipsis">
                    {activeItem?.title}
                </span>
                <Icon name="arrow-down" className="select__btn-icon" />
            </button>
            <div className="select__list">
                {options.map((option) => (
                    <SelectOption
                        key={option.value}
                        value={option.value}
                        title={option.title}
                        isActive={option.value === value}
                        shouldSkip={option.shouldSkip}
                        isSelectActive={isActive}
                        onClick={handleChange}
                    />
                ))}
            </div>
        </div>
    );
}
