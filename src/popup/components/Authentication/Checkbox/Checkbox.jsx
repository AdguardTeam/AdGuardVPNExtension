import React from 'react';

export const Checkbox = ({
    id,
    checked,
    onChange,
    label,
}) => {
    const onChangeHandler = (e) => {
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
