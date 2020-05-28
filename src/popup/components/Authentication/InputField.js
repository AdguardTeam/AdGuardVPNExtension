import React from 'react';
import classnames from 'classnames';

function InputField({
    id,
    type,
    value,
    label,
    inputChangeHandler,
    error,
    className = '',
    placeholder = '',
}) {
    const inputClassName = classnames(
        `form__input ${className}`,
        { 'form__input--error': error }
    );

    return (
        <div className="form__item">
            <label htmlFor={id} className="form__label">
                {label}
            </label>
            <input
                id={id}
                name={id}
                className={inputClassName}
                type={type}
                onChange={inputChangeHandler}
                value={value}
                placeholder={placeholder}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
            />
        </div>
    );
}

export default InputField;
