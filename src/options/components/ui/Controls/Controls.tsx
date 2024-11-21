import React from 'react';

import classNames from 'classnames';

import './controls.pcss';

export interface ControlsProps {
    title: string | React.ReactNode;
    description?: string | React.ReactNode;
    action?: React.ReactNode;
    onClick?: () => void;
}

export function Controls({
    title,
    description,
    action,
    onClick,
}: ControlsProps) {
    return (
        <div
            className={classNames('controls', !!onClick && 'controls--hoverable')}
            onClick={onClick}
        >
            <div className="controls__content">
                <div className="controls__title">{title}</div>
                <div className="controls__description">{description}</div>
            </div>
            <div className="controls__action">{action}</div>
        </div>
    );
}
