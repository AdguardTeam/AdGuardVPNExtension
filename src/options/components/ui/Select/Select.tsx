import React, { useRef, useState } from 'react';

import classNames from 'classnames';

import { Icon } from '../Icon';
import { useOnClickOutside } from '../../../hooks/useOnOutsideClick';

import './select.pcss';

interface SelectOptionItem<T> {
    value: T;
    title: string | React.ReactNode;
}

interface SelectOptionProps<T> extends SelectOptionItem<T> {
    active?: boolean;
    onClick: (value: T) => void;
}

function SelectOption<T extends string>({
    value,
    title,
    active,
    onClick,
}: SelectOptionProps<T>) {
    const handleClick = () => {
        onClick(value);
    };

    return (
        <button
            className={classNames('select__item', active && 'select__item--active')}
            type="button"
            onClick={handleClick}
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
}

export function Select<T extends string>({
    value,
    options,
    onChange,
    active: outsideActive,
    onActiveChange,
}: SelectProps<T>) {
    const activeItem = options.find((option) => option.value === value);

    const ref = useRef<HTMLDivElement>(null);
    const [localActive, setLocalActive] = useState(false);
    const active = outsideActive !== undefined ? outsideActive : localActive;
    const setActive = (value: boolean | ((oldValue: boolean) => boolean)) => {
        if (!onActiveChange) {
            setLocalActive(value);
        }
    };

    const handleChange = (value: T) => {
        setActive(false);
        onChange(value);
    };

    useOnClickOutside(ref, () => setActive(false));

    return (
        <div ref={ref} className={classNames('select', active && 'select--active')}>
            <button
                className="select__btn"
                type="button"
                onClick={() => setActive((current) => !current)}
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
                        onClick={handleChange}
                    />
                ))}
            </div>
        </div>
    );
}
