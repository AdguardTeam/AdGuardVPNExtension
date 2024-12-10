import React from 'react';

import { Switch } from '../Switch';

import { type ControlsProps, Controls } from './Controls';

export interface ControlsSwitchProps {
    title: ControlsProps['title'];
    description?: ControlsProps['description'];
    isActive: boolean;
    onToggle: () => void;
}

export function ControlsSwitch({
    title,
    description,
    isActive,
    onToggle,
}: ControlsSwitchProps) {
    return (
        <Controls
            title={title}
            description={description}
            action={<Switch isActive={isActive} onToggle={onToggle} />}
            onClick={onToggle}
        />
    );
}
