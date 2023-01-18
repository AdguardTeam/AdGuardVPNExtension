import React from 'react';

import './checkbox.pcss';

type CheckboxProps = {
    children: React.ReactNode,
    id: string,
    value: boolean,
};

export const Checkbox = ({ children, id, value }: CheckboxProps) => (
    <label
        htmlFor={id}
        className="checkbox"
    >
        <input
            id={id}
            type="checkbox"
            defaultChecked={value}
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
