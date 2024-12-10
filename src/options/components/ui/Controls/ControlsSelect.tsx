import React, { useRef, useState } from 'react';

import { Select, type SelectProps } from '../Select';

import { Controls, type ControlsProps } from './Controls';

export interface ControlsSelectProps<T> {
    title: ControlsProps['title'];
    description?: ControlsProps['description'];
    value: T;
    options: SelectProps<T>['options'];
    onChange: (value: T) => void;
}

export function ControlsSelect<T extends string>({
    title,
    description,
    value,
    options,
    onChange,
}: ControlsSelectProps<T>) {
    const ref = useRef<HTMLDivElement>(null);

    const [isActive, setIsActive] = useState(false);

    const handleClick = () => {
        setIsActive((currentActive) => !currentActive);
    };

    const handleOutsideClickOrFocus = () => {
        setIsActive(false);
    };

    return (
        <Controls
            ref={ref}
            title={title}
            description={description}
            action={(
                <Select
                    value={value}
                    options={options}
                    onChange={onChange}
                    isActive={isActive}
                    onIsActiveChange={setIsActive}
                />
            )}
            isActive={isActive}
            className="controls--select"
            onClick={handleClick}
            onOutsideClick={handleOutsideClickOrFocus}
            onOutsideFocus={handleOutsideClickOrFocus}
        />
    );
}
