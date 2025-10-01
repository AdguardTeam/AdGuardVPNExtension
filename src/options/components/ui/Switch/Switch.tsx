import React, { type ReactElement } from 'react';

import classNames from 'classnames';

import './switch.pcss';

/**
 * Switch component props.
 */
export interface SwitchProps {
    /**
     * Is the switch active or not.
     */
    isActive: boolean;

    /**
     * Toggle event handler.
     */
    onToggle: () => void;
}

export function Switch({ isActive, onToggle }: SwitchProps): ReactElement {
    const classes = classNames(
        'switch has-tab-focus',
        isActive && 'switch--active',
    );

    const handleClick = (e: React.MouseEvent): void => {
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
