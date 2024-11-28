import React, { useRef, useState } from 'react';

import classNames from 'classnames';

import { Icon } from '../Icon';
import { useOnClickOutside } from '../../../hooks/useOnOutsideClick';
import { useFocusTrap } from '../../../hooks/useFocusTrap';

import './select.pcss';

interface SelectOptionItem<T> {
    value: T;
    title: React.ReactNode;
    skip?: boolean;
    open?: boolean;
}

interface SelectOptionProps<T> extends SelectOptionItem<T> {
    active?: boolean;
    onClick: (value: T) => void;
}

function SelectOption<T extends string>({
    value,
    title,
    active,
    skip,
    open,
    onClick,
}: SelectOptionProps<T>) {
    const classes = classNames('select__item', active && 'select__item--active');

    const handleClick = () => {
        onClick(value);
    };

    if (skip) {
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
    active?: boolean;
    onActiveChange?: (value: boolean | ((oldValue: boolean) => boolean)) => void;
    variant?: 'default' | 'dimmed';
}

export function Select<T extends string>({
    value,
    options,
    onChange,
    active: outsideActive,
    onActiveChange,
    variant = 'default',
}: SelectProps<T>) {
    const activeItem = options.find((option) => option.value === value);

    const ref = useRef<HTMLDivElement>(null);

    const [localActive, setLocalActive] = useState(false);
    const active = outsideActive !== undefined ? outsideActive : localActive;

    const classes = classNames(
        'select',
        active && 'select--active',
        `select--${variant}`,
    );

    const setActive = (value: boolean | ((oldValue: boolean) => boolean)) => {
        if (!onActiveChange) {
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

    useOnClickOutside(ref, handleClose);
    useFocusTrap(ref, active);

    return (
        <div ref={ref} className={classes}>
            <button
                className="select__btn"
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
                        active={option.value === value}
                        skip={option.skip}
                        open={active}
                        onClick={handleChange}
                    />
                ))}
            </div>
        </div>
    );
}
