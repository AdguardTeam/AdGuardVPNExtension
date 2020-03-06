import React from 'react';
import classnames from 'classnames';

function InputField({
    id, type, value, label, inputChangeHandler, error, autoFocus = true, className = '',
}) {
    const inputClassName = classnames(
        `form__input ${className}`,
        { 'form__input--error': error }
    );

    return (
        <div className="form__item">
            <label className="form__label" htmlFor={id}>
                {label}
            </label>
            <input
                id={id}
                name={id}
                className={inputClassName}
                type={type}
                onChange={inputChangeHandler}
                value={value}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus={autoFocus}
            />
        </div>
    );
}

export default InputField;
