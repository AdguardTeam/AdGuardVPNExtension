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
            <label htmlFor={id} className={`switch__label ${checked && 'switch__label--active'}`}>
                {checked ? (
                    <svg className="icon switch__icon switch__icon--check">
                        <use xlinkHref="#check_bold" />
                    </svg>
                ) : (
                    <svg className="icon switch__icon switch__icon--cross">
                        <use xlinkHref="#cross_bold" />
                    </svg>
                )}
            </label>
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
