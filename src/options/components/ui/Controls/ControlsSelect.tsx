import React, { useRef, useState } from 'react';

import classNames from 'classnames';

import { Select, type SelectProps } from '../Select';

import { Controls, type ControlsProps } from './Controls';

/**
 * ControlsSelect component props.
 */
export interface ControlsSelectProps<T> {
    /**
     * Title of the controls.
     */
    title: ControlsProps['title'];

    /**
     * Description of the controls.
     */
    description?: ControlsProps['description'];

    /**
     * Current selected value of the select.
     */
    value: SelectProps<T>['value'];

    /**
     * Options of the select.
     */
    options: SelectProps<T>['options'];

    /**
     * Change event handler.
     */
    onChange: SelectProps<T>['onChange'];
}

export function ControlsSelect<T extends string>({
    title,
    description,
    value,
    options,
    onChange,
}: ControlsSelectProps<T>) {
    const ref = useRef<HTMLDivElement>(null);
    const classes = classNames(
        'controls--select',
        // If description is not provided title and select should be aligned to center.
        !description && 'controls--select-align-center',
    );

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
            className={classes}
            onClick={handleClick}
            onOutsideClick={handleOutsideClickOrFocus}
            onOutsideFocus={handleOutsideClickOrFocus}
        />
    );
}
