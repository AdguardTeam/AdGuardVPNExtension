import React, { useState } from 'react';

import './checkbox.pcss';

type CheckboxProps = {
    label: React.ReactNode,
    id: string,
    value: boolean,
};

export const Checkbox = ({ label, id, value }: CheckboxProps) => {
    const [checkedValue, setCheckedValue] = useState(value);
    return (
        <div className="checkbox">
            <input
                id={id}
                type="checkbox"
                checked={checkedValue}
                className="checkbox__in"
                onChange={() => setCheckedValue(!checkedValue)}
            />
            <label
                htmlFor={id}
                className="checkbox__label"
            >
                {label}
            </label>
        </div>
    );
};
