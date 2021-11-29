import React from 'react';
import classnames from 'classnames';

const InputField = ({
    id,
    type,
    value,
    inputChangeHandler,
    error,
    className = '',
    placeholder = '',
}) => {
    const inputClassName = classnames(
        `form__input ${className}`,
        { 'form__input--error': error },
    );

    return (
        <div className="form__item">
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
};

export default InputField;
