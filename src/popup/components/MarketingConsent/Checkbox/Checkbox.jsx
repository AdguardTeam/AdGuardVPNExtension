import React from 'react';

// FIXME consider moving to the common components directory
export const Checkbox = ({
    id,
    checked,
    onChange,
    label,
}) => {
    const onChangeHandler = (e) => {
        // FIXME check
        onChange(e.currentTarget.checked);
    };

    return (
        <>
            <label htmlFor={id}>
                {label}
            </label>
            <input
                id={id}
                name={id}
                type="checkbox"
                checked={checked}
                onChange={onChangeHandler}
            />
        </>
    );
};
