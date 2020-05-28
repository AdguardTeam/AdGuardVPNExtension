import React from 'react';
import classnames from 'classnames';

function PasswordField({
    id,
    label,
    password,
    handleChange,
    error,
    inputType,
    handleInputTypeChange,
    icon,
    placeholder = '',
}) {
    const inputClassName = classnames('form__input form__input--password', { 'form__input--error': error });

    return (
        <div className="form__item">
            <label htmlFor={id} className="form__label">
                {label}
            </label>
            <input
                id={id}
                name={id}
                className={inputClassName}
                type={inputType}
                onChange={handleChange}
                value={password}
                placeholder={placeholder}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
            />
            {icon && (
                <button
                    type="button"
                    tabIndex="-1"
                    className="button form__show-password"
                    onClick={handleInputTypeChange}
                >
                    <svg className="icon icon--button">
                        <use xlinkHref={icon} />
                    </svg>
                </button>
            )}
        </div>
    );
}

export default PasswordField;
