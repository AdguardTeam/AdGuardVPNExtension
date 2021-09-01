import React from 'react';

import './switch.pcss';

export const Switch = ({
    id,
    title,
    desc,
    checked,
    handleToggle,
}) => {
    return (
        <div className="switch">
            <div className="switch__info">
                <div className="switch__title">
                    {title}
                </div>
                <div className="switch__desc">
                    {desc}
                </div>
            </div>
            <label htmlFor={id} className={`switch__label ${checked && 'switch__label--active'}`} />
            <input
                id={id}
                name={id}
                type="checkbox"
                className="switch__input"
                checked={checked}
                onChange={handleToggle}
            />
        </div>
    );
};
