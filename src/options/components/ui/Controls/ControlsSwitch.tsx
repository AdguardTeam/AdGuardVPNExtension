import React from 'react';

import { Switch } from '../Switch';

import { type ControlsProps, Controls } from './Controls';

export interface ControlsSwitchProps {
    title: ControlsProps['title'];
    description?: ControlsProps['description'];
    value: boolean;
    onToggle: () => void;
}

export function ControlsSwitch({
    title,
    description,
    value,
    onToggle,
}: ControlsSwitchProps) {
    return (
        <Controls
            title={title}
            description={description}
            action={<Switch value={value} onToggle={onToggle} />}
            onClick={onToggle}
        />
    );
}
