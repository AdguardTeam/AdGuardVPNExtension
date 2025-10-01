import React, { type ReactElement } from 'react';

import { Switch, type SwitchProps } from '../Switch';

import { type ControlsProps, Controls } from './Controls';

/**
 * ControlsSwitch component props.
 */
export interface ControlsSwitchProps {
    /**
     * Title of the controls.
     */
    title: ControlsProps['title'];

    /**
     * Description of the controls.
     */
    description?: ControlsProps['description'];

    /**
     * Is the switch active or not.
     */
    isActive: SwitchProps['isActive'];

    /**
     * Toggle event handler.
     */
    onToggle: SwitchProps['onToggle'];
}

export function ControlsSwitch({
    title,
    description,
    isActive,
    onToggle,
}: ControlsSwitchProps): ReactElement {
    return (
        <Controls
            title={title}
            description={description}
            action={<Switch isActive={isActive} onToggle={onToggle} />}
            onClick={onToggle}
        />
    );
}
