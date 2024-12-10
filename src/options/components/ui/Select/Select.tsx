import React, { useRef, useState } from 'react';

import classNames from 'classnames';

import { useOutsideClick } from '../../../../common/components/ui/useOutsideClick';
import { useOutsideFocus } from '../../../../common/components/ui/useOutsideFocus';
import { Icon } from '../Icon';

import './select.pcss';

interface SelectOptionItem<T> {
    value: T;
    title: React.ReactNode;
    shouldSkip?: boolean;
    open?: boolean;
}

interface SelectOptionProps<T> extends SelectOptionItem<T> {
    isActive?: boolean;
    onClick: (value: T) => void;
}

function SelectOption<T extends string>({
    value,
    title,
    isActive,
    shouldSkip,
    open,
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
            tabIndex={!open ? -1 : undefined}
        >
            {title}
            <Icon name="tick" className="select__item-icon" />
        </button>
    );
}

export interface SelectProps<T> {
    value: T;
    options: SelectOptionItem<T>[];
    onChange: (value: T) => void;
    isActive?: boolean;
    onIsActiveChange?: (value: boolean | ((oldValue: boolean) => boolean)) => void;
}

export function Select<T extends string>({
    value,
    options,
    onChange,
    isActive: outsideActive,
    onIsActiveChange,
}: SelectProps<T>) {
    const activeItem = options.find((option) => option.value === value);

    const ref = useRef<HTMLDivElement>(null);

    const [localActive, setLocalActive] = useState(false);
    const active = outsideActive !== undefined ? outsideActive : localActive;

    const classes = classNames(
        'select',
        active && 'select--active',
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
                {activeItem?.title}
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
                        open={active}
                        onClick={handleChange}
                    />
                ))}
            </div>
        </div>
    );
}
