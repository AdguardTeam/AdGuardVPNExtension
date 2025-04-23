import React from 'react';

import classnames from 'classnames';

import { type CredentialsKey } from '../../stores/AuthStore';
import { Icon } from '../ui/Icon';

interface InputFieldParameters {
    id: CredentialsKey;
    type: string;
    value: string;
    onChange?: (id: CredentialsKey, value: string) => void;
    error?: string | null;
    className?: string;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    title?: string;
    autocomplete?: string;
}

export const InputField = ({
    id,
    type,
    value,
    onChange,
    error,
    className = '',
    placeholder = '',
    label = '',
    disabled = false,
    title = '',
    autocomplete,
}: InputFieldParameters) => {
    const inputClassName = classnames(
        `form__input form__input--with-button ${className}`,
        { 'form__input--error': error },
    );

    const buttonClassName = classnames(
        'button button--close form__input-btn',
        { 'form__input-btn--active': !disabled && value.length > 0 },
    );

    const handleChange = (value: string) => {
        if (onChange) {
            onChange(id, value);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleChange(e.target.value);
    };

    const handleClear = () => {
        handleChange('');
    };

    return (
        <div className="form__item">
            <label>
                <div className="form__label">
                    {label}
                </div>
                <div className="form__input-wrapper">
                    <input
                        id={id}
                        name={id}
                        className={inputClassName}
                        type={type}
                        onChange={handleInputChange}
                        value={value}
                        title={title}
                        placeholder={placeholder}
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus
                        disabled={disabled}
                        autoComplete={autocomplete}
                    />
                    <button
                        type="button"
                        className={buttonClassName}
                        onClick={handleClear}
                    >
                        <Icon
                            icon="cross"
                            className="icon--button"
                        />
                    </button>
                </div>
            </label>
        </div>
    );
};
