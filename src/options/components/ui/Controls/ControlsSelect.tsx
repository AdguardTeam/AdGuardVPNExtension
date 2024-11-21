import React, { useRef, useState } from 'react';

import { Select, type SelectProps } from '../Select';
import { useElementRect } from '../../../hooks/useElementRect';

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
    const [active, setActive] = useState(false);

    useElementRect(ref, 'controls');

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
                    active={active}
                    onActiveChange={setActive}
                />
            )}
            onClick={() => setActive((current) => !current)}
            onOutsideClick={() => setActive(false)}
        />
    );
}
