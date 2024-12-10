import React from 'react';

import classNames from 'classnames';

import './switch.pcss';

export interface SwitchProps {
    isActive: boolean;
    onToggle: () => void;
}

export function Switch({ isActive, onToggle }: SwitchProps) {
    const classes = classNames(
        'switch has-tab-focus',
        isActive && 'switch--active',
    );

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onToggle();
    };

    return (
        <button
            className={classes}
            onClick={handleClick}
            type="button"
        >
            <span className="switch__wrapper">
                <span className="switch__knob" />
            </span>
        </button>
    );
}
