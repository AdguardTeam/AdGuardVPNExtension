import React from 'react';

import './checkbox.pcss';

const checkbox = ({ children, id, value }) => (
    <label
        htmlFor={id}
        className="checkbox"
    >
        <input
            id={id}
            type="checkbox"
            defaultValue={value}
            className="checkbox__in"
        />
        <div className="checkbox__custom">
            <svg className="icon icon--button checkbox__icon">
                <use xlinkHref="#check" />
            </svg>
        </div>
        {children}
    </label>
);

export default checkbox;
