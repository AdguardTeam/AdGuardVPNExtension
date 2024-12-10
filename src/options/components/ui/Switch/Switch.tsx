import React from 'react';

import classNames from 'classnames';

import './switch.pcss';

export interface SwitchProps {
    /**
     * Is the switch active or not.
     */
    isActive: boolean;

    /**
     * On toggle handler.
     */
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
