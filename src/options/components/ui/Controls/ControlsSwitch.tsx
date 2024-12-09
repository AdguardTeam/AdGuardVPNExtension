import React from 'react';

import { Switch } from '../Switch';

import { type ControlsProps, Controls } from './Controls';

export interface ControlsSwitchProps {
    title: ControlsProps['title'];
    description?: ControlsProps['description'];
    active: boolean;
    onToggle: () => void;
}

export function ControlsSwitch({
    title,
    description,
    active,
    onToggle,
}: ControlsSwitchProps) {
    return (
        <Controls
            title={title}
            description={description}
            action={<Switch active={active} onToggle={onToggle} />}
            onClick={onToggle}
        />
    );
}
