import React, { useState } from 'react';

import './checkbox.pcss';

type CheckboxProps = {
    children: React.ReactNode,
    id: string,
    value: boolean,
};

export const Checkbox = ({ children, id, value }: CheckboxProps) => {
    const [checkedValue, setCheckedValue] = useState(value);
    return (
        <label
            htmlFor={id}
            className="checkbox"
        >
            <input
                id={id}
                type="checkbox"
                checked={checkedValue}
                className="checkbox__in"
            />
            <button
                type="button"
                onClick={() => setCheckedValue(!checkedValue)}
                className="checkbox__custom"
            >
                <svg className="icon icon--button checkbox__icon">
                    <use xlinkHref="#check" />
                </svg>
            </button>
            {children}
        </label>
    );
};
