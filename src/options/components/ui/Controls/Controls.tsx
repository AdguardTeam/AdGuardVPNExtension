import React from 'react';

import './controls.pcss';

export interface ControlsProps {
    title: string | React.ReactNode;
    description?: string | React.ReactNode;
    action?: React.ReactNode;
}

export function Controls({ title, description, action }: ControlsProps) {
    return (
        <div className="controls">
            <div className="controls__content">
                <div className="controls__title">{title}</div>
                <div className="controls__action">{action}</div>
            </div>
            <div className="controls__description">{description}</div>
        </div>
    );
}
