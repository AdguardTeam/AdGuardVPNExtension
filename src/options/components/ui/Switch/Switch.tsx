import React from 'react';

import classNames from 'classnames';

import './switch.pcss';

export interface SwitchProps {
    value: boolean;
    onToggle: () => void;
}

export function Switch({ value, onToggle }: SwitchProps) {
    const classes = classNames('switch', value && 'switch--active');

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
