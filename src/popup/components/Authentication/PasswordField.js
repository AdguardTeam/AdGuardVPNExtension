import React from 'react';
import classnames from 'classnames';

const PasswordField = ({
    id,
    password,
    handleChange,
    error = false,
    inputType,
    handleInputTypeChange,
    icon,
    placeholder = '',
    label = '',
    focus = false,
}) => {
    const inputClassName = classnames('form__input form__input--password', { 'form__input--error': error });

    return (
        <div className="form__item">
            <label>
                <div className="form__label">
                    {label}
                </div>
                <input
                    id={id}
                    name={id}
                    className={inputClassName}
                    type={inputType}
                    onChange={handleChange}
                    value={password}
                    placeholder={placeholder}
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus={focus}
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
            </label>
        </div>
    );
};

export default PasswordField;
