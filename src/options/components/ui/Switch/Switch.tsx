import React from 'react';

import classNames from 'classnames';

import './switch.pcss';

export interface SwitchProps {
    active: boolean;
    onToggle: () => void;
}

export function Switch({ active, onToggle }: SwitchProps) {
    const classes = classNames('switch', active && 'switch--active');

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
